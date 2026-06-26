// Fleet-level aggregated data for the Dashboard

// ── 1. Fleet Status KPI tiles ────────────────────────────────────────────────
export const FLEET_STATS = [
  {
    id: 'networks',
    label: 'Online Networks',
    value: '1,800 / 1,912',
    sub: '94.1% online',
    trendDir: 'up',
    trendVal: '+24 today',
    status: 'amber', // 85–94% → amber
  },
  {
    id: 'equipment',
    label: 'Online Equipment',
    value: '140 / 6,000',
    sub: '2.3% active',
    trendDir: 'flat',
    trendVal: 'steady',
    status: 'neutral',
  },
  {
    id: 'wifi',
    label: 'WiFi Health Score',
    value: '84.7',
    sub: 'fleet average',
    trendDir: 'up',
    trendVal: '+0.6 vs 7d',
    status: 'green', // ≥80 → green
  },
  {
    id: 'dl',
    label: 'DL Avg PHY Rate',
    value: '2,831 Mbps',
    sub: 'avg across fleet',
    trendDir: 'up',
    trendVal: '+2.1% vs avg',
    status: 'green',
  },
  {
    id: 'ul',
    label: 'UL Avg PHY Rate',
    value: '2,607 Mbps',
    sub: 'avg across fleet',
    trendDir: 'flat',
    trendVal: '±0.2% vs avg',
    status: 'green',
  },
  {
    id: 'devices',
    label: 'Online Devices',
    value: '178',
    sub: 'active right now',
    trendDir: 'up',
    trendVal: '+12 vs 24h ago',
    status: 'green',
  },
]

// ── 2. Fleet Health Donut ─────────────────────────────────────────────────────
export const FLEET_HEALTH = [
  { name: 'Online',   value: 1800, pct: 94.1, color: '#22C55E' },
  { name: 'Degraded', value:   57, pct:  2.9, color: '#F59E0B' },
  { name: 'Offline',  value:   55, pct:  2.8, color: '#EF4444' },
]

// ── 3. WiFi Health Score Trend ────────────────────────────────────────────────
// There was a significant incident 4 days ago (Wed) visible in 7d view.
export const WIFI_HEALTH = {
  '24h': [
    { t: '00:00', score: 83.2 }, { t: '01:00', score: 82.8 },
    { t: '02:00', score: 82.5 }, { t: '03:00', score: 83.1 },
    { t: '04:00', score: 83.8 }, { t: '05:00', score: 84.2 },
    { t: '06:00', score: 84.5 }, { t: '07:00', score: 84.8 },
    { t: '08:00', score: 84.6 }, { t: '09:00', score: 84.3 },
    { t: '10:00', score: 84.1 }, { t: '11:00', score: 83.9 },
    { t: '12:00', score: 83.7 }, { t: '13:00', score: 84.0 },
    { t: '14:00', score: 84.3 }, { t: '15:00', score: 84.6 },
    { t: '16:00', score: 84.9 }, { t: '17:00', score: 85.1 },
    { t: '18:00', score: 84.8 }, { t: '19:00', score: 84.5 },
    { t: '20:00', score: 84.2 }, { t: '21:00', score: 84.0 },
    { t: '22:00', score: 84.3 }, { t: '23:00', score: 84.7 },
  ],
  '7d': [
    { t: 'Mon', score: 83.9 },
    { t: 'Tue', score: 84.2 },
    { t: 'Wed', score: 14.3 }, // ← major incident
    { t: 'Thu', score: 58.9 }, // recovering
    { t: 'Fri', score: 76.4 },
    { t: 'Sat', score: 81.2 },
    { t: 'Sun', score: 84.7 },
  ],
  '30d': [
    { t: 'Jun 8',  score: 84.1 }, { t: 'Jun 9',  score: 83.7 },
    { t: 'Jun 10', score: 83.9 }, { t: 'Jun 11', score: 84.4 },
    { t: 'Jun 12', score: 84.8 }, { t: 'Jun 13', score: 83.5 },
    { t: 'Jun 14', score: 83.2 }, { t: 'Jun 15', score: 84.0 },
    { t: 'Jun 16', score: 84.3 }, { t: 'Jun 17', score: 83.8 },
    { t: 'Jun 18', score: 84.1 }, { t: 'Jun 19', score: 84.6 },
    { t: 'Jun 20', score: 84.9 }, { t: 'Jun 21', score: 85.0 },
    { t: 'Jun 22', score: 84.7 }, { t: 'Jun 23', score: 84.2 },
    { t: 'Jun 24', score: 83.9 }, { t: 'Jun 25', score: 84.1 },
    { t: 'Jun 26', score: 84.4 }, { t: 'Jun 27', score: 84.6 },
    { t: 'Jun 28', score: 84.2 }, { t: 'Jun 29', score: 84.5 },
    { t: 'Jun 30', score: 83.9 }, { t: 'Jul 1',  score: 84.2 },
    { t: 'Jul 2',  score: 83.9 }, { t: 'Jul 3',  score: 84.0 },
    { t: 'Jul 4',  score: 14.3 }, // incident visible in 30d too
    { t: 'Jul 5',  score: 58.9 },
    { t: 'Jul 6',  score: 76.4 },
    { t: 'Jul 7',  score: 84.7 },
  ],
  '90d': [
    { t: 'Apr W1', score: 83.2 }, { t: 'Apr W2', score: 82.8 },
    { t: 'Apr W3', score: 83.5 }, { t: 'Apr W4', score: 82.1 },
    { t: 'May W1', score: 83.8 }, { t: 'May W2', score: 84.2 },
    { t: 'May W3', score: 83.9 }, { t: 'May W4', score: 84.1 },
    { t: 'Jun W1', score: 84.4 }, { t: 'Jun W2', score: 84.8 },
    { t: 'Jun W3', score: 84.6 }, { t: 'Jun W4', score: 31.2 }, // incident week
    { t: 'Jul W1', score: 84.7 },
  ],
}

