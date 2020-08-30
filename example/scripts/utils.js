/*
 * Copyright (c) 2020 Western Digital Corporation or its affiliates.
 *
 * This code is CONFIDENTIAL and a TRADE SECRET of Western Digital
 * Corporation or its affiliates ("WD").  This code is protected
 * under copyright laws as an unpublished work of WD.  Notice is
 * for informational purposes only and does not imply publication.
 *
 * The receipt or possession of this code does not convey any rights to
 * reproduce or disclose its contents, or to manufacture, use, or sell
 * anything that it may describe, in whole or in part, without the
 * specific written consent of WD.  Any reproduction or distribution
 * of this code without the express written consent of WD is strictly
 * prohibited, is a violation of the copyright laws, and may subject you
 * to criminal prosecution.
 */
const fs = require("fs");
const path = require("path");

const requireJSON = jsonPath => {
  let data = fs.readFileSync(jsonPath);
  if (!data) {
    console.error(`Cannot read ${jsonPath}`);
  }
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error(`Cannot parse ${jsonPath}: ${err}`);
  }
};
const getKeplerVersion = () => {
  const packageInfo = requireJSON(path.resolve(__dirname, "../package.json"));
  if (packageInfo) {
    return packageInfo.version;
  }

  return "1.0.0.";
};

const getAppPackageJson = () => {
  const packageInfo = requireJSON(path.resolve(__dirname, "../package.json"));

  return packageInfo;
};

module.exports = { getKeplerVersion, getAppPackageJson };
