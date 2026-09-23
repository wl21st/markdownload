// Keep the existing tabs.executeScript API for MV2 browsers while using the
// packaged-function form required by Chrome's Manifest V3 scripting API.
const markDownloadApiIsMv3 = browser.runtime.getManifest().manifest_version >= 3;

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
