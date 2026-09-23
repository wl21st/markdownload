const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const sourceDir = path.resolve(__dirname, "..");
const manifestPath = path.join(sourceDir, "manifest.chrome.json");
const artifactsDir = path.resolve(sourceDir, "..", "web-ext-artifacts", "chrome-mv3");
const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), "markdownload-chrome-mv3-"));

function shouldCopy(sourcePath) {
  const relativePath = path.relative(sourceDir, sourcePath);
  const firstSegment = relativePath.split(path.sep)[0];
  return ![
    "node_modules",
    "package.json",
    "package-lock.json",
    "manifest.chrome.json",
    "scripts"
  ].includes(firstSegment);
}

try {
  fs.cpSync(sourceDir, stagingDir, { recursive: true, filter: shouldCopy });
  fs.copyFileSync(manifestPath, path.join(stagingDir, "manifest.json"));
  fs.mkdirSync(artifactsDir, { recursive: true });

  execFileSync(process.execPath, [
    path.join(sourceDir, "node_modules", "web-ext", "bin", "web-ext.js"),
    "build",
    "--source-dir",
    stagingDir,
    "--artifacts-dir",
    artifactsDir,
    "--filename",
    "markdownload-chrome-mv3.zip",
    "--overwrite-dest"
  ], { stdio: "inherit" });
} finally {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
