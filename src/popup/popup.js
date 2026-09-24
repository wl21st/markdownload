
// default variables
var selectedText = null;
var imageList = null;
var mdClipsFolder = '';

const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
// set up event handlers
const cm = CodeMirror.fromTextArea(document.getElementById("md"), {
    theme: darkMode ? "xq-dark" : "xq-light",
    mode: "markdown",
    lineWrapping: true
});
cm.on("cursorActivity", (cm) => {
    const somethingSelected = cm.somethingSelected();
    var a = document.getElementById("downloadSelection");

    if (somethingSelected) {
        if(a.style.display != "block") a.style.display = "block";
    }
    else {
        if(a.style.display != "none") a.style.display = "none";
    }
});
document.getElementById("download").addEventListener("click", download);
document.getElementById("downloadSelection").addEventListener("click", downloadSelection);

const defaultOptions = {
    includeTemplate: false,
    clipSelection: true,
    downloadImages: false
}

const checkInitialSettings = options => {
    if (options.includeTemplate)
        document.querySelector("#includeTemplate").classList.add("checked");

    if (options.downloadImages)
        document.querySelector("#downloadImages").classList.add("checked");

    if (options.clipSelection)
        document.querySelector("#selected").classList.add("checked");
    else
        document.querySelector("#document").classList.add("checked");
}

const toggleClipSelection = options => {
    options.clipSelection = !options.clipSelection;
    document.querySelector("#selected").classList.toggle("checked");
    document.querySelector("#document").classList.toggle("checked");
    browser.storage.sync.set(options).then(() => clipSite()).catch((error) => {
        console.error(error);
    });
}

const toggleIncludeTemplate = options => {
    options.includeTemplate = !options.includeTemplate;
    document.querySelector("#includeTemplate").classList.toggle("checked");
    browser.storage.sync.set(options).then(() => {
        browser.contextMenus.update("toggle-includeTemplate", {
            checked: options.includeTemplate
        });
        try {
            browser.contextMenus.update("tabtoggle-includeTemplate", {
                checked: options.includeTemplate
            });
        } catch { }
        return clipSite()
    }).catch((error) => {
        console.error(error);
    });
}

const toggleDownloadImages = options => {
    options.downloadImages = !options.downloadImages;
    document.querySelector("#downloadImages").classList.toggle("checked");
    browser.storage.sync.set(options).then(() => {
        browser.contextMenus.update("toggle-downloadImages", {
            checked: options.downloadImages
        });
        try {
            browser.contextMenus.update("tabtoggle-downloadImages", {
                checked: options.downloadImages
            });
        } catch { }
    }).catch((error) => {
        console.error(error);
    });
}
const showOrHideClipOption = selection => {
    if (selection) {
        document.getElementById("clipOption").style.display = "flex";
    }
    else {
        document.getElementById("clipOption").style.display = "none";
    }
}

async function getActiveTab() {
    let tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs[0]) return tabs[0];
    tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    if (tabs && tabs[0]) return tabs[0];
    tabs = await browser.tabs.query({ active: true });
    if (tabs && tabs[0]) return tabs[0];
    throw new Error("Unable to identify the active browser tab.");
}

const clipSite = id => {
    return executeFunctionInTab(id, () => {
        if (typeof getSelectionAndDom === 'function') {
            return getSelectionAndDom();
        }
        if (window.getSelectionAndDom) {
            return window.getSelectionAndDom();
        }
        return null;
    })
        .then(async (result) => {
            if (result && result[0] && result[0].dom) {
                showOrHideClipOption(result[0].selection);
                let message = {
                    type: "clip",
                    dom: result[0].dom,
                    selection: result[0].selection
                };
                let options = defaultOptions;
                try {
                    options = await browser.storage.sync.get(defaultOptions);
                } catch (err) {
                    console.error("Failed to read storage sync options:", err);
                }
                return browser.runtime.sendMessage({
                    ...message,
                    ...options
                });
            } else {
                showError("Could not retrieve page content from the active tab.");
            }
        }).catch(err => {
            console.error(err);
            showError(err);
        });
}

