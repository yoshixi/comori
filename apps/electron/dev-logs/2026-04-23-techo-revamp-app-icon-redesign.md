# App Icon Redesign — Open Techo/Planner

Date: 2026-04-23
Branch: techo-revamp

## What was implemented

Replaced the old hourglass + enso-circle icon (which reflected the original Techoo time-tracking concept) with a new icon that matches the Techo daily-planner concept.

**New icon design:**
- **Left page:** ruled journal lines with ink-mark strokes on the first four lines (suggesting written notes/posts), plus a date header pill at the top
- **Right page:** monthly calendar grid (5 rows × 7 columns) with one "today" cell filled solid black
- **Spine:** dark spine in the center dividing the two pages
- Background: same warm cream (#EDE8DC) as the original icon

## Files added / changed

| File | Change |
|------|--------|
| `resources/icon-source.svg` | New SVG source (1024×1024, edit this to update icons) |
| `scripts/generate-icons.mjs` | Node.js script to regenerate all icon formats from the SVG |
| `build/icon.png` | Regenerated (1024×1024) |
| `build/icon.icns` | Regenerated (macOS) |
| `build/icon.ico` | Regenerated (Windows) |
| `resources/logo.png` | Regenerated (420×420) |
| `resources/logo@2x.png` | Regenerated (840×840) |

## Commands to regenerate icons

```sh
cd apps/electron
node scripts/generate-icons.mjs
```

Requires `sharp` to be installed globally (`npm i -g sharp`) and macOS `sips` + `iconutil` (standard on macOS).

## Note on tray icon

The menu-bar tray icons (`resources/tray-icon*.png`) were not changed — they are macOS template images and are independent of the app icon. Update separately if needed.
