---
title: "Electron App Icon"
brief_description: "How to update the Electron app icon (all platforms)."
created_at: "2026-04-23"
update_at: "2026-04-23"
---

# Electron App Icon

## Source file

The icon is defined as a single SVG at:

```
apps/electron/resources/icon-source.svg
```

Edit this file to change the design, then regenerate (see below).

## Regenerating icons

```sh
cd apps/electron
node scripts/generate-icons.mjs
```

This produces:

| Output | Purpose |
|--------|---------|
| `build/icon.png` | Linux icon, also used by electron-builder as the base |
| `build/icon.icns` | macOS |
| `build/icon.ico` | Windows |
| `resources/logo.png` | Runtime logo (420×420) |
| `resources/logo@2x.png` | Runtime logo @2x (840×840) |

**Requirements:** `sharp` available globally (`npm i -g sharp`), plus macOS `sips` and `iconutil` (standard on macOS).

## Design notes

The icon is an open techo/planner book that reflects the app concept (手帳):

- **Left page** — ruled journal lines with ink marks (posts/notes metaphor)
- **Right page** — monthly calendar grid with a highlighted "today" cell
- **Background** — warm cream (#EDE8DC), consistent with the app's visual identity

For historical context on why the icon changed from the original hourglass design, see `apps/electron/dev-logs/2026-04-23-techo-revamp-app-icon-redesign.md`.