// listen for notifications from the background page
browser.runtime.onMessage.addListener(notify);

// Initialize popup
async function initPopup() {
    try {
        const manifest = getExtensionManifest();
        const currentVersion = manifest?.version || "3.4.1";
        console.info(`MarkDownload v${currentVersion} popup opened`);
        const versionEl = document.getElementById("version");
        if (versionEl) {
            versionEl.textContent = `v${currentVersion}`;
        }

        const options = await browser.storage.sync.get(defaultOptions).catch(() => defaultOptions);
        checkInitialSettings(options);

        document.getElementById("selected").addEventListener("click", (e) => {
            e.preventDefault();
            toggleClipSelection(options);
        });
        document.getElementById("document").addEventListener("click", (e) => {
            e.preventDefault();
            toggleClipSelection(options);
        });
        document.getElementById("includeTemplate").addEventListener("click", (e) => {
            e.preventDefault();
            toggleIncludeTemplate(options);
        });
        document.getElementById("downloadImages").addEventListener("click", (e) => {
            e.preventDefault();
            toggleDownloadImages(options);
        });

        const tab = await getActiveTab();
        const id = tab.id;
        const url = tab.url || "";

        if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://") || url.startsWith("edge://") || url.startsWith("about:") || url.startsWith("devtools://") || url.startsWith("view-source:")) {
            showError(`MarkDownload cannot clip browser internal pages (${url || "internal page"}).\n\nPlease switch to a standard webpage (e.g. an article or doc page).`);
            return;
        }

        await executeFileInTab(id, "/browser-polyfill.min.js");
        await executeFileInTab(id, "/contentScript/contentScript.js");
        console.info("Successfully injected MarkDownload content script");
        await clipSite(id);
    } catch (error) {
        console.error("Initialization error:", error);
        if (error?.message?.includes("Cannot access") || error?.message?.includes("extensions gallery")) {
            showError(`MarkDownload cannot access this page (${error.message}).\n\nPlease switch to a standard webpage.`);
        } else {
            showError(error);
        }
    }
}

// Safety timeout: if after 15s the spinner is still visible, inform the user
setTimeout(() => {
    const container = document.getElementById("container");
    if (container && container.style.display !== 'flex') {
        showError("Clipping timed out. Please refresh the page tab and try again.");
    }
}, 15000);

initPopup();

//function to send the download message to the background page
async function sendDownloadMessage(text) {
    if (text != null) {
        const tab = await getActiveTab();
        const message = {
            type: "download",
            markdown: text,
            title: document.getElementById("title").value,
            tab: tab,
            imageList: imageList,
            mdClipsFolder: mdClipsFolder
        };
        return browser.runtime.sendMessage(message);
    }
}

// event handler for download button
async function download(e) {
    e.preventDefault();
    await sendDownloadMessage(cm.getValue());
    window.close();
}

// event handler for download selected button
async function downloadSelection(e) {
    e.preventDefault();
    if (cm.somethingSelected()) {
        await sendDownloadMessage(cm.getSelection());
    }
}

//function that handles messages from the injected script into the site
function notify(message) {
    if (!message) return;
    // message for displaying markdown
    if (message.type == "display.md") {
        cm.setValue(message.markdown || "");
        document.getElementById("title").value = (message.article && message.article.title) ? message.article.title : "";
        imageList = message.imageList || {};
        mdClipsFolder = message.mdClipsFolder || "";
        
        // show the hidden elements
        document.getElementById("container").style.display = 'flex';
        document.getElementById("spinner").style.display = 'none';
        // focus the download button
        document.getElementById("download").focus();
        cm.refresh();
    } else if (message.type == "display.md.error") {
        showError(message.error || "Failed to convert article to Markdown.");
    }
}

function showError(err) {
    // show the hidden elements
    const container = document.getElementById("container");
    const spinner = document.getElementById("spinner");
    if (container) container.style.display = 'flex';
    if (spinner) spinner.style.display = 'none';
    const message = err instanceof Error ? err.message : String(err);
    cm.setValue(`Error clipping the page:\n\n${message}`);
}