// ── 4. Air Time Utilization Trend ─────────────────────────────────────────────
// 3 lines: 2.4GHz (amber), 5GHz (purple), 6GHz (cyan)
export const AIR_TIME = {
  '24h': [
    { t: '00:00', g24: 68.2, g5: 12.1, g6: 13.8 },
    { t: '04:00', g24: 66.9, g5: 11.8, g6: 14.2 },
    { t: '08:00', g24: 72.4, g5: 14.8, g6: 16.1 },
    { t: '12:00', g24: 74.8, g5: 15.9, g6: 17.4 },
    { t: '16:00', g24: 76.2, g5: 16.4, g6: 18.2 },
    { t: '20:00', g24: 71.5, g5: 14.1, g6: 16.8 },
    { t: '24:00', g24: 70.1, g5: 13.2, g6: 15.9 },
  ],
  '7d': [
    { t: 'Mon', g24: 70.1, g5: 14.0, g6: 15.8 },
    { t: 'Tue', g24: 71.3, g5: 14.5, g6: 16.2 },
    { t: 'Wed', g24: 70.8, g5: 13.8, g6: 15.9 },
    { t: 'Thu', g24: 72.1, g5: 14.9, g6: 16.5 },
    { t: 'Fri', g24: 73.4, g5: 15.2, g6: 17.1 },
    { t: 'Sat', g24: 69.8, g5: 13.5, g6: 15.4 },
    { t: 'Sun', g24: 71.3, g5: 14.3, g6: 16.5 },
  ],
  '30d': [
    { t: 'Jun 8',  g24: 74.2, g5: 14.8, g6: 14.2 },
    { t: 'Jun 13', g24: 73.8, g5: 14.5, g6: 14.5 },
    { t: 'Jun 18', g24: 74.1, g5: 14.6, g6: 14.3 },
    { t: 'Jun 23', g24: 73.5, g5: 14.4, g6: 14.8 },
    { t: 'Jun 28', g24: 72.9, g5: 14.2, g6: 15.1 },
    { t: 'Jul 3',  g24: 71.6, g5: 14.1, g6: 15.8 },
    { t: 'Jul 7',  g24: 71.3, g5: 14.3, g6: 16.5 },
  ],
  '90d': [
    { t: 'Apr W1', g24: 79.2, g5: 16.1, g6: 13.1 },
    { t: 'Apr W3', g24: 78.4, g5: 16.5, g6: 13.5 },
    { t: 'May W1', g24: 77.6, g5: 16.2, g6: 14.0 },
    { t: 'May W3', g24: 76.8, g5: 15.9, g6: 14.4 },
    { t: 'Jun W1', g24: 75.4, g5: 15.4, g6: 14.6 },
    { t: 'Jun W3', g24: 73.9, g5: 14.7, g6: 15.2 },
    { t: 'Jul W1', g24: 71.3, g5: 14.3, g6: 16.5 },
  ],
}

