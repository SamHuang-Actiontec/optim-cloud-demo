# Operator AI Diagnosis Handoff

Date: 2026-06-22

## Scope

This work is for Operator mode only. Do not change Engineer mode behavior unless the product direction explicitly changes.

Primary files:

- `src/components/network/detail/OperatorAIDiagnosis.jsx`
- `src/index.css`
- `src/components/network/detail/CustomerDetailPageOperator.jsx` for wiring/context
- `src/data/mockNetworkDetail.js` for demo account data and actions

## Product Context

The Operator AI Network Diagnosis section is meant to help a frontline ISP operator understand account health quickly, without forcing them into deep engineering analysis.

Health score is based on six domains:

- Device: client census, band steering efficiency, firmware/model capabilities
- Coverage: mesh topology, upstream RSSI, backhaul link quality, hop count
- Capacity: channel utilization, throughput headroom, PHY-rate headroom per radio
- Stability: uptime, reboot count, WAN/backhaul events, CPU and memory headroom
- Quality: end-to-end latency, packet error/retransmission rate, speed test scores
- Environment: noise floor, neighboring-AP interference, channel congestion

Interaction rules:

- Hexagon score visual stays in the left column.
- Diagnosis and AI action items stay in the right column.
- Default right panel is overall diagnosis.
- Clicking the center score returns to overall diagnosis.
- Clicking a healthy factor returns to overall diagnosis.
- Clicking a degraded or critical factor opens that factor's diagnosis and relevant actions.
- Status color must be consistent: healthy = green, degraded = amber, critical = red.
- Overall actions are an aggregate view of individual factor actions.
- If an action is taken in overall view, the same action must appear completed in the individual factor view, and vice versa.

Demo accounts:

- Jim Strothmann: healthy
- Evelyn Choo: degraded
- Rachel Torres: critical

## Current Implementation Notes

`OperatorAIDiagnosis.jsx` now:

- Builds six domain cards from `DOMAINS`.
- Derives domain scores from AI issue factors when available, with demo fallbacks.
- Uses `DOMAIN_GEOMETRY` for hex paths and factor-card positions.
- Uses a center circular score meter with dynamic `/100` score.
- Has a `Re-diagnose` interaction that animates recalculation and updates the score slightly.
- Normalizes AI actions to domain keys so overall and factor-specific action state stays synced.
- Logs completed AI actions through `onQueueAction`, which feeds the service/activity log wiring.
- Keeps healthy accounts out of the actionable AI flow.

Healthy right panel behavior:

- Overall diagnosis bullets are now a short summary:
  - All six domains are within healthy thresholds.
  - No degraded or critical telemetry detected.
  - Continue normal monitoring.
- Healthy accounts show `No AI remediation recommended.` in the action card.
- Healthy/no-remediation state is not styled like an action was taken.
- Low-priority actions use blue/neutral styling.
- Completed actions remain green with `Action Taken`.

Latest hex geometry update:

- The hex was too fat after a prior widening pass.
- Side vertices are now pulled inward from `175/545` to `200/520`.
- Capacity card is pushed farther right from center.
- Environment card is pushed farther left from center.
- Grid left column was widened slightly to give side cards room:
  - `grid-template-columns: minmax(740px, 1fr) minmax(280px, 0.9fr)`

Current `DOMAIN_GEOMETRY`:

```js
const DOMAIN_GEOMETRY = {
  device: { path: 'M 360 66 C 302 96 252 130 200 166', card: [138, 78] },
  coverage: { path: 'M 360 66 C 418 96 468 130 520 166', card: [582, 102] },
  capacity: { path: 'M 520 166 C 508 226 508 274 520 334', card: [614, 236] },
  stability: { path: 'M 520 334 C 468 370 418 404 360 424', card: [558, 420] },
  quality: { path: 'M 360 424 C 302 404 252 370 200 334', card: [162, 420] },
  environment: { path: 'M 200 334 C 212 274 212 226 200 166', card: [106, 284] },
}
```

Current polygon points:

```jsx
points="360,66 520,166 520,334 360,424 200,334 200,166"
```

## Operator Quick Actions Research

Research source used as a practical proxy: public ISP support information architecture, especially AT&T Internet support.

Relevant source URLs:

- AT&T Restart your Wi-Fi gateway or modem: https://www.att.com/support/article/u-verse-high-speed-internet/KM1010361/
- AT&T Find your Wi-Fi info: https://www.att.com/support/article/internet/KM1203150/
- AT&T Internet speed test: https://www.att.com/support/speedtest/
- AT&T Service outages: https://www.att.com/outages/
- AT&T Optimize your connection: https://www.att.com/support/how-to/optimize-your-connection/

Observed common support paths:

- Restart/reboot gateway
- Find, change, or share Wi-Fi info
- Run internet speed test
- Check outage/service interruption
- Optimize connection
- Manage appointment/dispatch
- Track order or support appointment

Product interpretation:

- These are account-level shortcuts, not AI diagnosis-specific remediations.
- They should be immediately available because operators need to resolve calls fast.
- They should not sit at the bottom of the AI diagnosis right rail, where they compete with diagnosis-specific actions.
- The AI right rail should only show AI-recommended diagnosis and remediation.

## Proposed Quick Action Layout

Do not implement this until confirmed.

Recommended placement:

- Put an `Operator Resolution Bar` directly under the account identity/header summary and above `AI Network Diagnosis`.
- Keep it visible near first viewport so the operator can act before reading deep diagnostics.
- Remove `Operator quick actions` from the AI diagnosis right column.

Proposed structure:

```text
Customer Header
  Name, serial, status, plan, last updated

Operator Resolution Bar
  Left: Recommended next quick action based on current status
  Right: compact shortcut buttons

AI Network Diagnosis
  Left: hex health score
  Right: diagnosis + AI recommended action items

Deep Dive Tabs
  WAN Health / Wi-Fi Insight / CPE Devices / Activity Log
```

Recommended first-row shortcuts:

- Poll real-time data
- Check outage
- Reboot gateway
- Run speed test
- Wi-Fi info
- Escalate

Secondary actions can live in a `More` menu:

- Reset Wi-Fi password
- Send Wi-Fi password
- Close ticket
- Schedule technician
- Firmware upgrade
- Add note

Status-aware primary action:

- Healthy: `Poll real-time data` or `Wi-Fi info`
- Degraded: `Run speed test` or `Reboot gateway`, depending on detected issue
- Critical/offline: `Check outage` first, then `Escalate` or `Schedule technician`

Safety and audit requirements:

- Reboot gateway, reset Wi-Fi password, close ticket, schedule technician, and firmware upgrade should require confirmation.
- Every quick action should log actor, action, timestamp, target account, and result in the service log.
- Wi-Fi password should be masked by default.
- Send Wi-Fi password should require verified customer contact/channel.
- Close ticket should require resolution reason.

Open UX question:

- Should quick actions be a sticky top bar while scrolling the account page, or only a first-viewport bar under the customer header?
- Recommendation: start as a first-viewport bar. Add sticky behavior only if user testing shows operators scroll while actively resolving calls.

## Verification

Run these after edits:

```bash
npx eslint src/components/network/detail/OperatorAIDiagnosis.jsx
npm run build
```

Known build warning:

- Vite reports the existing large chunk warning. This is not related to the AI diagnosis changes.
