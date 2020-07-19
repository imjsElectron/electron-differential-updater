import {
  AllPublishOptions,
  newError,
  safeStringifyJson,
  BlockMap,
  CURRENT_APP_INSTALLER_FILE_NAME
} from "builder-util-runtime";
import { stat } from "fs-extra";
import { createReadStream } from "fs";
import { AppAdapter } from "./AppAdapter";
import { BaseUpdater } from "./BaseUpdater";
import {
  UpdateDownloadedEvent,
  newUrlFromBase,
  ResolvedUpdateFileInfo
} from "./main";
import { findFile, Provider } from "./providers/Provider";
import AutoUpdater = Electron.AutoUpdater;
import { createServer, IncomingMessage, ServerResponse } from "http";
import { AddressInfo } from "net";
import { DownloadUpdateOptions } from "./AppUpdater";
import { GenericDifferentialDownloader } from "./differentialDownloader/GenericDifferentialDownloader";
import path from "path";
import { gunzipSync } from "zlib";
import electron from "electron";

export class MacUpdater extends BaseUpdater {
  updateAvailable!: boolean;
  protected doInstall(
    options: import("./BaseUpdater").InstallOptions
  ): boolean {
    throw new Error("Method not implemented.");
  }
  private readonly nativeUpdater: AutoUpdater = electron.autoUpdater;

  private updateInfoForPendingUpdateDownloadedEvent: UpdateDownloadedEvent | null = null;

