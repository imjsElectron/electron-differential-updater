const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { app } = require("electron");
const currentWorkingDirectory = process.cwd();
const APP_PATH =
  process.platform === "darwin"
    ? path.normalize(currentWorkingDirectory + "/../../..")
    : path.normalize(currentWorkingDirectory + "/../..");

const APP_NAME = app.getName();
const APP_VERSION = app.getVersion();

function moveAppZip() {
  const zipName = `${APP_NAME}-${APP_VERSION}-mac.zip`;
  const appCacheDirName = path.join(
    app.getPath("userData"),
    app.isPackaged ? "Electron" : `${app.name}-updater`
  );
  const cacheCurrentFile = path.join(appCacheDirName, zipName);
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
    let appZipPath = app.isPackaged
      ? path.join(app.getAppPath(), "dist", "mac", `${APP_NAME}.app`)
      : APP_PATH;

    if (fs.existsSync(cacheCurrentFile)) {
      return;
    } else {
      console.log("Kepler file does not exist, Creting zip file in cache");
      let createZip = exec(
        `ditto -c -k --sequesterRsrc --keepParent "${appZipPath}" "${cacheCurrentFile}"`
      );
      createZip.stderr.on("close", code => {
        if (code) {
          console.log(
            "Error while creating zip for differential download",
            code
          );
        } else {
          console.log(
            "Successfully generated zip file for differential download"
          );
        }
      });
    }
  } catch (e) {
    console.log(e);
  }
}
export { moveAppZip };