// ── 5. Signal Strength Distribution Trend ────────────────────────────────────
// Stacked bars: excellent (>-40), good (-60 to -40), fair (-80 to -60), poor (<-80)
export const SIGNAL_STRENGTH = {
  '24h': [
    { t: '00:00', excellent: 48.2, good: 35.8, fair: 14.1, poor: 1.9 },
    { t: '04:00', excellent: 47.8, good: 35.4, fair: 14.8, poor: 2.0 },
    { t: '08:00', excellent: 49.1, good: 36.2, fair: 13.6, poor: 1.1 },
    { t: '12:00', excellent: 50.3, good: 36.8, fair: 11.9, poor: 1.0 },
    { t: '16:00', excellent: 51.2, good: 37.1, fair: 10.8, poor: 0.9 },
    { t: '20:00', excellent: 50.4, good: 36.5, fair: 12.2, poor: 0.9 },
    { t: '24:00', excellent: 49.6, good: 36.4, fair: 12.9, poor: 1.1 },
  ],
  '7d': [
    { t: 'Mon', excellent: 50.1, good: 36.8, fair: 12.2, poor: 0.9 },
    { t: 'Tue', excellent: 49.8, good: 36.5, fair: 12.7, poor: 1.0 },
    { t: 'Wed', excellent: 49.3, good: 36.1, fair: 13.5, poor: 1.1 },
    { t: 'Thu', excellent: 49.8, good: 36.4, fair: 12.8, poor: 1.0 },
    { t: 'Fri', excellent: 50.4, good: 36.7, fair: 11.9, poor: 1.0 },
    { t: 'Sat', excellent: 48.9, good: 36.2, fair: 13.8, poor: 1.1 },
    { t: 'Sun', excellent: 49.6, good: 36.4, fair: 12.9, poor: 1.1 },
  ],
  '30d': [
    { t: 'Jun 8',  excellent: 52.3, good: 36.9, fair: 9.8,  poor: 1.0 },
    { t: 'Jun 13', excellent: 51.8, good: 36.7, fair: 10.4, poor: 1.1 },
    { t: 'Jun 18', excellent: 51.2, good: 36.5, fair: 11.2, poor: 1.1 },
    { t: 'Jun 23', excellent: 50.9, good: 36.4, fair: 11.6, poor: 1.1 },
    { t: 'Jun 28', excellent: 50.4, good: 36.3, fair: 12.2, poor: 1.1 },
    { t: 'Jul 3',  excellent: 49.8, good: 36.4, fair: 12.7, poor: 1.1 },
    { t: 'Jul 7',  excellent: 49.6, good: 36.4, fair: 12.9, poor: 1.1 },
  ],
  '90d': [
    { t: 'Apr W1', excellent: 55.1, good: 35.8, fair: 8.2,  poor: 0.9 },
    { t: 'Apr W3', excellent: 54.2, good: 36.0, fair: 8.8,  poor: 1.0 },
    { t: 'May W1', excellent: 53.4, good: 36.2, fair: 9.4,  poor: 1.0 },
    { t: 'May W3', excellent: 52.6, good: 36.4, fair: 9.9,  poor: 1.1 },
    { t: 'Jun W1', excellent: 51.8, good: 36.5, fair: 10.6, poor: 1.1 },
    { t: 'Jun W3', excellent: 50.7, good: 36.4, fair: 11.8, poor: 1.1 },
    { t: 'Jul W1', excellent: 49.6, good: 36.4, fair: 12.9, poor: 1.1 },
  ],
}

// ── 6. Channel In-Use (4 donuts × 3 bands) ───────────────────────────────────
const CH_COLORS = [
  '#3B82F6','#22C55E','#F59E0B','#EF4444','#A855F7','#06B6D4',
  '#EC4899','#84CC16','#F97316','#8B5CF6','#14B8A6','#F43F5E',
]

