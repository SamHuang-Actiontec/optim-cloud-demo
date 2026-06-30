# Dashboard Region Health Map Handoff

Date: 2026-06-29

## Scope

This document covers the Dashboard `Region Health` map only. The surrounding dashboard layout was intentionally left unchanged.

Primary files:

- `src/components/dashboard/GeoMap.jsx`
- `src/components/dashboard/DashboardPage.jsx`
- `src/data/mockDashboard.js`
- `src/index.css`

## Requirements Implemented

- Region Health is now a geographic service-area map instead of a placeholder/static panel.
- At overview zoom, the map shows regional health dials distributed by service area.
- Regional dial markers are offset from their real coverage centers so the actual service-area geography stays visible.
- Each regional dial shows affected percentage, critical count, total networks, and health score.
- The dial ring encodes health mix:
  - red = critical percentage
  - amber = degraded percentage
  - green = healthy percentage
- The map fits the available service area automatically from region lat/lng coordinates.
- Current demo data is regional Washington service area.
- When zoomed in, the map switches to individual account dots.
- Dots are colored by health:
  - green = healthy
  - amber = degraded
  - red = critical/offline
- Clicking a regional dial opens the existing account drawer scoped to that region.
- Clicking an individual account dot opens the right drawer in single-device detail mode, not a list.
- Account dots have hover tooltips with account, serial, location, tier, and score.
- The Network Health Segmentation and Region Health panels are now about 50% taller than the prior 248px panels.
- The map has local vector geography, including service-area coverage rings, water shapes, road lines, and city labels. It does not require external map tiles.

## Implementation Notes

`GeoMap.jsx` uses Leaflet directly, without `react-leaflet`.

Why:

- The project already depends on `leaflet`.
- Direct Leaflet integration keeps the change contained to one component.
- No external tile server is required, so the demo remains reliable offline.

The map uses:

- `REGION_HEALTH` for region coordinates and coverage radius.
- `DASH_ACCOUNTS` for actual account counts and generated account-dot positions.
- Deterministic jitter around each region center for account dots.
- `fitBounds()` using region radius to scale the map to the service area.
- Zoom threshold logic:
  - Overview: regional health dials.
  - High zoom: individual account dots.
- `onRegionSelect` opens a region-scoped account list.
- `onDeviceSelect` opens a single-device drawer.

## Data Fixes

`mockDashboard.js` now includes `Olympia` as a generated location mapped to `Rural West`.

Reason:

- Copilot left `Rural West` with a region marker but no generated accounts.
- This made the regional marker and account drawer inconsistent.

`DashboardPage.jsx` region drawer filtering was updated to use account `region` ids instead of hardcoded location conditions.

Reason:

- The old condition made `Rural West` match every account.
- The drawer now matches the map cluster counts.

## Current Verification

Browser verification performed:

- Overview mode renders 5 regional health dials.
- Map has visible vector geography.
- No horizontal overflow at 1280px viewport.
- Zooming in switches to 1,871 individual account dots.
- Region panel renders at about 374px tall; the map viewport renders at about 352px tall.
- Network Health Segmentation renders at about 384px tall.
- Clicking a region opens a scoped drawer. Example verified: Rural West opens 207 accounts.
- Clicking a zoomed device dot opens a single-device drawer, with no account-list rows. Example verified: Account 0003 device.
- Browser console check showed no errors.

Command verification:

```bash
npx eslint src/components/dashboard/GeoMap.jsx src/components/dashboard/DashboardPage.jsx src/data/mockDashboard.js
npm run build
```

Known note:

- `npm run build` passes with the existing Vite large chunk warning.
- Full targeted dashboard lint is clean after a small search-dropdown effect cleanup.
