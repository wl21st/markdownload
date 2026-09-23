# Proposal

## Why

Chrome needs a Manifest V3 package, while this repository's current Manifest V2 package also serves Firefox and Safari. A separate Chrome build allows Chrome to move to MV3 while the existing browser packages continue using their current manifest and behavior.

## What Changes

- Add an isolated Chrome build target with its own Manifest V3 manifest and packaging configuration.
- Adapt the Chrome runtime to MV3, including the action API, service worker background, script injection, and permission declarations.
- Support the existing clipping, context menu, keyboard shortcut, clipboard, and download flows in the Chrome MV3 package.
- Keep the existing Firefox and Safari build target on its current manifest path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This change ports the existing extension behavior to a new browser package without changing the product requirements. Specs are intentionally skipped for this packaging and platform migration.

## Impact

- `src/manifest.json` and the extension packaging/build configuration need a Chrome-specific MV3 path.
- Chrome background processing must work with service worker lifecycle constraints. Existing background code uses page APIs such as `DOMParser`, `document`, and `URL.createObjectURL`, so the MV3 package needs a compatible execution context for those operations.
- Chrome injection must move from `tabs.executeScript` to `scripting.executeScript`; host permissions must preserve the current supported clipping flows, including multi-tab actions.
- Build and release instructions must identify the separate Chrome MV3 artifact while retaining the existing Firefox and Safari artifacts.
