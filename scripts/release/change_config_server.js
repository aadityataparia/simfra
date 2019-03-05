const pkg = require('../../package.json');
const fs = require('fs');
const folder = process.argv[2];
let pkgFileString = '../.' + folder + '/package.json', pkgFile;
let pkgFolder = folder.split('/')[folder.split('/').length - 1];
let jsFileName = pkgFolder.replace('-', '.');
let pkgName = '@' + jsFileName.replace('.', '/');
let pkgToMerge = {
  name: pkgName,
  // 'main': `src/${jsFileName}.js`,
  // 'module': `dist/${jsFileName}.module.js`,
  version: pkg.version,
  license: pkg.license,
  repository: pkg.repository,
  author: pkg.author,
  bugs: pkg.bugs,
  homepage: pkg.homepage,
  devDependencies: pkg.devDependencies,
  scripts: {
    test: `rm -rf ../../../.nyc_output; node ../../../scripts/test/run.js ${folder}`,
    build: './node_modules/.bin/rollup -c',
    'test-build': 'cd test/public && ../../node_modules/.bin/rollup -c',
    'test-server-only': 'node ./test/public/server.js -p 1111',
    'test-server': 'yarn test-build && yarn test-server-only'
  },
  files: [
    'bin',
    'dist',
    'src'
  ]
};

try {
  pkgFile  = require(pkgFileString);

  // change peerDependencies & dependencies
  pkgToMerge.peerDependencies = dependencyVersion(pkgFile.peerDependencies, pkgToMerge.devDependencies, pkg.version);
  pkgToMerge.dependencies = dependencyVersion(pkgFile.dependencies, pkgToMerge.devDependencies, pkg.version);

  Object.assign(pkgFile, pkgToMerge);
  fs.writeFileSync(__dirname + '/' + pkgFileString, JSON.stringify(pkgFile, null, 2) + '\n');
  process.stdout.write('Done: package.json');
} catch(e) {
  process.stdout.write('No package file in this folder');
}

let rollupConfigFileString = '../.' + folder + '/rollup.config.js';
const config = `const getConfig = require('../../../rollup.base');

module.exports = getConfig('${jsFileName.replace(/(^|\.)(\S)/g, s => s.toUpperCase())}', __dirname, false);
`;
fs.writeFileSync(__dirname + '/' + rollupConfigFileString, config);

process.stdout.write('Done: rollup.config.js');

function dependencyVersion(dependencies, devDependencies, version) {
  for (let dep in dependencies) {
    if (dep.indexOf('@sifrr') >= 0) {
      dependencies[dep] = version;
    } else {
      dependencies[dep] = devDependencies[dep] || dependencies[dep];
    }
  }
  return dependencies;
}
