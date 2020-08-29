const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const { getAppCacheDir } = require("./AppAdapter");
import { ElectronAppAdapter } from "./ElectronAppAdapter";

const app = new ElectronAppAdapter();
let APP_NAME;
let APP_VERSION;
let isZipCreatedForDiffDownload = false;

function prepareAppZip() {
  APP_NAME = app.name;
  APP_VERSION = app.version;
  if (process.platform === "win32") {
    console.log(
      "This method only supports MAC, windows create default app installer on installation"
    );
    isZipCreatedForDiffDownload = true;
    return;
  }
  const appCacheDirName = path.join(
    getAppCacheDir(),
    app.isPackaged ? `${APP_NAME}-updater` : "Electron"
  );
  const zipName = `${APP_NAME}-${APP_VERSION}-mac.zip`;
  if (!fs.existsSync(appCacheDirName)) {
    fs.mkdirSync(appCacheDirName);
  }
  const cacheCurrentFile = path.join(appCacheDirName, zipName);

  if (fs.existsSync(cacheCurrentFile)) {
    isZipCreatedForDiffDownload = true;
  }
  try {
    if (!fs.existsSync(appCacheDirName)) {
      fs.mkdirSync(appCacheDirName);
    }

    let files = fs.readdirSync(appCacheDirName);
    for (const fileName of files) {
      if (fileName.endsWith(".zip") && fileName !== zipName) {
        fs.unlinkSync(path.join(appCacheDirName, fileName));
      }
    }
    let appZipPath = path.normalize(app.appPath + "/../../..");

    console.log("App zip file does not exist, Creting zip file in cache");
    let createZip = exec(
      `ditto -c -k --sequesterRsrc --keepParent "${appZipPath}" "${cacheCurrentFile}"`
    );
    createZip.stderr.on("close", (code: any) => {
      if (code) {
        console.error(
          "Error while creating zip for differential download",
          code
        );
        throw new Error("Error while creating zip for differential download");
      } else {
        isZipCreatedForDiffDownload = true;
        console.log(
          "Successfully generated zip file for differential download"
        );
      }
    });
  } catch (e) {
    console.error(e);
    isZipCreatedForDiffDownload = true;
    throw new Error(e);
  }
}
prepareAppZip();
function isZipAvailabeForDifferentialDownload(): boolean {
  return isZipCreatedForDiffDownload;
}
export { isZipAvailabeForDifferentialDownload };
