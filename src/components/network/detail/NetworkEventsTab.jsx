import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, Clock, Laptop, RadioTower, Router, Search, ShieldCheck, Smartphone, Wifi, Zap } from 'lucide-react'

const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00']
const RANGES = ['Last 6 hours', '24 hours', '7 days']
const HEAT = ['bg-noc-border/80', 'bg-noc-info/25', 'bg-noc-accent/20', 'bg-noc-info/25', 'bg-noc-warning/30', 'bg-noc-danger/45', 'bg-noc-danger/55', 'bg-noc-warning/30', 'bg-noc-info/20', 'bg-noc-border/80']
const STYLE = {
  info: { label: 'Info', dot: 'bg-noc-info shadow-[0_0_14px_rgba(56,189,248,0.65)]', text: 'text-noc-info', bg: 'bg-noc-info/10 border-noc-info/30' },
  warn: { label: 'Warning', dot: 'bg-noc-warning shadow-[0_0_14px_rgba(234,179,8,0.65)]', text: 'text-noc-warning', bg: 'bg-noc-warning/10 border-noc-warning/30' },
  error: { label: 'Critical', dot: 'bg-noc-danger shadow-[0_0_18px_rgba(239,68,68,0.75)] animate-pulse', text: 'text-noc-danger', bg: 'bg-noc-danger/10 border-noc-danger/30' },
  roam: { label: 'Roam', dot: 'bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.65)]', text: 'text-cyan-300', bg: 'bg-cyan-400/10 border-cyan-300/30' },
}

function event(id, type, left, time, title, rows, suggest) {
  return { id, type, left, time, title, rows, suggest }
}

function iconFor(device) {
  const name = `${device.name || ''} ${device.type || ''}`.toLowerCase()
  if (name.includes('phone') || name.includes('iphone')) return Smartphone
  if (name.includes('laptop') || name.includes('mac') || name.includes('win')) return Laptop
  return Wifi
}

function tone(t) {
  return {
    great: 'bg-gradient-to-r from-noc-accent to-emerald-300 shadow-[0_0_8px_rgba(34,197,94,0.4)]',
    good: 'bg-gradient-to-r from-emerald-400 to-lime-300 shadow-[0_0_8px_rgba(74,222,128,0.35)]',
    fair: 'bg-gradient-to-r from-lime-300 to-noc-warning shadow-[0_0_8px_rgba(234,179,8,0.3)]',
    degrading: 'bg-gradient-to-r from-noc-warning to-noc-danger shadow-[0_0_10px_rgba(249,115,22,0.45)]',
    bad: 'bg-gradient-to-r from-orange-500 to-noc-danger shadow-[0_0_10px_rgba(239,68,68,0.45)]',
    disconnected: 'border-t-2 border-dashed border-noc-muted/45 bg-transparent',
  }[t] || 'bg-noc-info'
}

