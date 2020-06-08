import {
  AllPublishOptions,
  newError,
  safeStringifyJson,
  BlockMap,
  CURRENT_APP_INSTALLER_FILE_NAME
} from "builder-util-runtime";

import { createServer } from "http";
import { AppAdapter } from "./AppAdapter";
import { BaseUpdater } from "./BaseUpdater";
import {
  UpdateDownloadedEvent,
  newUrlFromBase,
  ResolvedUpdateFileInfo
} from "./main";
import { findFile, Provider } from "./providers/Provider";
import AutoUpdater = Electron.AutoUpdater;
import { DownloadUpdateOptions } from "./AppUpdater";
import { GenericDifferentialDownloader } from "./differentialDownloader/GenericDifferentialDownloader";
import path from "path";
import { gunzipSync } from "zlib";

export class MacUpdater extends BaseUpdater {
  protected doInstall(
    options: import("./BaseUpdater").InstallOptions
  ): boolean {
    throw new Error("Method not implemented.");
  }
  private readonly nativeUpdater: AutoUpdater = require("electron").autoUpdater;

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
            CURRENT_APP_INSTALLER_FILE_NAME
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
      }
    });
  }

  quitAndInstall(): void {
    this.nativeUpdater.quitAndInstall();
  }
}
