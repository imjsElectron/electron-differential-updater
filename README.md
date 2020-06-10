<h1 align="center">Electron-Differential_updater</h1>

<p align="center">
<a href="https://npmjs.org/package/enquirer">
<img src="https://img.shields.io/npm/v/@imjs/electron-differential-updater.svg" alt="version">
</a>

<a href="https://npmjs.org/package/enquirer">
<img src="https://img.shields.io/npm/dm/@imjs/electron-differential-updater.svg" alt="downloads">
</a>
</p>

<br>
<br>

This module allows you to do differential update for mac + progress bar events(for differential update) in addition to existing electron updater functionalities.

# Features

1. Implemented First cut of Mac differential update on zip. Docs to be released soon for it.
2. download-progress event will work for differential update for nsis and mac.

## TODO ##
1. Blockmap file for genrated zip to be included as part of utils.(mac)
2. Logic to move app zip to electron-updater cache location as part of utils.(mac)
3. Differential update for dmg.(Depending on free time, if you guys want to raise a pr or do fork.. we r happy to merge pull request.)

## for other updater related info check - [Electron-updater](https://github.com/electron-userland/electron-builder/tree/master/packages/electron-updater)

# Electron-updater Issues/Features implemented in this module

1.  [2114](https://github.com/electron-userland/electron-builder/issues/2114) - Mac Differential update
2.  [2521](https://github.com/electron-userland/electron-builder/issues/2521) - Progress bar events for differential update

# Contributions

1. Please raise the issue and make pull request if you want to contribute.
2. To setup -
   ```
   yarn
   yarn link
   yarn link @imjs/electron-differential-updater
   ```