function chartPath(values, w = 600, h = 46) {
  const min = Math.min(...values), max = Math.max(...values), span = Math.max(max - min, 1)
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - 6 - ((v - min) / span) * (h - 12)
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function buildCharts(problem, mode) {
  return problem ? [
    { key: 'traffic', label: 'Traffic', value: mode === 'device' ? 'Peak 18.2 Mbps' : 'Peak 42.8 Mbps', color: '#3b82f6', values: [8, 10, 13, 16, 21, 18, 6, 3, 2, 4, 13, 17, 19, 18], note: 'Traffic drops during disconnect.' },
    { key: 'latency', label: 'Latency', value: 'Peak 208 ms', color: '#eab308', values: [22, 21, 24, 28, 33, 92, 208, 176, 74, 31, 29, 26, 24, 23], note: 'Latency spikes when connection is red.' },
    { key: 'channel', label: 'Channel Util.', value: 'Peak 82%', color: '#06b6d4', values: [26, 28, 31, 38, 44, 58, 73, 82, 78, 61, 46, 38, 34, 31], note: 'Utilization overlaps warnings.' },
  ] : [
    { key: 'traffic', label: 'Traffic', value: mode === 'device' ? 'Avg 2.4 Mbps' : 'Avg 9.8 Mbps', color: '#3b82f6', values: [4, 5, 7, 6, 8, 9, 7, 8, 10, 9, 8, 7, 9, 8], note: 'Traffic remains steady.' },
    { key: 'latency', label: 'Latency', value: 'Avg 12 ms', color: '#eab308', values: [10, 11, 12, 10, 13, 12, 14, 13, 12, 11, 13, 12, 11, 10], note: 'Latency stays low.' },
    { key: 'channel', label: 'Channel Util.', value: 'Avg 29%', color: '#06b6d4', values: [22, 24, 27, 29, 31, 30, 28, 27, 32, 31, 29, 28, 26, 25], note: 'Channel stays normal.' },
  ]
}

function deviceRows(device, cpes, problem, detail) {
  const p = cpes[0], s = cpes[1] || p, t = cpes[2] || p, name = device.name || 'client'
  return [
    {
      id: `${device.id}-p`, label: p?.model || p?.name || 'Gateway', meta: `${p?.band || '5GHz'} CH${detail.wifi?.bands?.['5G']?.channel || 36}`,
      bands: [{ left: 0, width: 37, tone: 'great' }, { left: 37, width: 5, tone: 'good' }],
      events: [
        event('dhcp', 'info', 8, '08:30:12', 'DHCP lease renewed', [['Device', name], ['IP', '192.168.1.42']], 'Routine lease renewal.'),
        event('roam', 'roam', 37, '10:16:03', 'Roaming initiated', [['From', p?.model || 'Gateway'], ['RSSI', `${device.rssi || -62} dBm`]], 'Device started moving away from primary CPE.'),
      ],
    },
    {
      id: `${device.id}-s`, label: s?.model || s?.name || 'Extender', meta: `${s?.band || '5GHz'} CH${detail.wifi?.bands?.['5G']?.channel || 149}`,
      bands: [{ left: 37, width: 5, tone: 'good' }, { left: 42, width: 5, tone: problem ? 'degrading' : 'fair' }, ...(problem ? [{ left: 47, width: 3.5, tone: 'bad' }, { left: 51, width: 10, tone: 'disconnected' }] : [{ left: 47, width: 14, tone: 'good' }]), { left: 61, width: 12, tone: 'good' }, { left: 73, width: 8, tone: problem ? 'degrading' : 'good' }],
      events: [
        event('signal', problem ? 'warn' : 'info', 43, '10:20:13', `Signal quality drop - ${name}`, [['RSSI', problem ? '-85 dBm' : '-68 dBm'], ['Packet loss', problem ? '12.3%' : '0.4%'], ['Channel util.', problem ? '58%' : '27%']], problem ? 'Latency spike aligns with weak RSSI and retry rate.' : 'Short signal dip recovered.'),
        ...(problem ? [event('disconnect', 'error', 50.5, '10:25:41', `Client disconnected - ${name}`, [['Reason', 'Inactivity Timeout'], ['Downtime', '22m 39s']], 'Connection is red here; traffic drops and latency spikes at the same timestamp.')] : []),
        event('reconnect', 'info', 61, '10:48:20', `Reconnected - ${name}`, [['RSSI', '-58 dBm'], ['Auth', '802.11r']], 'Client re-associated after degraded window.'),
        event('slow-roam', problem ? 'roam' : 'info', 73, '11:30:07', 'Roaming initiated', [['Type', problem ? 'Full re-auth' : 'Fast transition'], ['Target', t?.model || p?.model || 'Gateway']], problem ? 'Slow roam indicates insufficient overlap.' : 'Fast roaming completed normally.'),
      ],
    },
    {
      id: `${device.id}-t`, label: t?.model || p?.model || '2.4GHz radio', meta: `2.4GHz CH${detail.wifi?.bands?.['2.4G']?.channel || 6}`,
      bands: [{ left: 73, width: 19, tone: problem ? 'fair' : 'good' }],
      events: [event('downgrade', problem ? 'warn' : 'info', 73, '11:30:38', 'Band downgrade', [['Band', '5GHz -> 2.4GHz'], ['PHY rate', problem ? '72 Mbps' : '240 Mbps']], problem ? '2.4GHz fallback reduced throughput.' : 'Band change stayed acceptable.')],
    },
  ]
}

function cpeRows(cpe, devices, problem, detail) {
  const util = detail.wifi?.bands?.[detail.wifi?.activeBand || '5G']?.util || (problem ? 62 : 28)
  return devices.slice(0, 5).map((device, i) => {
    const rssi = device.rssi || -64, rowProblem = problem && (i < 3 || rssi < -74)
    return {
      id: `${cpe.id}-${device.id || i}`, label: device.name || `Client ${i + 1}`, meta: `${device.band || 'Wi-Fi'} ${rssi} dBm`,
      bands: [{ left: 0, width: 40 + i * 2, tone: i ? 'good' : 'great' }, { left: 42 + i, width: 7, tone: rowProblem ? 'degrading' : 'fair' }, ...(rowProblem && i === 0 ? [{ left: 50.5, width: 10, tone: 'disconnected' }] : []), { left: rowProblem && i === 0 ? 61 : 52, width: rowProblem ? 22 : 38, tone: rowProblem ? 'fair' : 'good' }],
      events: [
        ...(rowProblem ? [event(`warn-${i}`, 'warn', 43 + i * 1.5, `10:${20 + i}:13`, `Signal / throughput drop - ${device.name || 'client'}`, [['RSSI', `${Math.min(rssi, -75)} dBm`], ['Channel util.', `${util}%`]], 'Multiple clients degrade in same window, pointing to selected CPE/radio.')] : []),
        ...(rowProblem && i === 0 ? [event(`loss-${i}`, 'error', 50.5, '10:25:41', `Disconnected - ${device.name || 'client'}`, [['Reason', 'Inactivity Timeout'], ['CPE', cpe.model || cpe.name || 'CPE']], 'Client loss coincides with CPE utilization and latency spike.')] : []),
        event(`assoc-${i}`, i ? 'roam' : 'info', i ? 73 : 61, i ? '11:30:07' : '10:48:20', i ? 'Roam / reassociation' : 'Client reconnected', [['Client', device.name || 'client'], ['RSSI', `${Math.max(rssi, -68)} dBm`]], rowProblem ? 'Recovered after degraded CPE window.' : 'Normal association event.'),
      ],
    }
  })
}

function buildEntities(detail, customer) {
  const degraded = detail.ai?.status === 'critical' || detail.ai?.status === 'degraded'
  const equipment = (detail.devices || []).filter((d) => d.cat === 'equipment')
  const clients = (detail.devices || []).filter((d) => d.cat === 'client')
  const fallback = { id: 'gateway', model: customer.deviceModel || 'Gateway', type: 'gateway', band: 'WAN', status: customer.status }
  const cpes = equipment.length ? equipment : [fallback]
  const clientList = clients.length ? clients : [
    { id: 'phone', name: 'Customer iPhone', band: '5G', rssi: degraded ? -82 : -58, connectedTo: fallback.model },
    { id: 'laptop', name: 'Work Laptop', band: '5G', rssi: degraded ? -76 : -61, connectedTo: fallback.model },
  ]
  const deviceEntities = clientList.map((device, i) => {
    const rssi = device.rssi ?? (degraded ? -79 : -61)
    const problem = degraded && (i === 0 || rssi < -75)
    const health = problem || rssi < -78 ? 38 : rssi < -70 ? 71 : 87
    return { id: device.id, name: device.name || `Client ${i + 1}`, meta: `${device.band || 'Wi-Fi'} - ${rssi} dBm - ${device.mac || 'client MAC'}`, icon: iconFor(device), health, stats: [['Health', health], ['Roams', problem ? 3 : 1], ['Disconnects', problem ? 2 : 0], ['Avg RSSI', rssi]], rows: deviceRows(device, cpes, problem, detail), charts: buildCharts(problem, 'device'), summary: problem ? 'Selected device moved through weak coverage and hit a high-latency disconnect window around 10:20-10:48.' : 'Selected device stayed connected with routine DHCP/roam events and no sustained degradation.' }
  })
  const cpeEntities = cpes.map((cpe, i) => {
    const attached = clientList.filter((d) => (d.connectedTo || '').includes(cpe.model || cpe.name || '') || (i === 0 && !(d.connectedTo || '').toLowerCase().includes('extender')))
    const members = attached.length ? attached : clientList.slice(0, Math.max(1, Math.min(4, clientList.length)))
    const problem = degraded && (i === 0 || cpe.backhaul?.quality === 'poor' || cpe.status === 'degraded')
    const avgRssi = Math.round(members.reduce((sum, d) => sum + (d.rssi || -65), 0) / members.length)
    const channelUtil = detail.wifi?.bands?.[detail.wifi?.activeBand || '5G']?.util || (problem ? 62 : 28)
    return { id: cpe.id, name: cpe.model || cpe.name || `CPE ${i + 1}`, meta: `${cpe.type || 'CPE'} - ${cpe.band || cpe.backhaul?.type || 'WAN'} - ${members.length} clients`, icon: cpe.type === 'gateway' ? Router : RadioTower, health: problem ? 54 : 88, stats: [['Health', problem ? 54 : 88], ['Clients', members.length], ['Ch. Util.', `${channelUtil}%`], ['Avg RSSI', avgRssi]], rows: cpeRows(cpe, members, problem, detail), charts: buildCharts(problem, 'cpe'), summary: problem ? 'Multiple devices connected to this CPE show concurrent warning/critical events during the same time window.' : 'Connected devices remain stable; events are low-impact and isolated.' }
  })
  return { deviceEntities, cpeEntities }
}

function flattenEvents(entity) {
  return entity.rows.flatMap((row) => row.events.map((item) => ({ ...item, rowLabel: row.label, rowMeta: row.meta, uid: `${row.id}-${item.id}` })))
}

export default function NetworkEventsTab({ customer, detail, lastPolledMins, onLogEvent }) {
  const [mode, setMode] = useState('device')
  const [range, setRange] = useState('Last 6 hours')
  const [listQuery, setListQuery] = useState('')
  const [eventQuery, setEventQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState({})
  const [eventIds, setEventIds] = useState({})
  const { deviceEntities, cpeEntities } = useMemo(() => buildEntities(detail, customer), [detail, customer])
  const entities = mode === 'device' ? deviceEntities : cpeEntities
  const entity = entities.find((item) => item.id === (selectedIds[mode] || entities[0]?.id)) || entities[0]
  const events = entity ? flattenEvents(entity) : []
  const selectedEventId = eventIds[mode] || events.find((item) => item.type === 'error')?.uid || events[0]?.uid
  const selectedEvent = events.find((item) => item.uid === selectedEventId) || events[0]
  const filteredEntities = entities.filter((item) => `${item.name} ${item.meta}`.toLowerCase().includes(listQuery.toLowerCase()))
  const filteredEvents = events.filter((item) => `${item.title} ${item.time} ${item.rowLabel} ${item.type}`.toLowerCase().includes(eventQuery.toLowerCase()))
  const Icon = entity?.icon
  if (!entity) return <p className="text-sm text-noc-muted">No network event data available.</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-noc-info/30 bg-noc-info/10 text-noc-info"><Activity size={17} /></span>
          <div><h2 className="text-lg font-semibold text-noc-fg">Network Events</h2><p className="text-xs text-noc-muted">{mode === 'device' ? 'Device View: customer-owned devices across CPE connections over time.' : 'CPE View: one CPE with all connected customer devices across the same timeline.'}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-noc-border bg-noc-bg p-1">{[['device', 'Device View'], ['cpe', 'CPE View']].map(([id, label]) => <button key={id} onClick={() => setMode(id)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${mode === id ? 'bg-noc-info text-white shadow-[0_0_18px_rgba(56,189,248,0.25)]' : 'text-noc-muted hover:text-noc-fg'}`}>{label}</button>)}</div>
          {RANGES.map((option) => <button key={option} onClick={() => setRange(option)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${range === option ? 'border-noc-info/40 bg-noc-info/15 text-noc-info' : 'border-noc-border bg-noc-raised/35 text-noc-muted hover:text-noc-fg'}`}>{option}</button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-noc-border bg-noc-raised/30 p-3"><p className="text-[10px] uppercase tracking-[0.1em] text-noc-muted">Window</p><p className="mt-1 text-sm font-semibold text-noc-fg">{range}</p><p className="mt-1 text-xs text-noc-muted">Updated {lastPolledMins <= 1 ? 'just now' : `${lastPolledMins} min ago`}</p></div>
        <div className="rounded-xl border border-noc-danger/30 bg-noc-danger/10 p-3"><p className="text-[10px] uppercase tracking-[0.1em] text-noc-danger">Critical</p><p className="mt-1 text-2xl font-semibold text-noc-danger font-code">{events.filter((item) => item.type === 'error').length}</p></div>
        <div className="rounded-xl border border-noc-warning/30 bg-noc-warning/10 p-3"><p className="text-[10px] uppercase tracking-[0.1em] text-noc-warning">Warnings</p><p className="mt-1 text-2xl font-semibold text-noc-warning font-code">{events.filter((item) => item.type === 'warn').length}</p></div>
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-3"><p className="text-[10px] uppercase tracking-[0.1em] text-cyan-300">Rows Shown</p><p className="mt-1 text-2xl font-semibold text-cyan-300 font-code">{entity.rows.length}</p></div>
      </div>
      <div className="grid min-h-[640px] grid-cols-1 overflow-hidden rounded-2xl border border-noc-border bg-noc-bg/70 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-noc-border bg-noc-surface/80">
          <div className="border-b border-noc-border p-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-noc-muted">{mode === 'device' ? 'Customer Devices' : 'CPE List'}</p><label className="relative block"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-noc-muted" /><input value={listQuery} onChange={(e) => setListQuery(e.target.value)} placeholder={mode === 'device' ? 'Search laptop, phone...' : 'Search gateway, extender...'} className="w-full rounded-lg border border-noc-border bg-noc-bg py-2 pl-8 pr-3 text-xs text-noc-fg outline-none focus:border-noc-info/50" /></label></div>
          <div className="max-h-[680px] overflow-y-auto scrollbar-dark py-1">{filteredEntities.map((item) => { const ListIcon = item.icon; const healthClass = item.health < 50 ? 'text-noc-danger bg-noc-danger/10 border-noc-danger/30' : item.health < 75 ? 'text-noc-warning bg-noc-warning/10 border-noc-warning/30' : 'text-noc-accent bg-noc-accent/10 border-noc-accent/30'; return <button key={item.id} onClick={() => { setSelectedIds((prev) => ({ ...prev, [mode]: item.id })); setEventIds((prev) => ({ ...prev, [mode]: null })) }} className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors hover:bg-noc-raised/35 cursor-pointer ${entity.id === item.id ? 'border-noc-info bg-noc-raised/45' : 'border-transparent'}`}><span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-noc-border bg-noc-bg text-noc-info"><ListIcon size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-noc-fg">{item.name}</span><span className="block truncate text-[11px] text-noc-muted">{item.meta}</span></span><span className={`rounded-md border px-2 py-1 text-xs font-semibold font-code ${healthClass}`}>{item.health}</span></button> })}</div>
        </aside>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-4 border-b border-noc-border bg-noc-raised/30 px-5 py-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-noc-border bg-noc-bg text-noc-info"><Icon size={20} /></span><div className="min-w-0"><h2 className="truncate text-lg font-semibold text-noc-fg">{entity.name}</h2><p className="truncate text-xs font-code text-noc-muted">{entity.meta}</p></div><div className="ml-auto grid grid-cols-2 gap-4 sm:grid-cols-4">{entity.stats.map(([label, value]) => <div key={label} className="text-center"><p className="font-code text-lg font-semibold text-noc-fg">{value}</p><p className="text-[9px] uppercase tracking-[0.1em] text-noc-muted">{label}</p></div>)}</div></div>
          <div className="flex flex-wrap items-center gap-3 border-b border-noc-border bg-noc-raised/20 px-4 py-3"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-noc-muted w-24"><Zap size={13} />Event Heat</div><div className="flex min-w-[240px] flex-1 gap-1">{HEAT.map((color, index) => <button key={index} className={`h-3 flex-1 min-w-2 rounded-sm ${color} hover:scale-y-150 transition-transform cursor-pointer`} title={`${range} segment ${index + 1}`} />)}</div><div className="flex items-center gap-3 text-[11px] text-noc-muted"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-noc-info" /> info</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-noc-warning" /> warning</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-noc-danger" /> critical</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-300" /> roam</span></div></div>
          <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-x-auto p-4"><div className="min-w-[820px]"><div className="ml-28 grid grid-cols-7 pb-2 text-center text-[10px] font-code text-noc-muted">{TIMES.map((time) => <span key={time}>{time}</span>)}</div><div className="space-y-1">{entity.rows.map((row) => <div key={row.id} className="flex h-16 items-center"><div className="w-28 pr-3 text-right"><p className="truncate text-xs font-semibold text-noc-fg">{row.label}</p><p className="truncate text-[10px] text-noc-muted">{row.meta}</p></div><div className="relative h-full flex-1 border-b border-noc-border/50 bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(100%/6-1px),rgba(30,41,59,0.35)_calc(100%/6-1px),rgba(30,41,59,0.35)_calc(100%/6+1px))]">{row.bands.map((band, index) => <span key={index} className={`absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full ${tone(band.tone)}`} style={{ left: `${band.left}%`, width: `${band.width}%` }} />)}{row.events.map((item) => { const uid = `${row.id}-${item.id}`; return <button key={uid} onClick={() => setEventIds((prev) => ({ ...prev, [mode]: uid }))} title={`${item.time} - ${item.title}`} className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-noc-bg transition-transform hover:scale-150 cursor-pointer ${STYLE[item.type].dot} ${selectedEventId === uid ? 'ring-2 ring-white/50 scale-125' : ''}`} style={{ left: `${item.left}%` }} /> })}</div></div>)}</div></div></div>
            <div className="border-t border-noc-border bg-noc-surface/75 p-4 2xl:border-l 2xl:border-t-0">{selectedEvent && <div className={`rounded-xl border p-4 ${STYLE[selectedEvent.type].bg}`}><div className="flex items-start justify-between gap-3"><div><p className={`text-xs font-semibold uppercase tracking-[0.1em] ${STYLE[selectedEvent.type].text}`}>{STYLE[selectedEvent.type].label} Event</p><h3 className="mt-1 text-sm font-semibold text-noc-fg">{selectedEvent.title}</h3><p className="mt-1 text-xs text-noc-muted">{selectedEvent.rowLabel} - {selectedEvent.rowMeta}</p></div><span className="rounded-md border border-noc-border bg-noc-bg/60 px-2 py-1 text-xs font-code text-noc-fg">{selectedEvent.time}</span></div><div className="mt-3 space-y-2">{selectedEvent.rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 text-xs"><span className="text-noc-muted">{label}</span><span className="font-code text-noc-fg">{value}</span></div>)}</div><div className="mt-4 rounded-lg border border-noc-border/60 bg-noc-bg/55 p-3 text-xs text-noc-muted"><span className="font-semibold text-noc-fg">AI correlation: </span>{selectedEvent.suggest}</div><button onClick={() => onLogEvent?.(`Network event reviewed: ${selectedEvent.title}`, `${selectedEvent.time} - ${selectedEvent.rowLabel}`)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-noc-info/35 bg-noc-info/10 px-3 py-2 text-xs font-semibold text-noc-info hover:bg-noc-info/15 transition-colors cursor-pointer"><ShieldCheck size={13} />Add to Service Log</button></div>}</div>
          </div>
          <div className="border-t border-noc-border p-4"><div className="space-y-2">{entity.charts.map((chart) => { const path = chartPath(chart.values); return <div key={chart.key} className="grid grid-cols-[104px_1fr] items-center gap-3 rounded-lg border border-noc-border/70 bg-noc-surface/65 p-2"><div><p className="text-xs font-semibold text-noc-fg">{chart.label}</p><p className="text-[10px] font-code text-noc-muted">{chart.value}</p></div><div className="relative h-12 overflow-hidden rounded-md border border-noc-border/60 bg-noc-bg/70"><div className="absolute left-[42%] top-0 h-full w-[16%] rounded-sm bg-noc-danger/10" /><svg viewBox="0 0 600 46" preserveAspectRatio="none" className="absolute inset-0 h-full w-full"><path d={`${path} L600,46 L0,46 Z`} fill={chart.color} opacity="0.12" /><path d={path} fill="none" stroke={chart.color} strokeWidth="2" />{chart.key === 'latency' && <line x1="300" y1="0" x2="300" y2="46" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />}</svg><p className="absolute bottom-1 right-2 text-[9px] text-noc-muted">{chart.note}</p></div></div> })}</div></div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="rounded-xl border border-noc-border bg-noc-surface overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-noc-border px-4 py-3"><div><p className="text-sm font-semibold text-noc-fg">Event Stream</p><p className="text-xs text-noc-muted">Search exact timestamp, CPE, device, or event type.</p></div><label className="relative min-w-[240px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-noc-muted" /><input value={eventQuery} onChange={(e) => setEventQuery(e.target.value)} placeholder="10:25, phone, critical..." className="w-full rounded-lg border border-noc-border bg-noc-bg py-2 pl-8 pr-3 text-xs text-noc-fg outline-none focus:border-noc-info/50" /></label></div><div className="max-h-80 overflow-y-auto scrollbar-dark divide-y divide-noc-border/50">{filteredEvents.map((item) => <button key={item.uid} onClick={() => setEventIds((prev) => ({ ...prev, [mode]: item.uid }))} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-noc-raised/30 cursor-pointer ${selectedEventId === item.uid ? 'bg-noc-info/5' : ''}`}><span className={`h-2.5 w-2.5 rounded-full ${STYLE[item.type].dot}`} /><span className="w-16 flex-shrink-0 font-code text-xs text-noc-muted">{item.time}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-noc-fg">{item.title}</span><span className="block truncate text-xs text-noc-muted">{item.rowLabel} - {item.rowMeta}</span></span><span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${STYLE[item.type].bg} ${STYLE[item.type].text}`}>{STYLE[item.type].label}</span></button>)}</div></div>
        <div className="space-y-3"><div className="rounded-xl border border-noc-border bg-gradient-to-br from-noc-info/12 via-noc-raised/30 to-noc-surface p-4"><div className="flex items-center gap-2 text-sm font-semibold text-noc-fg"><RadioTower size={15} className="text-noc-info" />Correlation Summary</div><p className="mt-2 text-sm text-noc-muted">{entity.summary}</p></div><div className="rounded-xl border border-noc-border bg-noc-surface p-4"><div className="flex items-center gap-2 text-sm font-semibold text-noc-fg"><AlertTriangle size={15} className="text-noc-warning" />Operator Focus</div><p className="mt-2 text-sm text-noc-muted">In Device View, each row is a CPE the selected device connected through. In CPE View, each row is a customer device connected to the selected CPE.</p></div><div className="rounded-xl border border-noc-border bg-noc-surface p-4"><div className="flex items-center gap-2 text-sm font-semibold text-noc-fg"><Clock size={15} className="text-noc-accent" />Chart Coupling</div><div className="mt-3 grid grid-cols-1 gap-2 text-xs text-noc-muted"><span className="inline-flex items-center gap-1.5"><Zap size={12} /> Traffic drops during disconnect windows.</span><span className="inline-flex items-center gap-1.5"><Activity size={12} /> Latency spikes when the connection segment turns red.</span><span className="inline-flex items-center gap-1.5"><Wifi size={12} /> Channel utilization rises during warning clusters.</span></div></div></div>
      </div>
    </div>
  )
}
