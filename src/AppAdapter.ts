import * as path from "path";

export interface AppAdapter {
  readonly version: string;
  readonly name: string;
  readonly isPackaged: boolean;
  readonly app: any;

  /**
   * Path to update metadata file.
   */
  readonly appUpdateConfigPath: string;

  /**
   * Path to user data directory.
   */
  readonly userDataPath: string;

  /**
   * Path to cache directory.
   */
<<<<<<< HEAD
  readonly baseCachePath: string;
=======
  baseCachePath: string;
>>>>>>> 3d0b7ac344b378006920d272c2a12e86172bde6a

  whenReady(): Promise<void>;

  quit(): void;

  onQuit(handler: (exitCode: number) => void): void;
}

export function getAppCacheDir() {
  const homedir = require("os").homedir();
  // https://github.com/electron/electron/issues/1404#issuecomment-194391247
  let result: string;
  if (process.platform === "win32") {
    result = process.env.LOCALAPPDATA || path.join(homedir, "AppData", "Local");
  } else if (process.platform === "darwin") {
    result = path.join(homedir, "Library", "Application Support", "Caches");
  } else {
    result = process.env.XDG_CACHE_HOME || path.join(homedir, ".cache");
  }
  return result;
}
