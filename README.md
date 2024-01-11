<h1 align="center">Electron-Differential-updater</h1>

This module has been built on top of [electron-updater](https://github.com/electron-userland/electron-builder/tree/master/packages/electron-updater) and [electron-differential-updater](https://github.com/imjsElectron/electron-differential-updater)

# Features

1. Implemented Mac differential update on zip.
2. download-progress event will work for differential update for nsis and mac.

## TODO

1. "useAppSupportCache" option added to have updater cache location to user app support directory.
2. Differential update for dmg.(Depending on free time, if you guys want to raise a pr or do fork.. we r happy to merge pull request.)

## for other updater related info check - [Electron-updater](https://github.com/electron-userland/electron-builder/tree/master/packages/electron-updater)

# Electron-updater Issues/Features implemented in this module

1.  [2114](https://github.com/electron-userland/electron-builder/issues/2114)[2995](https://github.com/electron-userland/electron-builder/issues/2995) - Mac Differential update
2.  [2521](https://github.com/electron-userland/electron-builder/issues/2521) - Progress bar events for differential update
3.  [4769](https://github.com/electron-userland/electron-builder/issues/4769) - Update location can be moved to user App support path

# Contributions

1. Please raise the issue and make pull request if you want to contribute.
2. Local setup -

   ```
   #Install Deps
   yarn

   ##Compile
   yarn:win or yarn:mac

   ##Link locally
   yarn link
   yarn link @techsmith/electron-differential-updater
   ```

# Special Thanks

To [Devlar](https://github.com/develar) and [electron-builder](https://github.com/electron-userland/electron-builder) community.

# License

MIT