export const CHANNEL_IN_USE = {
  '5G': {
    '24h': [
      { name: 'Ch 36', value: 28 }, { name: 'Ch 40', value: 18 },
      { name: 'Ch 44', value: 14 }, { name: 'Ch 48', value: 11 },
      { name: 'Ch 149', value: 16 }, { name: 'Ch 153', value: 8 },
      { name: 'Ch 157', value: 5 },
    ],
    '7d': [
      { name: 'Ch 36', value: 26 }, { name: 'Ch 40', value: 19 },
      { name: 'Ch 44', value: 15 }, { name: 'Ch 48', value: 12 },
      { name: 'Ch 149', value: 15 }, { name: 'Ch 153', value: 9 },
      { name: 'Ch 157', value: 4 },
    ],
    '30d': [
      { name: 'Ch 36', value: 24 }, { name: 'Ch 40', value: 20 },
      { name: 'Ch 44', value: 16 }, { name: 'Ch 48', value: 13 },
      { name: 'Ch 149', value: 14 }, { name: 'Ch 153', value: 9 },
      { name: 'Ch 157', value: 4 },
    ],
    '90d': [
      { name: 'Ch 36', value: 22 }, { name: 'Ch 40', value: 21 },
      { name: 'Ch 44', value: 17 }, { name: 'Ch 48', value: 14 },
      { name: 'Ch 149', value: 13 }, { name: 'Ch 153', value: 9 },
      { name: 'Ch 157', value: 4 },
    ],
  },
  '6G': {
    '24h': [
      { name: 'Ch 37', value: 42 }, { name: 'Ch 53', value: 21 },
      { name: 'Ch 69', value: 14 }, { name: 'Ch 85', value: 11 },
      { name: 'Ch 101', value: 8 }, { name: 'Ch 117', value: 4 },
    ],
    '7d': [
      { name: 'Ch 37', value: 40 }, { name: 'Ch 53', value: 22 },
      { name: 'Ch 69', value: 15 }, { name: 'Ch 85', value: 12 },
      { name: 'Ch 101', value: 7 }, { name: 'Ch 117', value: 4 },
    ],
    '30d': [
      { name: 'Ch 37', value: 38 }, { name: 'Ch 53', value: 23 },
      { name: 'Ch 69', value: 16 }, { name: 'Ch 85', value: 13 },
      { name: 'Ch 101', value: 6 }, { name: 'Ch 117', value: 4 },
    ],
    '90d': [
      { name: 'Ch 37', value: 36 }, { name: 'Ch 53', value: 24 },
      { name: 'Ch 69', value: 17 }, { name: 'Ch 85', value: 14 },
      { name: 'Ch 101', value: 5 }, { name: 'Ch 117', value: 4 },
    ],
  },
  '2.4G': {
    '24h': [
      { name: 'Ch 1',  value: 38 }, { name: 'Ch 6',  value: 35 },
      { name: 'Ch 11', value: 27 },
    ],
    '7d': [
      { name: 'Ch 1',  value: 36 }, { name: 'Ch 6',  value: 36 },
      { name: 'Ch 11', value: 28 },
    ],
    '30d': [
      { name: 'Ch 1',  value: 35 }, { name: 'Ch 6',  value: 37 },
      { name: 'Ch 11', value: 28 },
    ],
    '90d': [
      { name: 'Ch 1',  value: 34 }, { name: 'Ch 6',  value: 38 },
      { name: 'Ch 11', value: 28 },
    ],
  },
}

export { CH_COLORS }

