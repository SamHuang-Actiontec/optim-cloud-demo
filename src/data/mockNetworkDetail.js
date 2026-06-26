// Extended detail data for the Network Detail Page (5-zone customer view)
// Keyed by customer ID. Pairs with mockCustomers.js.

// ── Seeded PRNG ──────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function genLatency(base, variance, spikePct, seed = 42) {
  const rand = mulberry32(seed)
  const now = new Date()
  return Array.from({ length: 24 }, (_, i) => {
    const h = new Date(now.getTime() - (23 - i) * 3600000)
    const spike = rand() < spikePct ? variance * 5 * rand() : 0
    const v = Math.max(1, Math.round(base + (rand() - 0.5) * variance * 2 + spike))
    return { time: `${String(h.getHours()).padStart(2, '0')}:00`, ms: v }
  })
}

function band(util, noise, clients, rssiCounts, steerPct, interference, channel) {
  const [good, fair, poor] = rssiCounts
  return {
    util, noise, clients, channel, steerPct, interference,
    rssiDist: [
      { label: 'Strong\n>−60', count: good, level: 'good' },
      { label: 'Fair\n−60–75', count: fair, level: 'fair' },
      { label: 'Weak\n<−75',  count: poor, level: 'poor' },
    ],
  }
}

// ── Device helpers ────────────────────────────────────────────────────────────
function gw(id, model, firmware, uptime, rxDbm = null, clientCount = 0) {
  return {
    id, cat: 'equipment', type: 'gateway', name: model, model,
    location: null,
    status: 'online',
    firmware,
    uptime,
    backhaul: null,
    rxDbm,
    clientCount,
    mac: `a4:c3:f0:${id.slice(-2)}:11:22`,
    band: null, rssi: null, connectedTo: 'Gateway', lastSeen: 'now',
  }
}

function ext(id, location, model, status, signal, clientCount, backhaulType = 'ethernet', uptime = '8d 2h') {
  const bquality = signal > -65 ? 'good' : signal > -75 ? 'fair' : 'poor'
  return {
    id, cat: 'equipment', type: 'extender', name: `${model} · ${location}`, model,
    location,
    status,
    firmware: { current: '1.2.1', latest: '1.2.1', upToDate: true },
    uptime,
    backhaul: { type: backhaulType, quality: bquality },
    rxDbm: null,
    clientCount,
    mac: `b8:e8:56:${id.slice(-2)}:33:44`,
    band: backhaulType === 'ethernet' ? 'Ethernet' : backhaulType === 'wireless-5g' ? '5G' : '2.4G',
    rssi: signal, connectedTo: 'Gateway', lastSeen: uptime,
  }
}

function cli(id, name, node, band, rssi, lastSeen = 'now', usageMbps = null) {
  const macParts = id.replace('c', '').padStart(2, '0')
  return {
    id, cat: 'client', name,
    mac: `dc:a6:32:${macParts}:55:66`,
    status: 'online',
    connectedTo: node, band, rssi, lastSeen, usageMbps,
    firmware: null, uptime: null, rxDbm: null, backhaul: null, clientCount: null, model: null, location: null, type: null,
  }
}

export function parseTierMbps(serviceLevel) {
  if (!serviceLevel) return null
  const g = serviceLevel.match(/(\d+(?:\.\d+)?)\s*Gbps/i)
  if (g) return parseFloat(g[1]) * 1000
  const m = serviceLevel.match(/(\d+(?:\.\d+)?)\s*Mbps/i)
  if (m) return parseFloat(m[1])
  return null
}

