# Tasks

## 1. Isolate the Chrome MV3 package

- [x] 1.1 Add a Chrome-specific Manifest V3 manifest and build target with `action`, an MV3 background service worker, `scripting` and `offscreen` permissions, and `<all_urls>` under `host_permissions`; verify the Chrome build emits a package whose manifest declares version 3 and contains every referenced file.
- [x] 1.2 Keep the existing `src/manifest.json` and build target intact; run both build commands and verify the Chrome artifact contains the MV3 manifest while the existing artifact still contains the current Firefox/Safari manifest.

## 2. Move Chrome background work to MV3 contexts

- [ ] 2.1 Add the Chrome service worker entrypoint, load the required libraries in dependency order, register event listeners at top level, and create or refresh context menus during install/startup; verify the worker starts and menus are available after it restarts.
- [ ] 2.2 Add an offscreen document and a focused runtime message bridge for DOM parsing, Readability/Turndown conversion, image preparation, and object URL creation/revocation; verify conversion handles ordinary articles plus the existing MathJax, KaTeX, and code-block paths, and verify Markdown and image downloads finish and release their URLs.

## 3. Port Chrome tab actions and permissions

- [ ] 3.1 Replace Chrome `tabs.executeScript` calls with `scripting.executeScript` using packaged files/functions and serializable arguments; verify popup, context-menu, shortcut, clipboard, and download flows work without generated executable strings.
- [ ] 3.2 Resolve the target tab from command/menu event data or an active-tab query instead of the background page's current-tab context; verify single-tab and multi-tab clipping actions target the intended tabs.
- [x] 3.3 Verify the Chrome manifest retains `activeTab`, downloads, storage, context menus, and clipboard permissions alongside all-site host access, and that Firefox/Safari manifests and runtime entrypoints do not acquire Chrome-only APIs.

## 4. Document and verify both build paths

- [x] 4.1 Document the separate Chrome MV3 build and its output alongside the existing browser build instructions; verify each documented command produces the named artifact.
- [ ] 4.2 Manually smoke-test the Chrome package's popup, selection and full-page clipping, keyboard shortcuts, context menus, Markdown downloads, image downloads, and multi-tab actions, then smoke-test the existing browser package's build path.