// ── NEW: Fleet Health Score ───────────────────────────────────────────────────
export const FLEET_SCORE = {
  current: 74.3,
  delta: 1.2,
  trend: [
    68.2, 68.5, 67.8, 69.1, 69.4, 70.2, 69.8, 70.5, 71.1, 70.8,
    71.4, 71.9, 72.1, 71.8, 72.4, 72.0, 72.6, 73.1, 72.9, 73.4,
    73.8, 73.5, 73.9, 74.1, 73.8, 74.0, 74.3, 74.5, 74.2, 74.3,
  ],
  trends: {
    '7d': [
      { label: 'Thu', value: 72.9 },
      { label: 'Fri', value: 73.4 },
      { label: 'Sat', value: 73.8 },
      { label: 'Sun', value: 73.5 },
      { label: 'Mon', value: 74.0 },
      { label: 'Tue', value: 74.5 },
      { label: 'Now', value: 74.3 },
    ],
    '30d': [
      { label: 'D-29', value: 68.2 }, { label: 'D-28', value: 68.5 },
      { label: 'D-27', value: 67.8 }, { label: 'D-26', value: 69.1 },
      { label: 'D-25', value: 69.4 }, { label: 'D-24', value: 70.2 },
      { label: 'D-23', value: 69.8 }, { label: 'D-22', value: 70.5 },
      { label: 'D-21', value: 71.1 }, { label: 'D-20', value: 70.8 },
      { label: 'D-19', value: 71.4 }, { label: 'D-18', value: 71.9 },
      { label: 'D-17', value: 72.1 }, { label: 'D-16', value: 71.8 },
      { label: 'D-15', value: 72.4 }, { label: 'D-14', value: 72.0 },
      { label: 'D-13', value: 72.6 }, { label: 'D-12', value: 73.1 },
      { label: 'D-11', value: 72.9 }, { label: 'D-10', value: 73.4 },
      { label: 'D-9',  value: 73.8 }, { label: 'D-8',  value: 73.5 },
      { label: 'D-7',  value: 73.9 }, { label: 'D-6',  value: 74.1 },
      { label: 'D-5',  value: 73.8 }, { label: 'D-4',  value: 74.0 },
      { label: 'D-3',  value: 74.3 }, { label: 'D-2',  value: 74.5 },
      { label: 'D-1',  value: 74.2 }, { label: 'Now',  value: 74.3 },
    ],
  },
}

// ── NEW: Hero KPI strip ───────────────────────────────────────────────────────
export const HERO_KPIS = [
  { label: 'Speed Performance', value: '87.4%', sub: 'delivering vs provisioned tier', trend: 'up',   trendVal: '+2.1%' },
  { label: 'WiFi Optimal Rate',  value: '71.2%', sub: 'RSSI > −65 dBm fleet-wide',     trend: 'down', trendVal: '−1.3%' },
  { label: 'Firmware Currency',  value: '68.1%', sub: 'on v1.2.x (latest branch)',      trend: 'up',   trendVal: '+4.8%' },
  { label: 'Stability Rate',     value: '97.9%', sub: '< 1 unplanned reboot / day',     trend: 'flat', trendVal: '±0.1%' },
]

