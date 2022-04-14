const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const currentWorkingDirectory = process.cwd();
const packageInfo = require(path.join(currentWorkingDirectory, "package.json"));

const CONFIG_EXTS = ['yml', 'json'];


let _BUILD_CONFIGURATION: any | undefined = undefined;

export function getBuildConfiguration(confPath: string | undefined = undefined) {
    function _getConf(cPath: string | undefined) {
        if (!cPath) {
            const iConfPath = path.join(
                currentWorkingDirectory,
                'electron-builder'
            );
            for (let ext of CONFIG_EXTS) {
                if (fs.existsSync(iConfPath + '.' + ext)) {
                    cPath = iConfPath + '.' + ext;
                    break;
                }
            }
        }

        if (!cPath) {
            return packageInfo.build || {}
        }

        if (cPath.endsWith('.yml')) {
            return yaml.safeLoad(fs.readFileSync(cPath, {encoding: "utf-8"}));
        } else {
            return JSON.parse(fs.readFileSync(cPath, {encoding: "utf-8"}));
        }
    }

    if (_BUILD_CONFIGURATION === undefined) {
        _BUILD_CONFIGURATION = _getConf(confPath);
    }

    return _BUILD_CONFIGURATION;
}

export function getAppName(confPath: string | undefined = undefined) {
    const build_conf = getBuildConfiguration(confPath);

    return build_conf?.productName || packageInfo.name
}

export function getAppVersion(confPath: string | undefined = undefined) {
    const build_conf = getBuildConfiguration(confPath);

    return build_conf?.buildVersion || (process.argv[2] ? process.argv[2] : packageInfo.version)
}

export function getChannel(confPath: string | undefined = undefined) {
    const build_conf = getBuildConfiguration(confPath);

    let defaultChannel = 'latest'; // default;
    let channel = defaultChannel;

    let confChannel: string | undefined = build_conf?.publish?.channel;

    if (!confChannel) {
        const appVersion = getAppVersion(confPath);

        const versionSplit = appVersion.split('-');
        if (versionSplit.length > 1) {
            channel = versionSplit[1]
        }
    } else {
        channel = confChannel;
    }

    return channel;
}

export function getAppDistPath(confPath: string | undefined = undefined) {
    const build_conf = getBuildConfiguration(confPath);

    let outDir = build_conf?.directories?.output || "dist";

    if (outDir.endsWith('/')) {
        outDir = outDir.slice(0, outDir.length - 1);
    }

    return path.join(currentWorkingDirectory, outDir)
}

export function getFileMacros(confPath: string | undefined = undefined) {
    const build_conf = getBuildConfiguration(confPath);

    const productName = getAppName(confPath);
    const version = getAppVersion(confPath);
    const channel = getChannel(confPath);

    const platform = process.platform;
    const isMac = (platform === 'darwin');
    const isWin = (platform === 'win32');

    let retData: {[id: string]: string} = {
        "${arch}": process.arch,
        "${os}": isMac? 'mac' : (isWin? 'win' : 'linux'),
        "${platform}": platform,
        "${name}": packageInfo.name,
        "${productName}": productName,
        "${version}": version,
        "${channel}": channel,
        "${description}": packageInfo.description || '',
        "${id}": build_conf.appId,
        "${copyright}": build_conf.copyright,
    }

    for (const [k, v] of Object.entries(process.env)) {
        retData["$env." + k] = v as string;
    }

    return retData;
}

export function replaceAll(inStr: string, k: string, v: string) {
    let outStr = inStr;
    let nOutStr = outStr.replace(k, v);
    while (nOutStr !== outStr) {  // mimic replaceAll.
        outStr = nOutStr;
        nOutStr = outStr.replace(k, v);
    }

    return outStr;
}

export function transformMacros(inStr: string, confPath: string | undefined = undefined) {
    const macros = getFileMacros(confPath);
    let outStr = inStr;
    for (const [k, v] of Object.entries(macros)) {
        outStr = replaceAll(outStr, k, v);
    }

    return outStr
}

export function getArtifactName(ext = 'zip', confPath: string | undefined = undefined) {
    const build_conf = getBuildConfiguration(confPath);
    let artifactName = build_conf?.artifactName || "${productName}-${version}.${ext}";

    artifactName = transformMacros(artifactName, confPath);

    return replaceAll(artifactName, "${ext}", ext);
}
