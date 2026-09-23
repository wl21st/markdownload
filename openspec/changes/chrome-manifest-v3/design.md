# Design

## Context

See `proposal.md` for the motivation and scope. The current `src/manifest.json` is MV2 and is the input to the existing `web-ext build` command. The background page imports several ordered scripts and performs clipping, conversion, image preparation, downloads, and context-menu handling. It uses `tabs.executeScript` with both files and generated code strings. Conversion and image handling use `DOMParser`, `document`, `XMLHttpRequest`, `FileReader`, and `URL.createObjectURL`.

## Goals / Non-Goals

**Goals:**

- Produce a Chrome MV3 package through a dedicated build target.
- Preserve the current Firefox and Safari packaging path and shared user-facing behavior.
- Keep Chrome's context menus, shortcuts, popup, clipping, downloads, and image handling functional through MV3 APIs.
- Make Chrome-specific runtime adaptations explicit and maintainable.

**Non-Goals:**

- Change clipping output, settings, or user workflows.
- Migrate Firefox or Safari to MV3.
- Reduce the current all-site access scope in this migration; that would change multi-tab clipping behavior and should be a separate decision.

## Decisions

### Keep a separate Chrome package target

Add a Chrome MV3 manifest and build command that stage the shared extension files into a Chrome-specific output directory. Leave `src/manifest.json` and the existing `build` command as the Firefox/Safari-compatible path. Keep browser-specific runtime code in dedicated Chrome entrypoints or adapters rather than overwriting the shared manifest during builds.

This makes the Chrome package reproducible and prevents one browser's build from changing another browser's manifest. A single generated manifest or a single MV3 conversion of `src/manifest.json` was considered, but either couples existing browser packaging to the Chrome migration.

### Use a service worker for Chrome event handling

The Chrome manifest will point to a classic service worker that loads the ordered extension libraries with `importScripts`. Register runtime, command, and context-menu event listeners at top level so they are available whenever Chrome starts the worker. Create or refresh context menus from installation/startup handling, since a service worker can be stopped and restarted between user actions.

The Chrome entrypoint will resolve the active tab from the command or menu event (or query the active tab) instead of relying on a background page's current-tab context. Firefox/Safari keep their existing background page entrypoint.

### Put DOM and blob work in an offscreen document

Add a small extension offscreen page for operations the MV3 service worker cannot perform: parsing and transforming captured HTML, preparing image blobs, and creating/revoking object URLs. The worker remains responsible for extension events, storage, tab scripting, and the downloads API. A narrow `runtime` message protocol will send conversion/download-preparation requests to the offscreen page and return serializable results or blob URLs to the worker.

This uses Chrome's offscreen document support for DOM parser and blob operations. Keeping DOM work in an offscreen document avoids duplicating the conversion logic in the popup and keeps context-menu and shortcut flows working when the popup is closed. Rewriting the converter around a DOM-free parser was considered, but would expand the change and risk output differences.

### Use MV3 scripting and preserve the current host access

Replace Chrome calls to `tabs.executeScript` with `scripting.executeScript`. Inject packaged files or packaged functions with serializable arguments; do not construct executable source from page data or Markdown strings. Declare `scripting` and move `<all_urls>` to `host_permissions`, retaining `activeTab` for user-initiated actions. This preserves batch operations over multiple tabs and the existing context-menu flows. Requesting per-site access instead was considered but would change behavior for tabs that have not been granted access.

### Retain shared UI and extension APIs where compatible

Keep the popup, options page, content script, storage schema, and downloads behavior shared where their APIs do not differ. Use the existing Promise-based WebExtension polyfill in the Chrome package where it supports the MV3 API surface; use a small Chrome-specific adapter for MV3-only scripting, offscreen, and lifecycle behavior. This avoids forking the full extension while keeping browser-specific APIs out of the Firefox/Safari package.

## Risks / Trade-offs

- [Offscreen conversion or blob URLs may outlive or be lost across worker shutdowns] -> Keep offscreen requests self-contained, retain the offscreen page while its object URLs are needed, and revoke URLs after download completion; exercise worker restart and download flows during manual verification.
- [Chrome and Firefox build staging could accidentally share or overwrite manifests] -> Use distinct build commands and output directories, and verify both package manifests after each build.
- [MV3 scripting permissions may block pages that the old package could access] -> Preserve `<all_urls>` as a host permission and verify active-tab, context-menu, shortcut, and multi-tab entry points on normal web pages; restricted browser pages remain unavailable as before.
- [MV3 disallows executing generated code strings] -> Keep injected functions in packaged source and pass values through `args`; search the Chrome runtime path for remaining generated code before release.

## Migration Plan

1. Add a dedicated Chrome MV3 manifest and staging/build command without changing the existing build target.
2. Add the Chrome service worker and offscreen page, then route DOM/blob-dependent work through the offscreen message bridge.
3. Port tab injection, command tab selection, and lifecycle setup to MV3 APIs.
4. Build both targets and manually verify the Chrome package's popup, selection/full-page clipping, shortcuts, context menus, downloads, image downloads, and multi-tab actions, then verify the existing build still emits its current manifest path.
5. Publish the Chrome artifact through its separate release path. Roll back by reverting the Chrome-specific build and runtime files; the existing browser package remains available throughout.