// ── NEW: Per-zone segmentation ────────────────────────────────────────────────
export const ZONE_SEGMENTS = {
  critical: {
    count: 153,
    issue: [
      { name: 'Offline — no WAN signal',   val: 'offline',  count: 89, color: '#EF4444' },
      { name: 'Speed critical (< 30% tier)', val: 'speed',  count: 41, color: '#F97316' },
      { name: 'Unstable / boot-loop',        val: 'unstable',count: 23, color: '#A855F7' },
    ],
    location: [
      { name: 'Seattle, WA',  val: 'Seattle',  count: 52, color: '#EF4444' },
      { name: 'Tacoma, WA',   val: 'Tacoma',   count: 44, color: '#EF4444' },
      { name: 'Renton, WA',   val: 'Renton',   count: 31, color: '#EF4444' },
      { name: 'Bellevue, WA', val: 'Bellevue', count: 26, color: '#EF4444' },
    ],
    firmware: [
      { name: 'v1.1.0 (end-of-life)', val: 'v1.1.0', count: 82, color: '#EF4444' },
      { name: 'v1.1.8 (stable)',       val: 'v1.1.8', count: 55, color: '#F97316' },
      { name: 'v1.2.0 (current)',      val: 'v1.2.0', count: 16, color: '#F59E0B' },
    ],
  },
  degraded: {
    count: 347,
    issue: [
      { name: 'WiFi weak signal / high retry', val: 'wifi',     count: 142, color: '#F59E0B' },
      { name: 'Speed below tier (30–70%)',      val: 'speed',    count: 113, color: '#F97316' },
      { name: 'Frequent reboots / unstable',    val: 'unstable', count:  92, color: '#A855F7' },
    ],
    location: [
      { name: 'Seattle, WA',   val: 'Seattle',   count:  98, color: '#F59E0B' },
      { name: 'Bellevue, WA',  val: 'Bellevue',  count:  87, color: '#F59E0B' },
      { name: 'Kirkland, WA',  val: 'Kirkland',  count:  72, color: '#F59E0B' },
      { name: 'Redmond, WA',   val: 'Redmond',   count:  54, color: '#F59E0B' },
      { name: 'Renton, WA',    val: 'Renton',    count:  36, color: '#F59E0B' },
    ],
    firmware: [
      { name: 'v1.1.0 (end-of-life)', val: 'v1.1.0', count:  12, color: '#EF4444' },
      { name: 'v1.1.8 (stable)',       val: 'v1.1.8', count: 189, color: '#F59E0B' },
      { name: 'v1.2.0 (current)',      val: 'v1.2.0', count: 146, color: '#22C55E' },
    ],
  },
  healthy: {
    count: 1371,
    issue: [
      { name: 'Healthy — all checks pass',  val: 'healthy', count: 1247, color: '#22C55E' },
      { name: 'Minor WiFi (RSSI −65–−70)', val: 'wifi',    count:  124, color: '#F59E0B' },
    ],
    location: [
      { name: 'Seattle, WA',    val: 'Seattle',    count: 412, color: '#22C55E' },
      { name: 'Bellevue, WA',   val: 'Bellevue',   count: 289, color: '#22C55E' },
      { name: 'Redmond, WA',    val: 'Redmond',    count: 201, color: '#22C55E' },
      { name: 'Kirkland, WA',   val: 'Kirkland',   count: 187, color: '#22C55E' },
      { name: 'Issaquah, WA',   val: 'Issaquah',   count: 156, color: '#22C55E' },
      { name: 'Sammamish, WA',  val: 'Sammamish',  count: 126, color: '#22C55E' },
    ],
    firmware: [
      { name: 'v1.2.0 (current)', val: 'v1.2.0', count: 501, color: '#22C55E' },
      { name: 'v1.2.1 (latest)',   val: 'v1.2.1', count: 870, color: '#22C55E' },
    ],
  },
}

// ── NEW: Network Health Command section ──────────────────────────────────────
export const SEGMENTATION_ROWS = [
  { id: 'seg-01', segment: 'Fiber Pro',            region: 'Metro West', slaTier: 'Business Gold', issueType: 'WiFi congestion',        firmware: 'v1.2.1', accounts: 312, healthy: 240, degraded: 52, critical: 20, trendDelta: 2.6 },
  { id: 'seg-02', segment: 'Fiber Pro',            region: 'Metro East', slaTier: 'Business Gold', issueType: 'DNS timeout',            firmware: 'v1.2.1', accounts: 284, healthy: 218, degraded: 44, critical: 22, trendDelta: 1.8 },
  { id: 'seg-03', segment: 'SMB Connect',          region: 'West Region', slaTier: 'Business Plus', issueType: 'Reboot spike',          firmware: 'v1.1.8', accounts: 246, healthy: 176, degraded: 47, critical: 23, trendDelta: 3.1 },
  { id: 'seg-04', segment: 'SMB Connect',          region: 'East Region', slaTier: 'Business Plus', issueType: 'Speed under-delivery',  firmware: 'v1.1.8', accounts: 231, healthy: 164, degraded: 48, critical: 19, trendDelta: 2.2 },
  { id: 'seg-05', segment: 'Residential Premium',  region: 'City Core',   slaTier: 'Consumer Plus', issueType: 'WiFi congestion',       firmware: 'v1.2.1', accounts: 298, healthy: 238, degraded: 43, critical: 17, trendDelta: 1.1 },
  { id: 'seg-06', segment: 'Residential Standard', region: 'Suburban',    slaTier: 'Consumer Core', issueType: 'Speed under-delivery', firmware: 'v1.2.0', accounts: 265, healthy: 182, degraded: 58, critical: 25, trendDelta: 2.9 },
  { id: 'seg-07', segment: 'Rural Fixed Wireless', region: 'Rural North', slaTier: 'Consumer Core', issueType: 'Signal instability',   firmware: 'v1.1.0', accounts: 149, healthy: 88,  degraded: 39, critical: 22, trendDelta: 4.0 },
  { id: 'seg-08', segment: 'Public Sector',        region: 'Statewide',   slaTier: 'VIP / SLA Critical', issueType: 'DNS timeout',    firmware: 'v1.2.0', accounts: 86,  healthy: 65,  degraded: 16, critical: 5,  trendDelta: 0.7 },
]

