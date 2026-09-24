// Cross-browser helper to retrieve extension manifest safely across all contexts
// (Service Worker, Offscreen document, Popup, Content Script, Firefox, Chrome).
function getExtensionManifest() {
  if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.getManifest === "function") {
    return chrome.runtime.getManifest();
  }
  if (typeof browser !== "undefined" && browser.runtime && typeof browser.runtime.getManifest === "function") {
    return browser.runtime.getManifest();
  }
  return { manifest_version: 2, version: "3.4.3" };
}

var markDownloadIsMv3 = (getExtensionManifest()?.manifest_version || 2) >= 3;
var markDownloadApiIsMv3 = markDownloadIsMv3;
globalThis.markDownloadIsMv3 = markDownloadIsMv3;
globalThis.markDownloadApiIsMv3 = markDownloadIsMv3;

async function executeFunctionInTab(tabId, func, args = []) {
  if (markDownloadApiIsMv3) {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func,
      args
    });
    return results.map(result => result.result);
  }

  const call = `(${func.toString()})(...${JSON.stringify(args)})`;
  return browser.tabs.executeScript(tabId, { code: call });
}

function executeFileInTab(tabId, file) {
  if (markDownloadApiIsMv3) {
    return chrome.scripting.executeScript({
      target: { tabId },
      files: [file.replace(/^\//, "")]
    });
  }

  return browser.tabs.executeScript(tabId, { file });
}