  constructor(options?: AllPublishOptions, app?: AppAdapter) {
    super(options, app);
    this.nativeUpdater.on("error", it => {
      this._logger.warn(it);
      this.emit("error", it);
    });
    this.nativeUpdater.on("update-downloaded", () => {
      const updateInfo = this.updateInfoForPendingUpdateDownloadedEvent;
      this.updateInfoForPendingUpdateDownloadedEvent = null;
      this.dispatchUpdateDownloaded(updateInfo!!);
    });
  }
  private async differentialDownloadInstaller(
    fileInfo: ResolvedUpdateFileInfo,
    downloadUpdateOptions: DownloadUpdateOptions,
    installerPath: string,
    provider: Provider<any>
  ): Promise<boolean> {
    try {
      if (
        this._testOnlyOptions != null &&
        !this._testOnlyOptions.isUseDifferentialDownload
      ) {
        return true;
      }

      const newBlockMapUrl = newUrlFromBase(
        `${fileInfo.url.pathname}.blockmap`,
        fileInfo.url
      );
      const oldBlockMapUrl = newUrlFromBase(
        `${fileInfo.url.pathname.replace(
          new RegExp(
            downloadUpdateOptions.updateInfoAndProvider.info.version,
            "g"
          ),
          this.app.version
        )}.blockmap`,
        fileInfo.url
      );
      this._logger.info(
        `Download block maps (old: "${oldBlockMapUrl.href}", new: ${newBlockMapUrl.href})`
      );

      const downloadBlockMap = async (url: URL): Promise<BlockMap> => {
        const data = await this.httpExecutor.downloadToBuffer(url, {
          headers: downloadUpdateOptions.requestHeaders,
          cancellationToken: downloadUpdateOptions.cancellationToken
        });

        if (data == null || data.length === 0) {
          throw new Error(`Blockmap "${url.href}" is empty`);
        }

        try {
          return JSON.parse(gunzipSync(data).toString());
        } catch (e) {
          throw new Error(
            `Cannot parse blockmap "${url.href}", error: ${e}, raw data: ${data}`
          );
        }
      };

      const blockMapDataList = await Promise.all([
        downloadBlockMap(oldBlockMapUrl),
        downloadBlockMap(newBlockMapUrl)
      ]);
      await new GenericDifferentialDownloader(
        fileInfo.info,
        this.httpExecutor,
        {
          newUrl: fileInfo.url,
          oldFile: path.join(
            this.downloadedUpdateHelper!!.cacheDir,
            process.platform === "darwin"
              ? `${this.app.name}-${this.app.version}-mac.zip`
              : CURRENT_APP_INSTALLER_FILE_NAME
          ),
          logger: this._logger,
          newFile: installerPath,
          isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
          requestHeaders: downloadUpdateOptions.requestHeaders
        }
      ).download(
        blockMapDataList[0],
        blockMapDataList[1],
        this.emit.bind(this)
      );
      return false;
    } catch (e) {
      this._logger.error(
        `Cannot download differentially, fallback to full download: ${e.stack ||
          e}`
      );
      if (this._testOnlyOptions != null) {
        // test mode
        throw e;
      }
      return true;
    }
  }
  protected doDownloadUpdate(
    downloadUpdateOptions: DownloadUpdateOptions
  ): Promise<Array<string>> {
    this.updateInfoForPendingUpdateDownloadedEvent = null;
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const files = downloadUpdateOptions.updateInfoAndProvider.provider.resolveFiles(
      downloadUpdateOptions.updateInfoAndProvider.info
    );
    const zipFileInfo = findFile(files, "zip", ["pkg", "dmg"]);
    if (zipFileInfo == null) {
      throw newError(
        `ZIP file not provided: ${safeStringifyJson(files)}`,
        "ERR_UPDATER_ZIP_FILE_NOT_FOUND"
      );
    }
    const server = createServer();
    server.on("close", () => {
      this._logger.info(
        `Proxy server for native Squirrel.Mac is closed (was started to download ${zipFileInfo.url.href})`
      );
    });
    function getServerUrl(): string {
      const address = server.address() as AddressInfo;
      return `http://127.0.0.1:${address.port}`;
    }
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: zipFileInfo,
      downloadUpdateOptions,
      task: async (destinationFile, downloadOptions) => {
        try {
          if (
            await this.differentialDownloadInstaller(
              zipFileInfo,
              downloadUpdateOptions,
              destinationFile,
              provider
            )
          ) {
            await this.httpExecutor.download(
              zipFileInfo.url,
              destinationFile,
              downloadOptions
            );
          }
        } catch (e) {
          console.log(e);
        }
      },
      done: async event => {
        const downloadedFile = event.downloadedFile;
        this.updateInfoForPendingUpdateDownloadedEvent = event;
        let updateFileSize = zipFileInfo.info.size;
        if (updateFileSize == null) {
          updateFileSize = (await stat(downloadedFile)).size;
        }

        return await new Promise<Array<string>>((resolve, reject) => {
          // insecure random is ok
          const fileUrl =
            "/" + Date.now() + "-" + Math.floor(Math.random() * 9999) + ".zip";
          server.on(
            "request",
            (request: IncomingMessage, response: ServerResponse) => {
              const requestUrl = request.url!!;
              this._logger.info(`${requestUrl} requested`);
              if (requestUrl === "/") {
                const data = Buffer.from(
                  `{ "url": "${getServerUrl()}${fileUrl}" }`
                );
                response.writeHead(200, {
                  "Content-Type": "application/json",
                  "Content-Length": data.length
                });
                response.end(data);
                return;
              }

              if (!requestUrl.startsWith(fileUrl)) {
                this._logger.warn(`${requestUrl} requested, but not supported`);
                response.writeHead(404);
                response.end();
                return;
              }

              this._logger.info(
                `${fileUrl} requested by Squirrel.Mac, pipe ${downloadedFile}`
              );

              let errorOccurred = false;
              response.on("finish", () => {
                try {
                  setImmediate(() => server.close());
                } finally {
                  if (!errorOccurred) {
                    this.nativeUpdater.removeListener("error", reject);
                    resolve([]);
                  }
                }
              });

              const readStream = createReadStream(downloadedFile);
              readStream.on("error", error => {
                try {
                  response.end();
                } catch (e) {
                  this._logger.warn(`cannot end response: ${e}`);
                }
                errorOccurred = true;
                this.nativeUpdater.removeListener("error", reject);
                reject(new Error(`Cannot pipe "${downloadedFile}": ${error}`));
              });

              response.writeHead(200, {
                "Content-Type": "application/zip",
                "Content-Length": updateFileSize
              });
              readStream.pipe(response);
            }
          );
          server.listen(0, "127.0.0.1", () => {
            this.nativeUpdater.setFeedURL({
              url: getServerUrl(),
              headers: { "Cache-Control": "no-cache" }
            });

            this.nativeUpdater.once("error", reject);
            this.nativeUpdater.checkForUpdates();
          });
        });
      }
    });
  }

  quitAndInstall(): void {
    this.nativeUpdater.quitAndInstall();
  }
}