export const ISSUE_CLUSTERS = [
  { id: 'cluster-1', title: 'WiFi Channel Congestion', issueKey: 'wifi', severity: 'high', accounts: 347, region: 'Metro West + City Core', segment: 'Fiber Pro + Residential Premium', delta: '+18% vs 7d', playbook: 'RF-CH-17' },
  { id: 'cluster-2', title: 'Reboot Spike on Legacy Firmware', issueKey: 'unstable', severity: 'critical', accounts: 153, region: 'Rural North + West Region', segment: 'Rural Fixed + SMB Connect', delta: '+27% vs 7d', playbook: 'STB-RBT-09' },
  { id: 'cluster-3', title: 'DNS Timeout Burst', issueKey: 'speed', severity: 'medium', accounts: 102, region: 'Metro East + Statewide', segment: 'Fiber Pro + Public Sector', delta: '+9% vs 7d', playbook: 'DNS-RTT-04' },
]

// ── NEW: Firmware verification model ──────────────────────────────────────────
export const FW_HEALTH = [
  { label: 'v1.0.9', stage: 'Legacy',      healthDelta: -3.2, baselineHealth: 62.1, postHealth: 58.9, count: 41,  confidence: 0.86, color: '#B91C1C', recommendation: 'Hold' },
  { label: 'v1.1.0', stage: 'End-of-life', healthDelta: -1.8, baselineHealth: 63.4, postHealth: 61.6, count: 82,  confidence: 0.82, color: '#EF4444', recommendation: 'Hold' },
  { label: 'v1.1.8', stage: 'Stable',      healthDelta: 0.6,  baselineHealth: 69.1, postHealth: 69.7, count: 401, confidence: 0.71, color: '#F59E0B', recommendation: 'Monitor' },
  { label: 'v1.2.0', stage: 'Current',     healthDelta: 2.4,  baselineHealth: 71.3, postHealth: 73.7, count: 461, confidence: 0.79, color: '#22C55E', recommendation: 'Promote' },
  { label: 'v1.2.1', stage: 'Current',     healthDelta: 2.9,  baselineHealth: 72.0, postHealth: 74.9, count: 610, confidence: 0.84, color: '#14B8A6', recommendation: 'Promote' },
  { label: 'v1.2.2', stage: 'Latest',      healthDelta: 3.3,  baselineHealth: 72.4, postHealth: 75.7, count: 276, confidence: 0.91, color: '#22D3EE', recommendation: 'Promote' },
]

// ── NEW: Dashboard account list ───────────────────────────────────────────────
// Deterministic generated demo data (1,871 accounts) to stress pagination UX.
const TOTAL_ACCOUNTS = 1871
const CRITICAL_COUNT = 153
const DEGRADED_COUNT = 347

const SEGMENTS = [
  'Fiber Pro',
  'SMB Connect',
  'Residential Premium',
  'Residential Standard',
  'Rural Fixed Wireless',
  'Public Sector',
]
const LOCATIONS = ['Seattle', 'Tacoma', 'Bellevue', 'Renton', 'Kirkland', 'Redmond', 'Sammamish', 'Issaquah']
const MODELS = ['WF-720GF', 'WF-1000v3', 'WF-1000v4', 'WF-1300x']
const TIERS = ['100M DSL', '250M Cable', '500M Cable', '500M Fiber', '1G Fiber', 'Business Plus', 'VIP / SLA Critical']
const REGIONS = ['Seattle Metro', 'Tacoma / Pierce', 'Eastside / Snoqualmie', 'Rural North', 'Rural West']

// Location to Region mapping
const LOCATION_TO_REGION = {
  'Seattle': 'Seattle Metro',
  'Renton': 'Seattle Metro',
  'Tacoma': 'Tacoma / Pierce',
  'Bellevue': 'Eastside / Snoqualmie',
  'Redmond': 'Eastside / Snoqualmie',
  'Sammamish': 'Eastside / Snoqualmie',
  'Issaquah': 'Eastside / Snoqualmie',
  'Kirkland': 'Rural North',
}

function locationToRegion(loc) {
  return LOCATION_TO_REGION[loc] || 'Rural West'
}

