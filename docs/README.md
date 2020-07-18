<h1 align="center">Electron-Differential-updater</h1>

<p align="center">
<a href="https://npmjs.org/package/@imjs/electron-differential-updater">
<img src="https://img.shields.io/npm/v/@imjs/electron-differential-updater.svg" alt="version">
</a>

<a href="https://npmjs.org/package/@imjs/electron-differential-updater">
<img src="https://img.shields.io/npm/dm/@imjs/electron-differential-updater.svg" alt="downloads">
</a>
</p>

<br>
<br>

This module has been built on top of [electron-updater](https://github.com/electron-userland/electron-builder/tree/master/packages/electron-updater)

# Features

1. Implemented First cut of Mac differential update on zip. Docs to be released soon for it.
2. download-progress event will work for differential update for nsis and mac.
3. "useAppSupportCache" option added to have updater cache location to user app support directory.
4. Supporting differential updater for NSIS even when artifact name is static(ex: "appName-setup.exe")

## TODO

1. Blockmap file for genrated zip to be included as part of utils.(mac)
2. Logic to move app zip to electron-updater cache location as part of utils.(mac)
3. Differential update for dmg.(Depending on free time, if you guys want to raise a pr or do fork.. we r happy to merge pull request.)

## for other updater related info check - [Electron-updater](https://github.com/electron-userland/electron-builder/tree/master/packages/electron-updater)

# Electron-updater Issues/Features implemented in this module

1.  [2114](https://github.com/electron-userland/electron-builder/issues/2114) - Mac Differential update
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
   yarn link @imjs/electron-differential-updater
   ```

# Special Thanks

To [Devlar](https://github.com/develar) and [electron-builder](https://github.com/electron-userland/electron-builder) community.

# License

MIT

# Maintainers 🚀

People maintaining this project.

<!-- prettier-ignore -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/akshay-shrivastava"><img src="https://avatars0.githubusercontent.com/u/26062438?s=460&v=4" width="100px;" alt="Akshay Shrivastava"/><br /><sub><b>Akshay Shrivastava</b></sub></a></td>
     <td align="center"><a href="https://github.com/harshitsilly"><img src="https://avatars1.githubusercontent.com/u/9112946?s=460&v=4" width="100px;" alt="Harshit Sinha"/><br /><sub><b>harshitsilly</b></sub></a></td>
  </tr>
</table>