// ── Detail records ───────────────────────────────────────────────────────────
const details = {

  // ── Jim Strothmann — 1Gbps Fiber, online, HEALTHY (happy path demo) ─────────
  'cust-001': {
    installDate: 'Mar 2021',
    activityLog: [
      { date: 'Jun 3', time: '2:11 PM', op: 'AB', action: 'Speed Test',     outcome: 'completed', label: '952↓ / 938↑ Mbps'          },
      { date: 'Jun 3', time: '2:08 PM', op: 'AB', action: 'Session closed', outcome: 'info',      label: 'No action taken'            },
      { date: 'May 22', time: '9:30 AM', op: 'SH', action: 'Firmware Push', outcome: 'completed', label: 'v1.2.1-p.42'               },
    ],
    wanExtra: {
      baseline: { down: 950, up: 935 },
      liveUsageMbps: 12.4,
      speedHistory: [
        { date: 'Jun 3',  down: 952, up: 938, latency: 4,  anomaly: false },
        { date: 'Jun 1',  down: 945, up: 921, latency: 4,  anomaly: false },
        { date: 'May 22', down: 961, up: 943, latency: 3,  anomaly: false },
        { date: 'May 15', down: 938, up: 929, latency: 5,  anomaly: false },
        { date: 'Apr 30', down: 312, up: 45,  latency: 12, anomaly: true  },
        { date: 'Apr 22', down: 948, up: 931, latency: 4,  anomaly: false },
      ],
      connectionEvents: [
        { online: true,  label: 'Jun 1 – Jun 4', note: 'Online continuously' },
        { online: false, label: 'May 22', note: 'Offline 9:30–9:38 AM — firmware reboot', duration: '8 min' },
      ],
    },
    ai: {
      healthScore: 91, issueCount: 0, analyzedCount: 47, status: 'healthy',
      issue: null, secondaryIssues: [],
      topIndicators: [
        { label: 'WAN Speed',     value: '952↓ / 938↑ Mbps', verdict: 'Within baseline' },
        { label: 'Channel Env',   value: '2.4G 38% · 5G 27%', verdict: 'Clear' },
        { label: 'Client Signal', value: '15 dev · 1 weak',   verdict: 'Acceptable' },
        { label: 'Latency',       value: '4 ms avg',          verdict: 'Normal' },
      ],
      minorObservations: ['1 client on weak signal'],
    },
    wan: {
      latencyHistory: genLatency(4, 2, 0.04, 101),
      dnsMs: 9, ipv4: true, ipv6: true,
      firmware: { current: '1.2.1-p.42', latest: '1.2.1-p.42', upToDate: true },
      optical: { rxDbm: -16.2, txDbm: 2.4 },
      errors: { crc: 0, fec: 12 },
    },
    wifi: {
      activeBand: '5G',
      bands: {
        '2.4G': band(38, -92, 3, [1, 1, 1], 0, 0, 6),
        '5G':   band(27, -97, 12, [9, 2, 1], 0, 0, 36),
        '6G':   null,
      },
      topology: { gateway: { clients: 15 }, extenders: [] },
      ssids: [{ name: 'JimHome', password: 'Str0thm@nn2021' }],
      bandSteering: true,
      channelScan: {
        lastScan: '06/03/26, 2:15 PM',
        '2.4G': { neighborCount: 5 },
        '5G': { neighborCount: 2 },
        neighbors: [],
      },
    },
    tickets: [],
    serviceLog: [
      { type: 'firmware', title: 'Firmware updated to v1.2.1-p.42', detail: 'Scheduled maintenance — no downtime', timeAgo: '12d ago', icon: 'upgrade' },
      { type: 'speedtest', title: 'Speed test completed', detail: '952 / 938 Mbps — within tier', timeAgo: '14d ago', icon: 'zap' },
      { type: 'install', title: 'Account activated', detail: '1 Gbps Fiber — March 2021', timeAgo: '5y ago', icon: 'check' },
    ],
    actions: [
      { id: 'a1', priority: 'low', title: 'Review IPv6 prefix delegation', detail: 'Prefix TTL approaching renewal window in 3 days', cta: 'View Config', completed: false },
    ],
    devices: [
      gw('gw1', 'WF-1000v4', { current: '1.2.1-p.42', latest: '1.2.1-p.42', upToDate: true }, '14d 6h', -16.2, 15),
      cli('c1',  'MacBook Pro',       'Gateway', '5G',   -44, 'now',    18.4),
      cli('c2',  'iPhone 15 Pro',     'Gateway', '5G',   -51, '2m ago',  1.2),
      cli('c3',  'iPad Air',          'Gateway', '5G',   -55, '5m ago',  0.4),
      cli('c4',  'Apple TV 4K',       'Gateway', '5G',   -48, 'now',    14.7),
      cli('c5',  'Sony Bravia TV',    'Gateway', '5G',   -61, 'now',     8.3),
      cli('c6',  'Nintendo Switch',   'Gateway', '5G',   -58, '1h ago',  null),
      cli('c7',  'Ring Doorbell',     'Gateway', '2.4G', -67, 'now',     0.2),
      cli('c8',  'Nest Thermostat',   'Gateway', '2.4G', -63, 'now',     0.1),
      cli('c9',  'Echo Dot',          'Gateway', '2.4G', -69, 'now',     0.1),
      cli('c10', 'Hue Bridge',        'Gateway', '2.4G', -72, 'now',     0.0),
      cli('c11', 'HP LaserJet',       'Gateway', '2.4G', -70, '3h ago',  null),
      cli('c12', 'Roomba i7',         'Gateway', '2.4G', -74, '12h ago', null),
      cli('c13', 'Xbox Series X',     'Gateway', '5G',   -53, '3d ago',  null),
      cli('c14', 'Samsung Phone',     'Gateway', '5G',   -57, 'now',     2.8),
      cli('c15', 'Fire Stick 4K',     'Gateway', '2.4G', -66, 'now',     5.3),
    ],
  },

  // ── Evelyn Choo — 500Mbps Cable, degraded (unhealthy demo) ─────────────────
  'cust-002': {
    installDate: 'Aug 2022',
    wanExtra: {
      baseline: { down: 448, up: 46 },
      liveUsageMbps: 5.2,
      speedHistory: [
        { date: 'Jun 4',  down: 310, up: 28, latency: 18, anomaly: true  },
        { date: 'Jun 3',  down: 298, up: 31, latency: 20, anomaly: true  },
        { date: 'Jun 1',  down: 445, up: 47, latency: 8,  anomaly: false },
        { date: 'May 26', down: 312, up: 29, latency: 16, anomaly: true  },
        { date: 'May 20', down: 461, up: 48, latency: 7,  anomaly: false },
        { date: 'May 15', down: 453, up: 45, latency: 9,  anomaly: false },
      ],
      connectionEvents: [
        { online: true,  label: 'Jun 1 – Jun 4', note: 'Online continuously' },
        { online: false, label: 'May 26', note: 'Offline 4:12–4:34 PM', duration: '22 min' },
        { online: false, label: 'May 1',  note: 'Offline 11:14 AM–12:03 PM', duration: '49 min' },
      ],
    },
    activityLog: [
      { date: 'Jun 4', time: '2:23 PM',  op: 'KL', action: 'Speed Test',     outcome: 'completed', label: '310↓ / 28↑ Mbps'           },
      { date: 'Jun 3', time: '5:01 PM',  op: 'RB', action: 'Channel Scan',   outcome: 'completed', label: 'Ch 6 — 4 neighbor APs'     },
      { date: 'Jun 1', time: '11:14 AM', op: 'RB', action: 'Reboot Gateway', outcome: 'completed', label: 'Back online in 90s'        },
    ],
    ai: {
      healthScore: 58, issueCount: 2, analyzedCount: 47, status: 'issues',
      issue: {
        severity: 'high',
        symptoms: [
          'Speed 310 / 500 Mbps (62% of tier)',
          '2.4G util 74% — congested',
          'Packet loss 1.2%',
        ],
        rootCause: 'Wi-Fi channel congestion throttling speeds',
        factors: [
          { label: '2.4G channel util 74% — congested', dots: 3, pct: 42, zoneHint: '4' },
          { label: 'Packet loss 1.2%',                  dots: 3, pct: 28, zoneHint: '3' },
          { label: 'Speed 310 / 500 Mbps (62% of tier)',dots: 2, pct: 18, zoneHint: '3' },
          { label: '4 overlapping APs on Ch 6',         dots: 2, pct: 12, zoneHint: '4' },
        ],
        confidence: 79,
        action: {
          primary:   { label: 'Push Channel Change',    detail: '2.4G Ch 6 → Ch 11', priority: 'high' },
          secondary: { label: 'Monitor upstream speed', detail: '28 vs 50 Mbps expected', priority: 'low' },
        },
      },
      secondaryIssues: ['Upstream 28 / 50 Mbps expected'],
    },
    wan: {
      latencyHistory: genLatency(18, 14, 0.22, 202),
      dnsMs: 42, ipv4: true, ipv6: false,
      firmware: { current: '1.1.8-p.05', latest: '1.2.0', upToDate: false },
      optical: null,
      errors: { crc: 847, fec: 3210 },
    },
    wifi: {
      activeBand: '2.4G',
      bands: {
        '2.4G': band(74, -87, 9, [1, 3, 5], 28, 7, 6),
        '5G':   band(29, -94, 3, [2, 1, 0], 0, 0, 36),
        '6G':   null,
      },
      topology: {
        gateway: { clients: 7 },
        extenders: [{ label: 'Extender – Kitchen', signal: -71, clients: 5 }],
      },
      ssids: [
        { name: 'chief', password: 'chief_network_2024' },
        { name: 'chief IoT 2.4G', password: 'iot_chief_2024' },
      ],
      bandSteering: false,
      channelScan: {
        lastScan: '06/06/26, 04:49 AM',
        '2.4G': { neighborCount: 30 },
        '5G': { neighborCount: 3 },
        neighbors: [
          { ssid: 'DevonDown2',       bssid: 'a4:c3:f0:11:22:33', band: '2.4G', channel: 6,  rssi: -76, vendor: 'eero'    },
          { ssid: 'NETGEAR-5G-Home',  bssid: 'b0:7f:b9:22:33:44', band: '2.4G', channel: 6,  rssi: -78, vendor: 'Netgear' },
          { ssid: 'ATT-WIFI-5B3C',    bssid: 'c4:e0:32:33:44:55', band: '2.4G', channel: 6,  rssi: -82, vendor: 'Arris'   },
          { ssid: 'Linksys06241',     bssid: 'e8:de:27:44:55:66', band: '2.4G', channel: 6,  rssi: -84, vendor: 'Linksys' },
          { ssid: '',                 bssid: '00:11:22:33:44:55', band: '2.4G', channel: 6,  rssi: -86, vendor: null      },
          { ssid: 'XfinityWifi',      bssid: 'a8:4e:3f:55:66:77', band: '2.4G', channel: 11, rssi: -74, vendor: 'Cisco'   },
          { ssid: 'HOME-ABCD',        bssid: '28:80:23:66:77:88', band: '2.4G', channel: 1,  rssi: -79, vendor: 'TP-Link' },
          { ssid: 'FastNet5G',        bssid: 'cc:dd:ee:ff:00:11', band: '5G',   channel: 36, rssi: -72, vendor: 'Asus'    },
          { ssid: 'TP-Link_5G_Home',  bssid: '50:c7:bf:11:22:33', band: '5G',   channel: 44, rssi: -80, vendor: 'TP-Link' },
          { ssid: 'StrongSignal5G',   bssid: 'fc:34:97:22:bb:cc', band: '5G',   channel: 36, rssi: -77, vendor: 'Eero'    },
        ],
      },
    },
    tickets: [
      {
        id: 'TKT-10847',
        status: 'open',
        priority: 'high',
        title: 'Customer reporting slow internet — second call this week',
        created: 'Jun 2, 2:23 PM',
        assignee: 'Tier 1 Support',
        note: 'Customer called twice about speed. Running 310Mbps on a 500Mbps plan. Streaming buffers at peak hours.',
      },
    ],
    serviceLog: [
      { type: 'alert',    title: 'AI detected speed degradation',      detail: 'Speed dropped below 80% of tier threshold', timeAgo: '2h ago',  icon: 'alert' },
      { type: 'ticket',   title: 'Ticket TKT-10847 opened',            detail: 'Customer called about slow speeds',         timeAgo: '2h ago',  icon: 'ticket' },
      { type: 'reboot',   title: 'Gateway rebooted by customer',       detail: 'User power cycle — no change to issue',     timeAgo: '3d ago',  icon: 'reboot' },
      { type: 'speedtest',title: 'Speed test: 310 / 28 Mbps',          detail: 'Tier: 500 / 50 Mbps — 62% of tier',        timeAgo: '3d ago',  icon: 'zap' },
      { type: 'ticket',   title: 'Ticket TKT-10844 resolved',          detail: 'Previous slow-speed complaint — reboot fix', timeAgo: '5d ago', icon: 'ticket' },
    ],
    actions: [
      { id: 'a1', priority: 'high', title: 'Change Wi-Fi to Channel 1 or 11', detail: 'Ch 6: 4 competing APs nearby → Ch 1 or 11 is clear', cta: 'Apply Channel Change', completed: false },
      { id: 'a2', priority: 'high', title: 'Move devices to 5G band', detail: '6/9 devices are 5G-capable · frees up 2.4G for the rest', cta: 'Run Band Steering', completed: false },
      { id: 'a3', priority: 'med',  title: 'Schedule firmware update', detail: 'v1.1.8 → v1.2.0 · DOCSIS stability + Wi-Fi scheduler fix', cta: 'Schedule Update', completed: false },
    ],
    devices: [
      gw('gw2', 'WF-720GF', { current: '1.1.8-p.05', latest: '1.2.0', upToDate: false }, '3d 11h', null, 7),
      ext('e1', 'Kitchen', 'WF-710GF', 'online', -71, 5, 'wireless-2.4g'),
      cli('c1',  'MacBook Air',       'Gateway',     '2.4G', -55, 'now',     3.2),
      cli('c2',  'iPhone 14',         'Gateway',     '2.4G', -61, 'now',     0.8),
      cli('c3',  'Samsung TV',        'Gateway',     '2.4G', -68, 'now',     6.4),
      cli('c4',  'Ring Doorbell',     'Gateway',     '2.4G', -71, 'now',     0.2),
      cli('c5',  'Nest Cam',          'Gateway',     '2.4G', -73, 'now',     1.1),
      cli('c6',  'Echo Show',         'Gateway',     '2.4G', -67, 'now',     0.3),
      cli('c7',  'Roomba j7',         'Gateway',     '2.4G', -78, '2h ago',  null),
      cli('c8',  'Samsung Galaxy',    'Kitchen', '2.4G', -59, 'now',     1.4),
      cli('c9',  'iPad Pro',          'Kitchen', '2.4G', -62, '10m ago', 4.8),
      cli('c10', 'Smart Plug 1',      'Kitchen', '2.4G', -75, 'now',     0.0),
      cli('c11', 'Smart Plug 2',      'Kitchen', '2.4G', -77, 'now',     0.0),
      cli('c12', 'Smart Plug 3',      'Kitchen', '2.4G', -79, 'now',     0.0),
    ],
  },

  // ── Priya Nair — 500Mbps Fiber, degraded, watchdog crashes ──────────────────
  'cust-007': {
    installDate: 'Nov 2023',
    wanExtra: {
      baseline: { down: 472, up: 485 },
      liveUsageMbps: 8.1,
      speedHistory: [
        { date: 'Jun 4',  down: 280, up: 490, latency: 24, anomaly: true  },
        { date: 'Jun 3',  down: 261, up: 488, latency: 28, anomaly: true  },
        { date: 'Jun 1',  down: 468, up: 479, latency: 5,  anomaly: false },
        { date: 'May 30', down: 475, up: 481, latency: 4,  anomaly: false },
        { date: 'May 28', down: 471, up: 477, latency: 5,  anomaly: false },
        { date: 'May 25', down: 469, up: 483, latency: 4,  anomaly: false },
      ],
      connectionEvents: [
        { online: false, label: 'Jun 4',  note: 'Watchdog reboot #3 — 4:12 AM', duration: '4 min' },
        { online: false, label: 'Jun 3',  note: 'Watchdog reboot #2 — 10:38 PM', duration: '3 min' },
        { online: false, label: 'Jun 2',  note: 'Watchdog reboot #1 — 2:15 PM', duration: '5 min' },
        { online: true,  label: 'May 28 – Jun 1', note: 'Online continuously' },
      ],
    },
    activityLog: [
      { date: 'Jun 4', time: '8:55 AM',  op: 'TK', action: 'Speed Test',     outcome: 'completed',   label: '280↓ / 490↑ Mbps'          },
      { date: 'Jun 3', time: '4:12 PM',  op: 'TK', action: 'Firmware Push',  outcome: 'interrupted', label: 'Interrupted — call dropped' },
      { date: 'Jun 1', time: '9:00 AM',  op: 'JD', action: 'Reboot Gateway', outcome: 'completed',   label: 'Back online in 2m'         },
    ],
    ai: {
      healthScore: 52, issueCount: 3, analyzedCount: 47, status: 'issues',
      issue: {
        severity: 'high',
        symptoms: [
          'Gateway rebooted 3× in 48 hours',
          'Speed 280 / 500 Mbps (56% of tier)',
          'Wi-Fi retry rate 45 (9× above baseline)',
        ],
        rootCause: 'Gateway firmware memory leak causing crashes',
        factors: [
          { label: '3 gateway reboots in 48h',          dots: 3, pct: 38, zoneHint: '3' },
          { label: 'Firmware v1.1.2 — known memory leak',dots: 3, pct: 30, zoneHint: '3' },
          { label: 'Wi-Fi retry rate 45 (9× baseline)', dots: 2, pct: 20, zoneHint: '4' },
          { label: 'Speed 280 / 500 Mbps (56% of tier)',dots: 2, pct: 12, zoneHint: '3' },
        ],
        confidence: 88,
        action: {
          primary:   { label: 'Update Firmware',             detail: 'v1.1.2 → v1.2.1 (patches memory leak)', priority: 'high' },
          secondary: { label: 'Schedule reboot post-update', detail: 'Clears crash state after flash',         priority: 'med'  },
        },
      },
      secondaryIssues: ['Latency spikes >120ms during reboot windows'],
    },
    wan: {
      latencyHistory: genLatency(24, 40, 0.35, 707),
      dnsMs: 88, ipv4: true, ipv6: true,
      firmware: { current: '1.1.2', latest: '1.2.1', upToDate: false },
      optical: { rxDbm: -22.1, txDbm: 1.8 },
      errors: { crc: 3, fec: 8842 },
    },
    wifi: {
      activeBand: '5G',
      bands: {
        '2.4G': band(41, -90, 5, [1, 2, 2], 0, 2, 1),
        '5G':   band(52, -89, 7, [2, 3, 2], 0, 4, 149),
        '6G':   null,
      },
      topology: { gateway: { clients: 12 }, extenders: [] },
      ssids: [{ name: 'PriyaHome', password: 'priya_home_wifi_9' }],
      bandSteering: true,
      channelScan: {
        lastScan: '06/04/26, 8:50 AM',
        '2.4G': { neighborCount: 4 },
        '5G': { neighborCount: 5 },
        neighbors: [],
      },
    },
    tickets: [
      {
        id: 'TKT-10892',
        status: 'open',
        priority: 'high',
        title: 'Customer reports internet dropping multiple times per day',
        created: 'Jun 3, 9:11 AM',
        assignee: 'Tier 2 Support',
        note: 'Customer frustrated — third call. Internet goes out for ~5 minutes then comes back. Happens randomly. No pattern to time of day.',
      },
      {
        id: 'TKT-10878',
        status: 'in-progress',
        priority: 'med',
        title: 'Slow speeds during evening hours',
        created: 'Jun 1, 7:44 PM',
        assignee: 'Tier 1 Support',
        note: 'Previous ticket — originally thought congestion, now escalated after repeated reboots detected.',
      },
    ],
    serviceLog: [
      { type: 'alert',    title: 'Watchdog reboot #3 detected',        detail: 'Gateway rebooted automatically — firmware crash', timeAgo: '4h ago',  icon: 'alert' },
      { type: 'alert',    title: 'Watchdog reboot #2 detected',        detail: 'Second crash in 48h — escalation triggered',      timeAgo: '18h ago', icon: 'alert' },
      { type: 'reboot',   title: 'Watchdog reboot #1',                 detail: 'First automated crash',                           timeAgo: '2d ago',  icon: 'reboot' },
      { type: 'ticket',   title: 'Ticket TKT-10892 opened',            detail: 'Customer third call — intermittent drops',        timeAgo: '1d ago',  icon: 'ticket' },
      { type: 'speedtest',title: 'Speed test: 280 / 490 Mbps',         detail: 'Down is throttled; up normal — confirms issue',   timeAgo: '2d ago',  icon: 'zap' },
    ],
    actions: [
      { id: 'a1', priority: 'high', title: 'Update firmware now — fix is available', detail: 'v1.1.2 has documented memory leak → v1.2.1 patches the crash', cta: 'Schedule Firmware Update', completed: false },
      { id: 'a2', priority: 'high', title: 'Schedule reboot after firmware update', detail: 'Clean reboot post-flash clears the memory leak state', cta: 'Schedule Reboot', completed: false },
      { id: 'a3', priority: 'med',  title: 'Follow up with customer in 24h', detail: 'Confirm reboots stopped after update · 3 prior calls', cta: 'Set 24h Follow-up', completed: false },
    ],
    devices: [
      gw('gw7', 'WF-720GF', { current: '1.1.2', latest: '1.2.1', upToDate: false }, '1d 2h', -22.1, 12),
      cli('c1',  'MacBook M2',        'Gateway', '5G',   -48, 'now',     11.2),
      cli('c2',  'iPhone 14 Pro',     'Gateway', '5G',   -52, '1m ago',   0.9),
      cli('c3',  'iPad',              'Gateway', '5G',   -61, '5m ago',   0.3),
      cli('c4',  'Smart TV',          'Gateway', '5G',   -67, 'now',      7.8),
      cli('c5',  'Nintendo Switch',   'Gateway', '5G',   -59, '2h ago',   null),
      cli('c6',  'Echo Dot',          'Gateway', '2.4G', -65, 'now',      0.1),
      cli('c7',  'Ring Doorbell',     'Gateway', '2.4G', -70, 'now',      0.2),
      cli('c8',  'Nest Thermostat',   'Gateway', '2.4G', -68, 'now',      0.1),
      cli('c9',  'Pixel Phone',       'Gateway', '5G',   -55, 'now',      2.1),
      cli('c10', 'Sonos Speaker',     'Gateway', '2.4G', -73, 'now',      0.4),
      cli('c11', 'HP Laptop',         'Gateway', '5G',   -63, '30m ago',  5.6),
      cli('c12', 'Surface Pro',       'Gateway', '5G',   -71, '1h ago',   null),
    ],
  },

  // ── Daniel Okafor — suspended non-payment, offline ──────────────────────────
  'cust-008': {
    installDate: 'May 2020',
    activityLog: [
      { date: 'Jun 2', time: '10:02 AM', op: 'KL',  action: 'Service Suspended', outcome: 'system',      label: 'Non-payment — $84.50'      },
      { date: 'Jun 2', time: '9:45 AM',  op: 'KL',  action: 'Speed Test',        outcome: 'failed',      label: 'Failed — device offline'   },
      { date: 'May 12', time: '3:20 PM', op: 'AB',  action: 'Session closed',    outcome: 'info',        label: 'Advised on payment'        },
    ],
    ai: {
      healthScore: 0, issueCount: 1, analyzedCount: 12, status: 'suspended',
      issue: null, secondaryIssues: [],
    },
    wan: {
      latencyHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${String(i).padStart(2, '0')}:00`, ms: 0 })),
      dnsMs: null, ipv4: false, ipv6: false,
      firmware: { current: '1.0.9', latest: '1.2.1', upToDate: false },
      optical: null, errors: { crc: null, fec: null },
    },
    wifi: {
      activeBand: null,
      bands: { '2.4G': null, '5G': null, '6G': null },
      topology: { gateway: { clients: 0 }, extenders: [] },
    },
    tickets: [
      {
        id: 'TKT-10801',
        status: 'open',
        priority: 'high',
        title: 'Account suspended — overdue balance',
        created: 'Jun 1, 10:00 AM',
        assignee: 'Billing',
        note: 'Account suspended per non-payment policy. Balance of $84.50 overdue 32 days. Customer has not responded to 3 outreach attempts.',
      },
    ],
    serviceLog: [
      { type: 'alert',  title: 'Service suspended — non-payment',   detail: 'Account balance $84.50 overdue 32 days', timeAgo: '2d ago', icon: 'alert' },
      { type: 'ticket', title: 'Ticket TKT-10801 opened',           detail: 'Billing escalation triggered',          timeAgo: '2d ago', icon: 'ticket' },
      { type: 'reboot', title: 'Gateway went offline',              detail: 'Service terminated by billing system',  timeAgo: '2d ago', icon: 'reboot' },
    ],
    actions: [
      { id: 'a1', priority: 'high', title: 'Contact customer — account suspended', detail: '$84.50 overdue 32 days · billing attempted 3× · no response', cta: 'Open Billing', completed: false },
    ],
    devices: [
      gw('gw8', 'WF-1000v3', { current: '1.0.9', latest: '1.2.1', upToDate: false }, null, null, 0),
    ],
  },

  // ── Nina Patel — 1Gbps Fiber, pending install ────────────────────────────────
  'cust-005': {
    installDate: null,
    activityLog: [
      { date: 'Jun 3', time: '10:16 AM', op: 'SYS', action: 'Install scheduled',  outcome: 'info',   label: 'Jun 10, 9am–12pm'          },
      { date: 'Jun 3', time: '10:15 AM', op: 'AB',  action: 'Order created',       outcome: 'system', label: '1 Gbps Fiber — Palo Alto'   },
    ],
    ai: { healthScore: 0, issueCount: 0, analyzedCount: 0, status: 'pending', issue: null, secondaryIssues: [] },
    wan: {
      latencyHistory: [], dnsMs: null, ipv4: false, ipv6: false,
      firmware: null, optical: null, errors: { crc: null, fec: null },
    },
    wifi: { activeBand: null, bands: { '2.4G': null, '5G': null, '6G': null }, topology: { gateway: { clients: 0 }, extenders: [] } },
    tickets: [], serviceLog: [], actions: [], devices: [],
  },

  // ── Rachel Torres — 300Mbps Cable, critical ──────────────────────────────────
  'cust-011': {
    installDate: 'Feb 2024',
    wanExtra: {
      baseline: { down: 278, up: 28 },
      liveUsageMbps: 3.8,
      speedHistory: [
        { date: 'Jun 4',  down: 180, up: 12, latency: 32, anomaly: true  },
        { date: 'Jun 3',  down: 192, up: 14, latency: 28, anomaly: true  },
        { date: 'Jun 1',  down: 275, up: 27, latency: 11, anomaly: false },
        { date: 'May 29', down: 168, up: 10, latency: 38, anomaly: true  },
        { date: 'May 22', down: 281, up: 29, latency: 9,  anomaly: false },
        { date: 'May 15', down: 273, up: 26, latency: 12, anomaly: false },
      ],
      connectionEvents: [
        { online: false, label: 'Jun 4', note: 'Gateway rebooted — user power cycle', duration: '42 min' },
        { online: true,  label: 'Jun 1 – Jun 3', note: 'Online continuously' },
        { online: false, label: 'May 29', note: 'Offline 7:44–8:11 PM', duration: '27 min' },
      ],
    },
    activityLog: [
      { date: 'Jun 4', time: '4:12 PM', op: 'SH', action: 'Reboot Gateway',  outcome: 'interrupted', label: 'Interrupted — call dropped' },
      { date: 'Jun 4', time: '3:47 PM', op: 'SH', action: 'Speed Test',       outcome: 'completed',   label: '180↓ / 12↑ Mbps'           },
      { date: 'Jun 3', time: '2:15 PM', op: 'JD', action: 'Channel Scan',     outcome: 'completed',   label: 'Ch 1 — 30+ APs'            },
      { date: 'Jun 3', time: '9:03 AM', op: 'JD', action: 'Session closed',   outcome: 'info',        label: 'No action taken'            },
      { date: 'Jun 1', time: '4:30 PM', op: 'AB', action: 'Firmware Push',    outcome: 'completed',   label: 'v1.2.0-p.30'               },
    ],
    ai: {
      healthScore: 48, issueCount: 3, analyzedCount: 47, status: 'critical',
      issue: {
        severity: 'high',
        symptoms: [
          'Packet loss is 3.5% — 7× above the acceptable threshold',
          'Download speed is only 60% of what this customer pays for',
          'Gateway rebooted 42 minutes ago — may still be stabilizing',
          '8 of 11 Wi-Fi clients have weak signal (below −75 dBm)',
        ],
        rootCause: 'Dense neighborhood interference + client placement problem',
        narrative: 'Channel 11 (2.4G) is being contested by 8+ neighbor APs in a dense building. Many clients are also far from the gateway. Together, these create a "hidden node" problem where devices can\'t hear each other and retransmit constantly, causing the packet loss the customer experiences as lag and buffering.',
        factors: [
          { label: 'Channel util: 79%',    dots: 3, zoneHint: '4' },
          { label: 'Packet loss: 3.5%',    dots: 3, zoneHint: '3' },
          { label: 'Interference: 11 ev/h',dots: 3, zoneHint: '4' },
          { label: '8 weak-signal clients', dots: 2, zoneHint: '4' },
        ],
        confidence: 85,
        weights: [
          { label: 'Channel utilization', pct: 35 },
          { label: 'Packet loss',         pct: 30 },
          { label: 'Interference events', pct: 22 },
          { label: 'RSSI distribution',   pct: 13 },
        ],
      },
      secondaryIssues: ['Upstream only 12 Mbps (expected 30+ Mbps)', 'Recent reboot — gateway may be unstable'],
    },
    wan: {
      latencyHistory: genLatency(32, 28, 0.30, 1011),
      dnsMs: 156, ipv4: true, ipv6: false,
      firmware: { current: '1.1.8-p.05', latest: '1.2.0', upToDate: false },
      optical: null,
      errors: { crc: 2841, fec: 9044 },
    },
    wifi: {
      activeBand: '2.4G',
      bands: {
        '2.4G': band(79, -85, 11, [0, 3, 8], 15, 11, 11),
        '5G':   band(18, -96, 2, [1, 1, 0], 0, 0, 36),
        '6G':   null,
      },
      topology: {
        gateway: { clients: 8 },
        extenders: [{ label: 'Extender – Bedroom', signal: -79, clients: 5 }],
      },
      ssids: [
        { name: 'TorresNet', password: 'torres2024home' },
        { name: 'TorresNet-IoT', password: 'iot_torres_2024' },
      ],
      bandSteering: true,
      channelScan: {
        lastScan: '06/03/26, 2:15 PM',
        '2.4G': { neighborCount: 35 },
        '5G': { neighborCount: 2 },
        neighbors: [
          { ssid: 'BuildingWifi1',   bssid: 'aa:bb:cc:11:22:33', band: '2.4G', channel: 11, rssi: -72, vendor: 'Arris'   },
          { ssid: 'BuildingWifi2',   bssid: 'aa:bb:cc:11:22:44', band: '2.4G', channel: 11, rssi: -74, vendor: 'Arris'   },
          { ssid: 'Unit4B-Home',     bssid: 'cc:dd:ee:22:33:44', band: '2.4G', channel: 11, rssi: -76, vendor: 'TP-Link' },
          { ssid: 'RachelsGuest',    bssid: 'dd:ee:ff:33:44:55', band: '2.4G', channel: 11, rssi: -78, vendor: null      },
          { ssid: 'Spectrum_2G_B12', bssid: 'ec:f4:bb:44:55:66', band: '2.4G', channel: 1,  rssi: -80, vendor: 'Ubee'   },
          { ssid: '5G-FastConnect',  bssid: '60:38:e0:55:66:77', band: '5G',   channel: 36, rssi: -75, vendor: 'Eero'   },
          { ssid: 'Unit4B-5G',       bssid: 'a0:d3:c1:66:77:88', band: '5G',  channel: 36, rssi: -82, vendor: 'TP-Link' },
        ],
      },
    },
    tickets: [
      {
        id: 'TKT-10891',
        status: 'open',
        priority: 'high',
        title: 'Smart home devices keep dropping off network',
        created: 'Jun 3, 8:15 AM',
        assignee: 'Unassigned',
        note: 'IoT devices (Nest, Ring, smart lights) dropping every few hours. Customer works from home — Zoom calls also degraded.',
      },
      {
        id: 'TKT-10885',
        status: 'in-progress',
        priority: 'med',
        title: 'Slow speeds — second complaint this week',
        created: 'Jun 2, 4:40 PM',
        assignee: 'Tier 2 Support',
        note: 'Second call about speeds this week. Customer getting 180Mbps on 300Mbps plan. Escalated for investigation.',
      },
    ],
    serviceLog: [
      { type: 'alert',    title: 'Critical: packet loss 3.5% detected', detail: 'AI escalated — above critical threshold',  timeAgo: '1h ago',  icon: 'alert' },
      { type: 'ticket',   title: 'Ticket TKT-10891 opened',             detail: 'IoT devices dropping — customer called',   timeAgo: '3h ago',  icon: 'ticket' },
      { type: 'reboot',   title: 'Gateway rebooted',                    detail: 'Reason: User power cycle — 42min ago',     timeAgo: '42m ago', icon: 'reboot' },
      { type: 'speedtest',title: 'Speed test: 180 / 12 Mbps',          detail: 'Tier: 300 / 30 Mbps — 60% of tier',       timeAgo: '1d ago',  icon: 'zap' },
      { type: 'ticket',   title: 'Ticket TKT-10885 escalated',          detail: 'Tier 1 → Tier 2 — speed complaint',       timeAgo: '1d ago',  icon: 'ticket' },
    ],
    actions: [
      { id: 'a1', priority: 'high', title: 'Switch 2.4G to Channel 1', detail: 'Ch 11: highest AP density → Ch 1 is 40% less contested', cta: 'Apply Channel Change', completed: false },
      { id: 'a2', priority: 'high', title: 'Add an extender near the weak clients', detail: '8/11 clients below −75 dBm · placement issue, not channel', cta: 'Recommend Extender', completed: false },
      { id: 'a3', priority: 'med',  title: 'Schedule firmware update', detail: 'v1.1.8 → v1.2.0 · DOCSIS packet scheduler fix', cta: 'Schedule Update', completed: false },
    ],
    devices: [
      gw('gw11', 'WF-1000v3', { current: '1.1.8-p.05', latest: '1.2.0', upToDate: false }, '0d 0h 42m', null, 8),
      ext('e11', 'Bedroom', 'WF-710GF', 'degraded', -79, 5, 'wireless-2.4g', '0d 0h 42m'),
      cli('c1',  'MacBook Air',        'Gateway',     '2.4G', -68, 'now',     2.1),
      cli('c2',  'iPhone 15',          'Gateway',     '2.4G', -72, 'now',     0.5),
      cli('c3',  'Nest Cam Indoor',    'Gateway',     '2.4G', -74, 'now',     1.3),
      cli('c4',  'Ring Doorbell Pro',  'Gateway',     '2.4G', -76, 'now',     0.3),
      cli('c5',  'Echo 4th Gen',       'Gateway',     '2.4G', -77, 'now',     0.1),
      cli('c6',  'Smart Light Hub',    'Gateway',     '2.4G', -80, 'now',     0.0),
      cli('c7',  'Thermostat',         'Gateway',     '2.4G', -81, 'now',     0.1),
      cli('c8',  'Smart Plug',         'Gateway',     '2.4G', -79, 'now',     0.0),
      cli('c9',  'iPad',               'Bedroom', '2.4G', -73, '5m ago',  0.6),
      cli('c10', 'Samsung TV',         'Bedroom', '2.4G', -78, 'now',     4.9),
      cli('c11', 'PS5',                'Bedroom', '2.4G', -82, 'now',     3.2),
      cli('c12', 'Google Pixel',       'Bedroom', '2.4G', -80, '10m ago', 0.4),
      cli('c13', 'Fire Stick',         'Bedroom', '2.4G', -84, 'now',     5.8),
    ],
  },

  // ── Linda Park — suspended voluntary, offline ────────────────────────────────
  'cust-013': {
    installDate: 'Sep 2019',
    activityLog: [
      { date: 'May 29', time: '11:00 AM', op: 'RB', action: 'Service Suspended', outcome: 'system', label: 'Voluntary — customer request' },
      { date: 'May 28', time: '2:45 PM',  op: 'RB', action: 'Session closed',    outcome: 'info',   label: 'Cancellation processed'      },
    ],
    ai: {
      healthScore: 0, issueCount: 0, analyzedCount: 0, status: 'suspended',
      issue: null, secondaryIssues: [],
    },
    wan: {
      latencyHistory: Array.from({ length: 24 }, (_, i) => ({ time: `${String(i).padStart(2, '0')}:00`, ms: 0 })),
      dnsMs: null, ipv4: false, ipv6: false,
      firmware: { current: '1.0.4', latest: '1.2.1', upToDate: false },
      optical: null, errors: { crc: null, fec: null },
    },
    wifi: {
      activeBand: null,
      bands: { '2.4G': null, '5G': null, '6G': null },
      topology: { gateway: { clients: 0 }, extenders: [] },
    },
    tickets: [
      {
        id: 'TKT-10611',
        status: 'open',
        priority: 'med',
        title: 'Service disconnected — win-back opportunity',
        created: 'May 29, 11:00 AM',
        assignee: 'Retention Team',
        note: 'Customer requested disconnection. Has been with us since Sep 2019. Marked for win-back outreach.',
      },
    ],
    serviceLog: [
      { type: 'alert',  title: 'Service disconnected',            detail: 'Customer request — voluntary',       timeAgo: '5d ago', icon: 'alert' },
      { type: 'ticket', title: 'Ticket TKT-10611 opened',        detail: 'Win-back program — retention',       timeAgo: '5d ago', icon: 'ticket' },
    ],
    actions: [
      { id: 'a1', priority: 'high', title: 'Reach out for win-back', detail: 'Disconnected after 7 years · retention outreach pending', cta: 'Send Outreach', completed: false },
    ],
    devices: [
      gw('gw13', 'WF-720GF', { current: '1.0.4', latest: '1.2.1', upToDate: false }, null, null, 0),
    ],
  },

  // ── James Whitfield — 300Mbps FWA, degraded ─────────────────────────────────
  'cust-016': {
    installDate: 'Jun 2023',
    wanExtra: {
      baseline: { down: 284, up: 288 },
      liveUsageMbps: 4.2,
      speedHistory: [
        { date: 'Jun 4',  down: 120, up: 35,  latency: 42, anomaly: true  },
        { date: 'Jun 3',  down: 134, up: 38,  latency: 39, anomaly: true  },
        { date: 'Jun 1',  down: 281, up: 284, latency: 8,  anomaly: false },
        { date: 'May 30', down: 288, up: 291, latency: 7,  anomaly: false },
        { date: 'May 28', down: 142, up: 44,  latency: 41, anomaly: true  },
        { date: 'May 22', down: 276, up: 282, latency: 9,  anomaly: false },
      ],
      connectionEvents: [
        { online: false, label: 'Jun 2', note: 'Watchdog reboot — automatic recovery', duration: '3 min' },
        { online: true,  label: 'May 30 – Jun 1', note: 'Online continuously' },
        { online: false, label: 'May 28', note: 'Signal loss — 8:22–8:55 PM', duration: '33 min' },
      ],
    },
    activityLog: [
      { date: 'Jun 4', time: '8:10 AM', op: 'RB', action: 'Speed Test',     outcome: 'completed', label: '120↓ / 35↑ Mbps'           },
      { date: 'Jun 3', time: '3:55 PM', op: 'RB', action: 'Session closed', outcome: 'info',      label: 'Monitoring — no action'    },
      { date: 'Jun 2', time: '11:08 AM', op: 'KL', action: 'Reboot Gateway', outcome: 'completed', label: 'Back online in 3m'        },
    ],
    ai: {
      healthScore: 64, issueCount: 2, analyzedCount: 47, status: 'issues',
      issue: {
        severity: 'med',
        symptoms: [
          'Download speed is 40% of provisioned tier (120 of 300 Mbps)',
          'Latency at 42ms — above the 30ms warning threshold',
          'Gateway crashed once in the past 24 hours',
        ],
        rootCause: 'FWA signal is borderline — possible obstruction or antenna drift',
        narrative: 'The speed and latency profile is consistent with partial FWA signal blockage or slight CPE antenna misalignment. A physical inspection or automated beam-steering adjustment may restore full throughput.',
        factors: [
          { label: 'Speed: 40% of tier', dots: 3, zoneHint: '3' },
          { label: 'Latency: 42ms',      dots: 2, zoneHint: '3' },
          { label: 'RSSI: −66 dBm',      dots: 2, zoneHint: '4' },
          { label: 'Recent crash',        dots: 1, zoneHint: '3' },
        ],
        confidence: 71,
        weights: [
          { label: 'Speed delta',      pct: 38 },
          { label: 'Latency pattern',  pct: 27 },
          { label: 'RSSI level',       pct: 22 },
          { label: 'Crash history',    pct: 13 },
        ],
      },
      secondaryIssues: ['Firmware 2 versions behind latest — beam steering improvements in v1.2.1'],
    },
    wan: {
      latencyHistory: genLatency(42, 22, 0.20, 1606),
      dnsMs: 72, ipv4: true, ipv6: true,
      firmware: { current: '1.1.5', latest: '1.2.1', upToDate: false },
      optical: null,
      errors: { crc: 128, fec: 1440 },
    },
    wifi: {
      activeBand: '5G',
      bands: {
        '2.4G': band(44, -90, 3, [0, 2, 1], 0, 1, 6),
        '5G':   band(47, -91, 6, [0, 3, 3], 0, 4, 36),
        '6G':   null,
      },
      topology: { gateway: { clients: 9 }, extenders: [] },
      ssids: [{ name: 'WhitfieldFWA', password: 'whitfield_home_77' }],
      bandSteering: true,
      channelScan: {
        lastScan: '06/04/26, 8:15 AM',
        '2.4G': { neighborCount: 6 },
        '5G': { neighborCount: 4 },
        neighbors: [],
      },
    },
    tickets: [],
    serviceLog: [
      { type: 'alert',    title: 'Speed degradation detected',     detail: 'FWA throughput below 50% of tier',          timeAgo: '6h ago',  icon: 'alert' },
      { type: 'reboot',   title: 'Watchdog reboot',               detail: 'Gateway crashed — automatic recovery',       timeAgo: '12h ago', icon: 'reboot' },
      { type: 'speedtest',title: 'Speed test: 120 / 35 Mbps',    detail: 'Tier: 300 / 300 Mbps — 40% of tier',        timeAgo: '1d ago',  icon: 'zap' },
    ],
    actions: [
      { id: 'a1', priority: 'high', title: 'Schedule a CPE site inspection', detail: 'FWA borderline signal · likely obstruction or antenna drift', cta: 'Schedule Site Visit', completed: false },
      { id: 'a2', priority: 'med',  title: 'Update firmware before the visit', detail: 'v1.2.1 adds FWA beam steering improvements', cta: 'Schedule Firmware Update', completed: false },
    ],
    devices: [
      gw('gw16', 'WF-720GF', { current: '1.1.5', latest: '1.2.1', upToDate: false }, '2d 8h', null, 9),
      cli('c1',  'MacBook Pro',       'Gateway', '5G',   -61, 'now',     4.4),
      cli('c2',  'iPhone 13',         'Gateway', '5G',   -66, '5m ago',  0.7),
      cli('c3',  'iPad',              'Gateway', '2.4G', -70, '20m ago', 0.2),
      cli('c4',  'Samsung TV',        'Gateway', '2.4G', -73, 'now',     3.8),
      cli('c5',  'Echo Dot',          'Gateway', '2.4G', -75, 'now',     0.1),
      cli('c6',  'Ring Doorbell',     'Gateway', '2.4G', -76, 'now',     0.2),
      cli('c7',  'Smart Plug',        'Gateway', '2.4G', -78, 'now',     0.0),
      cli('c8',  'Nintendo Switch',   'Gateway', '5G',   -68, '1h ago',  null),
      cli('c9',  'Laptop',            'Gateway', '5G',   -63, '30m ago', 2.9),
    ],
  },
}

// ── Activity log generator (separate seed — does not affect other generated values) ──
const LOG_OPS   = ['SH', 'JD', 'KL', 'AB', 'RB', 'TK']
const LOG_DATES = ['Jun 4', 'Jun 3', 'Jun 2', 'Jun 1', 'May 30', 'May 28']
const LOG_TIMES = ['8:22 AM', '9:15 AM', '10:42 AM', '11:30 AM', '2:05 PM', '3:18 PM', '4:47 PM']

function generateActivityLog(customer, seed) {
  const r    = mulberry32(seed * 137 + 42)
  const pick = (arr) => arr[Math.floor(r() * arr.length)]

  const op1    = pick(LOG_OPS)
  const op2    = pick(LOG_OPS)
  const date1  = LOG_DATES[Math.floor(r() * 2)]        // today or yesterday
  const date2  = LOG_DATES[2 + Math.floor(r() * 3)]    // 2–4 days ago
  const time1  = pick(LOG_TIMES)
  const time2  = pick(LOG_TIMES)
  const down   = customer.wan?.speedDown ?? '—'
  const up     = customer.wan?.speedUp   ?? '—'

  if (customer.status === 'offline') {
    return [
      { date: date1, time: time1, op: op1, action: 'Poll Now',        outcome: 'failed', label: 'Failed — device offline'   },
      { date: date2, time: time2, op: op2, action: 'Session closed',  outcome: 'info',   label: 'No action taken'            },
    ]
  }
  if (customer.status === 'degraded') {
    return [
      { date: date1, time: time1, op: op1, action: 'Speed Test',      outcome: 'completed', label: `${down}↓ / ${up}↑ Mbps`      },
      { date: date2, time: time2, op: op2, action: 'Session closed',  outcome: 'info',      label: 'Monitoring — no action'      },
    ]
  }
  // online / unknown
  return [
    { date: date1, time: time1, op: op1, action: 'Speed Test',        outcome: 'completed', label: `${down}↓ / ${up}↑ Mbps`      },
    { date: date2, time: time2, op: op2, action: 'Session closed',    outcome: 'info',      label: 'No action taken'              },
  ]
}

// ── Default generator ────────────────────────────────────────────────────────
function generateDefaultDetail(customer) {
  const isOnline   = customer.status === 'online'
  const isDegraded = customer.status === 'degraded'
  const isOffline  = customer.status === 'offline'
  const seed       = parseInt(customer.id.replace(/\D/g, ''), 10) || 999
  const rand       = mulberry32(seed)

  const healthScore = isOnline ? Math.round(82 + rand() * 13)
    : isDegraded ? Math.round(50 + rand() * 20)
    : isOffline  ? Math.round(rand() * 20) : 50

  const isFiber = customer.wan?.type === 'fiber'
  const latBase = customer.wan?.latency ?? 20
  const primaryBandKey = customer.wifi?.band?.includes('6') ? '6G' : customer.wifi?.band?.includes('5') ? '5G' : '2.4G'
  const clientCount = isOnline ? Math.round(8 + rand() * 10) : 0

  const makeBand = (util, noise, clients, key) => {
    const g = Math.round(clients * (key !== '2.4G' ? 0.6 : 0.2))
    const f = Math.round(clients * 0.3)
    return band(util, noise, clients, [g, f, Math.max(0, clients - g - f)], 0, isDegraded ? 3 : 0, key === '5G' ? 36 : key === '6G' ? 37 : 6)
  }

  return {
    installDate: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Math.floor(rand() * 12)]} ${2019 + Math.floor(rand() * 5)}`,
    activityLog: generateActivityLog(customer, seed),
    ai: {
      healthScore,
      issueCount: isOnline ? 0 : isDegraded ? Math.round(1 + rand() * 2) : 1,
      analyzedCount: 47,
      status: isOnline ? 'healthy' : isDegraded ? 'issues' : 'offline',
      issue: isOnline ? null : isDegraded ? {
        severity: 'med',
        symptoms: ['Speed below provisioned tier', 'Elevated retry count on Wi-Fi'],
        rootCause: 'Network degradation detected',
        narrative: 'Performance metrics are below expected thresholds. Further investigation is recommended.',
        factors: [
          { label: 'Speed delta', dots: 2, zoneHint: '3' },
          { label: 'Retry count', dots: 2, zoneHint: '4' },
        ],
        confidence: Math.round(60 + rand() * 20),
        weights: [{ label: 'Speed delta', pct: 50 }, { label: 'Retry rate', pct: 30 }, { label: 'Latency', pct: 20 }],
      } : null,
      secondaryIssues: [],
    },
    wan: {
      latencyHistory: isOffline
        ? Array.from({ length: 24 }, (_, i) => ({ time: `${String(i).padStart(2,'0')}:00`, ms: 0 }))
        : genLatency(latBase, latBase * (isDegraded ? 1.5 : 0.5), isDegraded ? 0.2 : 0.05, seed),
      dnsMs: isOnline ? Math.round(10 + rand() * 30) : null,
      ipv4: isOnline || isDegraded,
      ipv6: isFiber && (isOnline || isDegraded),
      firmware: { current: '1.2.1-p.42', latest: '1.2.1-p.42', upToDate: true },
      optical: isFiber ? { rxDbm: -(16 + rand() * 6), txDbm: 1.5 + rand() * 1.5 } : null,
      errors: { crc: isOnline ? 0 : Math.round(rand() * 200), fec: Math.round(rand() * 500) },
      baseline: (isOnline || isDegraded) && customer.wan?.speedDown ? {
        down: Math.round(customer.wan.speedDown * (0.90 + rand() * 0.12)),
        up:   Math.round((customer.wan.speedUp ?? 0) * (0.88 + rand() * 0.15)),
      } : null,
      liveUsageMbps: (isOnline || isDegraded) ? parseFloat((2 + rand() * 18).toFixed(1)) : 0,
      speedHistory: (() => {
        if (!customer.wan?.speedDown) return []
        const tier2 = parseTierMbps(customer.serviceLevel)
        const entries = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(Date.now() - i * 3 * 24 * 3600000)
          const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]
          const down = Math.round(customer.wan.speedDown * (0.75 + rand() * 0.35))
          const up   = Math.round((customer.wan.speedUp ?? 0) * (0.75 + rand() * 0.35))
          entries.push({ date: `${mon} ${d.getDate()}`, down, up, latency: Math.round(latBase * (0.8 + rand() * 0.6)), anomaly: tier2 ? (down / tier2 < 0.60) : false })
        }
        return entries
      })(),
      connectionEvents: isOffline
        ? [{ online: false, label: 'Offline', note: 'Device unreachable' }]
        : [{ online: true, label: 'Jun 1 – Jun 4', note: 'Online continuously' }],
    },
    wifi: customer.wifi ? {
      activeBand: primaryBandKey,
      bands: {
        '2.4G': makeBand(Math.round(20 + rand() * 40), -91, Math.round(clientCount * 0.4), '2.4G'),
        '5G':   makeBand(Math.round(15 + rand() * 35), -96, Math.round(clientCount * 0.6), '5G'),
        '6G':   null,
      },
      topology: { gateway: { clients: clientCount }, extenders: [] },
      ssids: [{ name: `Home-${customer.id.slice(-3).toUpperCase()}`, password: `wifi_${seed}_pass` }],
      bandSteering: !isDegraded,
      channelScan: {
        lastScan: null,
        '2.4G': { neighborCount: isDegraded ? Math.round(8 + rand() * 15) : Math.round(rand() * 6) },
        '5G': { neighborCount: Math.round(rand() * 3) },
        neighbors: [],
      },
    } : { activeBand: null, bands: { '2.4G': null, '5G': null, '6G': null }, topology: { gateway: { clients: 0 }, extenders: [] }, ssids: [], bandSteering: null, channelScan: null },
    tickets: [],
    serviceLog: isOnline ? [
      { type: 'speedtest', title: 'Speed test completed', detail: `${customer.wan?.speedDown ?? '—'} / ${customer.wan?.speedUp ?? '—'} Mbps`, timeAgo: '2d ago', icon: 'zap' },
    ] : [],
    actions: isOnline ? [] : isDegraded ? [
      { id: 'a1', priority: 'med', title: 'Monitor for 24h before escalation', detail: 'Performance metrics are below baseline. Track for 24 hours — if issue persists, open a ticket.', cta: 'Set Alert', completed: false },
    ] : [
      { id: 'a1', priority: 'high', title: 'Investigate connectivity loss', detail: `Device has been offline since ${customer.lastSeen ? new Date(customer.lastSeen).toLocaleDateString() : 'unknown'}. Run a remote ping test to determine if it is a device or line issue.`, cta: 'Run Ping Test', completed: false },
    ],
    devices: (() => {
      const devs = [gw(`gw${seed}`, customer.deviceModel ?? 'WF-1000v4',
        { current: '1.2.1-p.42', latest: '1.2.1-p.42', upToDate: true },
        customer.uptime ?? null,
        customer.wan?.type === 'fiber' ? -(16 + rand() * 6) : null,
        isOnline ? clientCount : 0,
      )]
      if (!isOnline) return devs
      const names = ['MacBook Pro','iPhone','iPad','Smart TV','Echo Dot','Ring Doorbell','Laptop','Samsung TV','Nintendo Switch','Google Pixel','Nest Thermostat','Fire Stick','HP Laptop','Sony Headphones','Roomba']
      const bands = ['5G','5G','5G','2.4G','2.4G','2.4G','5G','2.4G','5G','5G','2.4G','2.4G','5G','2.4G','2.4G']
      const usageProfiles = [12.4, 1.1, 0.4, 8.2, 0.1, 0.2, 5.3, 7.1, null, 2.2, 0.1, 4.8, 3.7, null, null]
      for (let i = 0; i < Math.min(clientCount, names.length); i++) {
        const rssiBase = isDegraded ? -(65 + rand() * 25) : -(45 + rand() * 25)
        devs.push(cli(`c${i+1}`, names[i], 'Gateway', bands[i], Math.round(rssiBase), i === 0 ? 'now' : `${Math.round(rand() * 60)}m ago`, usageProfiles[i] ?? null))
      }
      return devs
    })(),
  }
}

export function getNetworkDetail(customer) {
  const detail = details[customer.id] ?? generateDefaultDetail(customer)
  // Merge wanExtra fields into the wan object so Zone3 receives them via wanExtended
  if (detail.wanExtra) {
    detail.wan = { ...detail.wan, ...detail.wanExtra }
  }
  return detail
}