function issueForIndex(i, status) {
  if (status === 'critical') {
    if (i < 89) return { issue: 'offline', label: 'Offline' }
    if (i < 130) return { issue: 'speed', label: 'Speed ↓' }
    return { issue: 'unstable', label: 'Unstable' }
  }
  if (status === 'degraded') {
    const j = i - CRITICAL_COUNT
    if (j < 142) return { issue: 'wifi', label: 'WiFi Weak' }
    if (j < 255) return { issue: 'speed', label: 'Speed ↓' }
    return { issue: 'unstable', label: 'Unstable' }
  }
  return { issue: 'healthy', label: 'Healthy' }
}

function firmwareForIndex(i) {
  if (i < 41) return 'v1.0.9'
  if (i < 123) return 'v1.1.0'
  if (i < 524) return 'v1.1.8'
  if (i < 985) return 'v1.2.0'
  if (i < 1595) return 'v1.2.1'
  return 'v1.2.2'
}

function statusForIndex(i) {
  if (i < CRITICAL_COUNT) return 'critical'
  if (i < CRITICAL_COUNT + DEGRADED_COUNT) return 'degraded'
  return 'healthy'
}

function scoreForIndex(i, status) {
  if (status === 'critical') return Math.max(1, 6 + (i % 32))
  if (status === 'degraded') return 41 + (i % 28)
  return 70 + (i % 29)
}

export const DASH_ACCOUNTS = Array.from({ length: TOTAL_ACCOUNTS }, (_, i) => {
  const idx = i + 1
  const status = statusForIndex(i)
  const issueMeta = issueForIndex(i, status)
  const segment = SEGMENTS[i % SEGMENTS.length]
  const model = MODELS[i % MODELS.length]
  const tier = TIERS[i % TIERS.length]
  const loc = LOCATIONS[i % LOCATIONS.length]
  const fw = firmwareForIndex(i)
  const regionName = locationToRegion(loc)
  const regionIdx = REGIONS.indexOf(regionName)
  const score = scoreForIndex(i, status)
  const healthStatus = status === 'critical' ? 'offline' : status

  return {
    id: `da-${String(idx).padStart(4, '0')}`,
    accountId: `Account ${String(idx).padStart(4, '0')}`,
    name: `Account ${String(idx).padStart(4, '0')}`,
    serial: `JG${String(1251000000 + idx)}`,
    model,
    tier,
    loc,
    segment,
    fw,
    score,
    healthScore: score,
    issue: issueMeta.issue,
    label: issueMeta.label,
    status: healthStatus,
    healthStatus,
    region: `region-${regionIdx}`,
  }
})

// ── NEW: Regional health distribution ─────────────────────────────────────────

// Geographic coordinates for Washington state regions (lat, lng, radius in km)
const REGION_COORDS = [
  { lat: 47.6, lng: -122.3, radiusKm: 25 },    // Seattle Metro
  { lat: 47.2, lng: -122.4, radiusKm: 20 },    // Tacoma / Pierce
  { lat: 47.65, lng: -121.8, radiusKm: 30 },   // Eastside / Snoqualmie
  { lat: 48.1, lng: -121.9, radiusKm: 35 },    // Rural North
  { lat: 47.1, lng: -121.2, radiusKm: 40 },    // Rural West
]

export const REGION_HEALTH = REGIONS.map((region, idx) => {
  const regionOffset = idx * 374
  const regionTotal = 374 + (idx === REGIONS.length - 1 ? TOTAL_ACCOUNTS % REGIONS.length : 0)
  
  const critical = Math.floor(CRITICAL_COUNT / REGIONS.length) + (idx === 1 ? 20 : idx === 2 ? 10 : 0)
  const degraded = Math.floor(DEGRADED_COUNT / REGIONS.length) + (idx === 0 ? 30 : 0)
  const healthy = regionTotal - critical - degraded
  
  const coords = REGION_COORDS[idx]
  return {
    id: `region-${idx}`,
    name: region,
    total: regionTotal,
    healthy,
    degraded,
    critical,
    healthScore: Math.round((healthy * 100 + degraded * 60 + critical * 20) / regionTotal),
    lat: coords.lat,
    lng: coords.lng,
    radiusKm: coords.radiusKm,
  }
})
