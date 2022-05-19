import { getAppDistPath, getAppName, getArtifactName, getChannel } from "./utils";

const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");
const yaml = require("js-yaml");
const { appBuilderPath } = require("app-builder-bin");

function generateZipandBlockmap(buildConfPath: string | undefined = undefined) {
  const appName = getAppName(buildConfPath);
  const channel = getChannel(buildConfPath);
  const appDistPath = getAppDistPath(buildConfPath);
  const artifactName = getArtifactName('zip', buildConfPath);
  const appPath = path.join(
    `${appDistPath}`,
    'mac',
    `${appName}.app`
  );
  const appGeneratedBinPath = path.join(
    appDistPath,
    `${artifactName}`
  );

  console.log("the appName = ", appName);
  console.log("the channel = ", channel);
  console.log("the appDistPath = ", appDistPath);
  console.log("the artifactName = ", artifactName);
  console.log("the appPath = ", appPath);
  console.log("the appGeneratedBinPath = ", appGeneratedBinPath);

  console.log("Zipping...");

  execSync(
    `ditto -V -c  -k --sequesterRsrc --keepParent "${appPath}" "${appGeneratedBinPath}"`
  );

  console.log("Zipping Completed");

  try {
    let output = execSync(
      `${appBuilderPath} blockmap --input="${appGeneratedBinPath}" --output="${appGeneratedBinPath}.blockmap" --compression=gzip`
    );
    let { sha512, size } = JSON.parse(output);

    const ymlPath = path.join(appDistPath, `${channel}-mac.yml`);
    let ymlData = yaml.safeLoad(fs.readFileSync(ymlPath, "utf8"));
    console.log(`Before SHA512 Update: ${channel}-mac.yml data \n`, ymlData);

    ymlData.sha512 = sha512;
    ymlData.files[0].sha512 = sha512;
    ymlData.files[0].size = size;

    let yamlStr = yaml.safeDump(ymlData);
    fs.writeFileSync(ymlPath, yamlStr, "utf8");
    console.log(`After SHA512 Update: ${channel}-mac.yml data \n${yamlStr}\n`);

    console.log(
      "Successfully updated YAML file and configurations with blockmap."
    );
  } catch (e) {
    console.log(
      "Error in updating YAML file and configurations with blockmap.",
      e
    );
  }
}

export { generateZipandBlockmap };
