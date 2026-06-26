import { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Wifi, RefreshCw, ScanLine, GripHorizontal, X,
  Eye, EyeOff, MessageSquare, Mail, Activity, Lock,
} from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'

// ── Color tokens — identical to Zone 3 ───────────────────────────────────────
const LEVEL = {
  good: { color: 'text-noc-accent',  bg: 'bg-noc-accent/10',  border: 'border-noc-accent/20',  dot: 'bg-noc-accent'  },
  warn: { color: 'text-noc-warning', bg: 'bg-noc-warning/10', border: 'border-noc-warning/20', dot: 'bg-noc-warning' },
  bad:  { color: 'text-noc-danger',  bg: 'bg-noc-danger/10',  border: 'border-noc-danger/20',  dot: 'bg-noc-danger'  },
}
const HEX = { good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', info: '#3B82F6', muted: '#94A3B8', border: '#334155' }

function Dot({ level, pulse }) {
  if (!level) return null
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL[level].dot} ${pulse ? 'animate-pulse' : ''}`} />
  )
}

function SectionLabel({ children }) {
  return <p className="text-[11px] font-semibold text-noc-label uppercase tracking-widest mb-1.5">{children}</p>
}

function StaleLabel({ mins }) {
  const lvl = mins > 15 ? 'bad' : mins > 10 ? 'warn' : null
  return (
    <span className={`text-xs font-code ${lvl ? LEVEL[lvl].color : 'text-noc-muted'}`}>
      {mins <= 1 ? 'just now' : `${mins} min ago`}
    </span>
  )
}

// ── Floating panel shell — same component as Zone 3 ─────────────────────────
function FloatingPanel({ title, subtitle, onClose, defaultX = 520, defaultY = 150, width = 660, children }) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY })
  const dragging = useRef(false)
  const offset   = useRef({ x: 0, y: 0 })

  const onMouseDown = useCallback((e) => {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    const onMove = (e) => { if (dragging.current) setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y }) }
    const onUp   = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    e.preventDefault()
  }, [pos])

  return createPortal(
    <div className="fixed z-50 bg-noc-surface border border-noc-border rounded-xl shadow-2xl overflow-hidden"
         style={{ left: pos.x, top: pos.y, width }}>
      <div className="flex items-center justify-between px-5 py-3.5 bg-noc-raised/70 border-b border-noc-border cursor-grab active:cursor-grabbing select-none"
           onMouseDown={onMouseDown}>
        <div className="flex items-center gap-3">
          <GripHorizontal size={14} className="text-noc-muted/40" />
          <div>
            <p className="text-sm font-semibold text-noc-fg">{title}</p>
            {subtitle && <p className="text-xs text-noc-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button onClick={onClose} className="text-noc-muted hover:text-noc-fg transition-colors cursor-pointer p-1.5 rounded hover:bg-noc-raised">
          <X size={15} />
        </button>
      </div>
      <div className="px-5 py-5 max-h-[80vh] overflow-y-auto scrollbar-dark">{children}</div>
    </div>,
    document.body
  )
}

// ── View All Nodes panel ──────────────────────────────────────────────────────
function ViewAllNodesPanel({ devices, onClose }) {
  const [query, setQuery] = useState('')
  const [page,  setPage]  = useState(0)
  const PER_PAGE = 10

  const nodes    = (devices ?? []).filter(d => d.cat === 'equipment')
  const filtered = query
    ? nodes.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        (d.type ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (d.status ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : nodes
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const visible    = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const onlineCount = nodes.filter(d => d.status === 'online').length

  function nodeLevel(d) {
    if (d.status === 'offline') return 'bad'
    if (d.backhaul?.quality === 'poor' || d.status === 'degraded') return 'warn'
    return 'good'
  }

  function backhaulText(d) {
    if (!d.backhaul) return null
    const t = d.backhaul.type
    if (t === 'ethernet') return 'Ethernet'
    if (t === 'wireless-5g') return '5G Wireless'
    if (t === 'wireless-2.4g') return '2.4G Wireless'
    return t
  }

  function backhaulLevel(d) {
    if (!d.backhaul) return null
    return d.backhaul.quality === 'good' ? 'good' : d.backhaul.quality === 'fair' ? 'warn' : 'bad'
  }

  return (
    <FloatingPanel
      title="Equipment Nodes"
      subtitle={`${nodes.length} nodes · ${onlineCount} online`}
      onClose={onClose}
      defaultX={520}
      defaultY={180}
      width={700}
    >
      {/* Search */}
      <div className="relative mb-4">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(0) }}
          placeholder="Search node name, type, or status…"
          className="w-full pl-3 pr-8 py-2 text-xs bg-noc-raised border border-noc-border rounded-lg text-noc-fg placeholder-noc-muted/50 focus:outline-none focus:border-noc-info/50 transition-colors"
        />
        {query && (
          <button onClick={() => { setQuery(''); setPage(0) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-noc-muted hover:text-noc-fg cursor-pointer">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Table header */}
      <div className="grid gap-2 pb-2 border-b border-noc-border/35 mb-1"
           style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr 0.6fr 1fr' }}>
        {['Node', 'Type', 'Status', 'Backhaul', 'Dev', 'Uptime'].map(h => (
          <span key={h} className="text-xs font-semibold text-noc-muted/70 uppercase tracking-wide">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {visible.map(d => {
          const sl = nodeLevel(d)
          const bl = backhaulLevel(d)
          const bt = backhaulText(d)
          return (
            <div key={d.id}
                 className="grid gap-2 py-2 border-b border-noc-border/20 last:border-0 items-center hover:bg-noc-raised/30 rounded px-1 transition-colors"
                 style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr 0.6fr 1fr' }}>
              <div className="flex items-center gap-2 min-w-0">
                <Dot level={sl} pulse={sl === 'bad'} />
                <span className="text-xs text-noc-fg truncate font-medium">{d.name}</span>
              </div>
              <span className="text-xs text-noc-muted/70 capitalize">{d.type ?? '—'}</span>
              <span className={`text-xs font-semibold ${LEVEL[sl].color}`}>
                {d.status === 'offline' ? 'Offline' : d.status === 'degraded' ? 'Degraded' : 'Online'}
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                {bt ? (
                  <>
                    <span className={`text-xs truncate ${bl ? LEVEL[bl].color : 'text-noc-muted'}`}>{bt}</span>
                    {bl && <Dot level={bl} />}
                  </>
                ) : (
                  <span className="text-xs text-noc-muted/35">—</span>
                )}
              </div>
              <span className="text-xs font-code text-noc-fg">{d.clientCount ?? '—'}</span>
              <span className="text-xs font-code text-noc-muted/70">{d.uptime ?? '—'}</span>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-noc-muted/75 py-4 text-center">No nodes match "{query}"</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-noc-border/35">
          <span className="text-xs text-noc-muted">
            {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-2 py-1 text-xs text-noc-muted hover:text-noc-fg disabled:opacity-30 cursor-pointer transition-colors">‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-6 h-6 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  page === i ? 'bg-noc-info text-white' : 'text-noc-muted hover:text-noc-fg'
                }`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="px-2 py-1 text-xs text-noc-muted hover:text-noc-fg disabled:opacity-30 cursor-pointer transition-colors">›</button>
          </div>
        </div>
      )}
    </FloatingPanel>
  )
}

// ── Channel Scan panel ────────────────────────────────────────────────────────
// Static channel density data (networks per channel)
const CH_DENSITY = {
  '2.4G': [
    { ch: 1, n: 3 }, { ch: 2, n: 1 }, { ch: 3, n: 1 }, { ch: 4, n: 0 },
    { ch: 5, n: 2 }, { ch: 6, n: 12 }, { ch: 7, n: 4 }, { ch: 8, n: 1 },
    { ch: 9, n: 0 }, { ch: 10, n: 1 }, { ch: 11, n: 5 },
  ],
  '5G': [
    { ch: 36, n: 2 }, { ch: 40, n: 0 }, { ch: 44, n: 1 }, { ch: 48, n: 3 },
    { ch: 52, n: 0 }, { ch: 100, n: 1 }, { ch: 104, n: 0 },
    { ch: 149, n: 2 }, { ch: 153, n: 0 }, { ch: 157, n: 1 }, { ch: 161, n: 0 },
  ],
  '6G': [
    { ch: 1, n: 0 }, { ch: 5, n: 1 }, { ch: 21, n: 0 },
    { ch: 37, n: 0 }, { ch: 53, n: 1 }, { ch: 69, n: 0 },
  ],
}

function ChannelChart({ bandKey, customerChannel }) {
  const { theme }   = useTheme()
  const chartMuted  = theme === 'light' ? '#64748B' : '#94A3B8'
  const chartBorder = theme === 'light' ? '#CBD5E1' : '#334155'
  const cursorFill  = theme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'
  const data = CH_DENSITY[bandKey] ?? []

  const ChartTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const { ch, n } = payload[0].payload
    const isCust = ch === customerChannel
    return (
      <div className="bg-noc-raised border border-noc-border rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="text-noc-muted/80 mb-0.5">Channel {ch}</p>
        <p className={`font-bold font-code ${isCust ? 'text-noc-warning' : 'text-noc-info'}`}>
          {n} network{n !== 1 ? 's' : ''}
        </p>
        {isCust && <p className="text-noc-warning/70 mt-0.5">Customer's channel</p>}
      </div>
    )
  }

  // Color each bar: customer channel = amber, others = info blue
  const CustomBar = ({ x, y, width, height, index }) => {
    const ch = data[index]?.ch
    const fill = ch === customerChannel ? HEX.warn : HEX.info
    return <rect x={x} y={y} width={width} height={Math.max(height, 1)} fill={fill} rx={2} opacity={0.8} />
  }

  return (
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={chartBorder} strokeOpacity={0.4} />
          <XAxis dataKey="ch" tick={{ fill: chartMuted, fontSize: 9, fontFamily: 'Fira Code' }}
                 tickLine={false} axisLine={false}
                 label={{ value: 'Channel', position: 'insideBottom', fill: chartMuted, fontSize: 9, dy: 12 }} />
          <YAxis tick={{ fill: chartMuted, fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTip />} cursor={{ fill: cursorFill }} />
          <Bar dataKey="n" shape={<CustomBar />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChannelScanPanel({ bands, channelScan, onClose }) {
  const [neighborQuery, setNeighborQuery] = useState('')
  const [neighborPage,  setNeighborPage]  = useState(0)
  const [bandFilter,    setBandFilter]    = useState('All')
  const PER_PAGE = 10

  const neighbors = channelScan?.neighbors ?? []
  const filtered  = neighbors.filter(n =>
    (bandFilter === 'All' || n.band === bandFilter) &&
    (!neighborQuery ||
      (n.ssid ?? '').toLowerCase().includes(neighborQuery.toLowerCase()) ||
      (n.bssid ?? '').toLowerCase().includes(neighborQuery.toLowerCase()))
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const visible    = filtered.slice(neighborPage * PER_PAGE, (neighborPage + 1) * PER_PAGE)

  return (
    <FloatingPanel
      title="Channel Scan Detail"
      subtitle={`Last scan: ${channelScan?.lastScan ?? 'Not yet run'}`}
      onClose={onClose}
      defaultX={540}
      defaultY={160}
      width={660}
    >
      {/* Per-band charts */}
      {(['2.4G', '5G', '6G']).map(b => {
        const bd = bands?.[b]
        // Always show 2.4G chart; skip 5G/6G if no data
        if (!bd && b !== '2.4G') return null
        const congested = bd && bd.util >= 60
        return (
          <div key={b} className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-noc-fg font-code">{b} Channel Interference</span>
                {bd && (
                  <span className={`text-xs font-semibold ${congested ? 'text-noc-warning' : 'text-noc-accent'}`}>
                    {congested ? '● Congested' : '● Clear'}
                  </span>
                )}
              </div>
              {bd && <span className="text-2xs text-noc-muted font-code">Ch {bd.channel} · {bd.util}% util</span>}
            </div>
            {bd ? (
              <ChannelChart bandKey={b} customerChannel={bd.channel} />
            ) : (
              <div className="h-10 flex items-center justify-center text-xs text-noc-muted/40 bg-noc-raised/20 rounded-lg">
                Not reported by gateway
              </div>
            )}
          </div>
        )
      })}

      {/* Neighbor scan table */}
      <div className="mt-2 pt-4 border-t border-noc-border/35">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-noc-muted uppercase tracking-wide">
            Neighbor Scan {neighbors.length > 0 ? `· ${neighbors.length} detected` : ''}
          </p>
          {neighbors.length > 0 && (
            <div className="flex gap-1">
              {['All', '2.4G', '5G', '6G'].map(b => (
                <button key={b} onClick={() => { setBandFilter(b); setNeighborPage(0) }}
                  className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    bandFilter === b ? 'bg-noc-info/20 text-noc-info' : 'text-noc-muted hover:text-noc-fg'
                  }`}>{b}</button>
              ))}
            </div>
          )}
        </div>

        {neighbors.length > 0 ? (
          <>
            <div className="relative mb-2">
              <input value={neighborQuery}
                onChange={e => { setNeighborQuery(e.target.value); setNeighborPage(0) }}
                placeholder="Filter by SSID or BSSID…"
                className="w-full pl-3 pr-8 py-1.5 text-xs bg-noc-raised border border-noc-border rounded-lg text-noc-fg placeholder-noc-muted/50 focus:outline-none focus:border-noc-info/50 transition-colors"
              />
              {neighborQuery && (
                <button onClick={() => setNeighborQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-noc-muted hover:text-noc-fg cursor-pointer">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Table header */}
            <div className="grid gap-2 pb-1.5 border-b border-noc-border/30 mb-1"
                 style={{ gridTemplateColumns: '2fr 0.8fr 0.6fr 1fr 1fr' }}>
              {['SSID', 'Band', 'Ch', 'RSSI', 'Vendor'].map(h => (
                <span key={h} className="text-xs font-semibold text-noc-muted/70 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            {visible.map((n, i) => (
              <div key={i}
                   className="grid gap-2 py-1.5 border-b border-noc-border/15 last:border-0 hover:bg-noc-raised/30 rounded px-0.5 transition-colors"
                   style={{ gridTemplateColumns: '2fr 0.8fr 0.6fr 1fr 1fr' }}>
                <span className="text-xs text-noc-fg truncate">
                  {n.ssid || <span className="text-noc-muted/40 italic">hidden</span>}
                </span>
                <span className="text-xs text-noc-muted font-code">{n.band}</span>
                <span className="text-xs text-noc-muted font-code">{n.channel}</span>
                <span className="text-xs font-code text-noc-warning">{n.rssi} dBm</span>
                <span className="text-xs text-noc-muted">{n.vendor ?? '—'}</span>
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="text-xs text-noc-muted/75 py-3 text-center">No neighbors match filter</p>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-noc-border/30">
                <span className="text-xs text-noc-muted">
                  {neighborPage * PER_PAGE + 1}–{Math.min((neighborPage + 1) * PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setNeighborPage(p => Math.max(0, p - 1))} disabled={neighborPage === 0}
                    className="px-2 py-1 text-xs text-noc-muted hover:text-noc-fg disabled:opacity-30 cursor-pointer">‹</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button key={i} onClick={() => setNeighborPage(i)}
                      className={`w-6 h-6 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        neighborPage === i ? 'bg-noc-info text-white' : 'text-noc-muted hover:text-noc-fg'
                      }`}>{i + 1}</button>
                  ))}
                  <button onClick={() => setNeighborPage(p => Math.min(totalPages - 1, p + 1))} disabled={neighborPage === totalPages - 1}
                    className="px-2 py-1 text-xs text-noc-muted hover:text-noc-fg disabled:opacity-30 cursor-pointer">›</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-noc-muted/75 py-3 text-center">
            No neighbor scan data. Run a channel scan to populate.
          </p>
        )}
      </div>
    </FloatingPanel>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const BANDS = ['2.4G', '5G', '6G']

export default function Zone4WiFiHealth({ wifi, devices, pollNow, lastPolledMins }) {
  const { bands, topology, ssids, bandSteering, channelScan } = wifi ?? {}

  const [panels, setPanels] = useState({ nodes: false, channelScan: false })
  const [scanning,  setScanning]  = useState(false)
  const [polling,   setPolling]   = useState(false)
  const [revealed,  setRevealed]  = useState({})
  const [smsSent,   setSmsSent]   = useState({})
  const [emailSent, setEmailSent] = useState({})

  const staleMins     = lastPolledMins ?? 8
  const hasAnyBand    = bands && BANDS.some(b => bands[b] != null)
  const equipNodes    = (devices ?? []).filter(d => d.cat === 'equipment')
  const offlineNodes  = equipNodes.filter(d => d.status === 'offline')
  const totalNodes    = equipNodes.length

  // WiFi overall status — Degraded = amber (warn); Offline/node-down = red (bad)
  let wifiLevel = 'good', wifiLabel = 'Healthy', wifiIssue = null
  if (offlineNodes.length > 0) {
    wifiLevel = 'bad'; wifiLabel = 'Degraded'
    wifiIssue = `${offlineNodes[0].location ?? offlineNodes[0].name} offline`
  } else if (hasAnyBand) {
    for (const b of BANDS) {
      const d = bands?.[b]
      if (d?.util >= 60) { wifiLevel = 'warn'; wifiLabel = 'Degraded'; wifiIssue = `${b} congested`; break }
    }
  }
  if (wifiLevel === 'good' && bandSteering === false) {
    wifiLevel = 'warn'; wifiLabel = 'Degraded'; wifiIssue = 'band steering off'
  }

  // Recommended actions
  const recActions = []
  for (const b of BANDS) {
    const d = bands?.[b]
    if (d?.util >= 60) recActions.push({ level: 'warn', text: `Push channel change — ${b} Ch ${d.channel} congested` })
  }
  if (bandSteering === false) recActions.push({ level: 'warn', text: 'Enable band steering — currently OFF' })
  offlineNodes.forEach(n => recActions.push({ level: 'bad', text: `${n.name} offline` }))

  function toggle(key) { setPanels(p => ({ ...p, [key]: !p[key] })) }

  function handleScan() {
    setScanning(true)
    setTimeout(() => setScanning(false), 3500)
  }

  function handlePollNow() {
    setPolling(true)
    setTimeout(() => { setPolling(false); pollNow?.() }, 1800)
  }

  function handleSms(name) {
    setSmsSent(p => ({ ...p, [name]: true }))
    setTimeout(() => setSmsSent(p => ({ ...p, [name]: false })), 3000)
  }

  function handleEmail(name) {
    setEmailSent(p => ({ ...p, [name]: true }))
    setTimeout(() => setEmailSent(p => ({ ...p, [name]: false })), 3000)
  }

  if (!hasAnyBand) {
    return (
      <div className="bg-noc-surface border border-noc-border rounded-xl p-5 flex items-center justify-center min-h-[200px]">
        <p className="text-noc-muted text-sm">Wi-Fi data unavailable</p>
      </div>
    )
  }

  const wifiCfg = LEVEL[wifiLevel]

  return (
    <>
      <div className="bg-noc-surface border border-noc-border rounded-xl overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-noc-border bg-noc-raised/30">
          <div className="flex items-center gap-2">
            <Wifi size={14} className="text-noc-info" />
            <span className="text-sm font-semibold text-noc-fg">Wi-Fi Health</span>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${wifiCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${wifiCfg.dot} ${wifiLevel === 'bad' ? 'animate-pulse' : ''}`} />
              {wifiIssue ? `${wifiLabel} — ${wifiIssue}` : wifiLabel}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Activity size={11} className="text-noc-muted" />
              <StaleLabel mins={polling ? 0 : staleMins} />
            </div>
            <button onClick={handlePollNow} disabled={polling}
              className="flex items-center gap-1.5 text-xs text-noc-muted hover:text-noc-fg transition-colors cursor-pointer disabled:opacity-50">
              <RefreshCw size={12} className={polling ? 'animate-spin' : ''} />
              Poll Now
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-dark">
          <div className="px-4 py-3 space-y-4">

            {/* ── Equipment ── */}
            <div>
              <SectionLabel>Equipment</SectionLabel>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs min-w-0">
                  <Dot level={offlineNodes.length > 0 ? 'bad' : 'good'} pulse={offlineNodes.length > 0} />
                  <span className="font-semibold text-noc-fg">{totalNodes} node{totalNodes !== 1 ? 's' : ''}</span>
                  {offlineNodes.length === 0 ? (
                    <span className="text-noc-accent">· All online</span>
                  ) : (
                    <span className="text-noc-danger truncate">
                      · {offlineNodes.map(n => n.location ?? n.name).join(', ')} offline
                    </span>
                  )}
                </div>
                <button onClick={() => toggle('nodes')}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer flex-shrink-0 ${
                    panels.nodes
                      ? 'text-noc-info border-noc-info/40 bg-noc-info/10'
                      : 'text-noc-label border-noc-border/60 hover:text-noc-fg hover:border-noc-border bg-noc-raised/30'
                  }`}>
                  <Activity size={10} />↗ View all nodes
                </button>
              </div>
            </div>

            {/* ── Channels ── */}
            <div className="pt-1 border-t border-noc-border/35">
              <SectionLabel>Channels</SectionLabel>
              <div className="space-y-2 mb-3">
                {BANDS.map(b => {
                  const d = bands?.[b]
                  if (!d) return null
                  const congested = d.util >= 60
                  const level = congested ? 'warn' : 'good'
                  const cfg = LEVEL[level]
                  const scanData = channelScan?.[b]
                  return (
                    <div key={b} className="flex items-center gap-2 text-xs">
                      <span className={`font-code font-bold w-9 flex-shrink-0 ${cfg.color}`}>{b}</span>
                      <span className="text-noc-label font-code flex-shrink-0">Ch {d.channel}</span>
                      <Dot level={level} />
                      <span className={`${cfg.color} font-medium`}>
                        {congested
                          ? `Congested — ${scanData?.neighborCount ?? '30+'} networks`
                          : 'Clear'}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Scan controls row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <button onClick={handleScan} disabled={scanning}
                    className="flex items-center gap-1 text-xs text-noc-info hover:text-noc-info/80 disabled:opacity-40 cursor-pointer transition-colors font-medium">
                    <ScanLine size={11} className={scanning ? 'animate-pulse' : ''} />
                    {scanning ? 'Scanning…' : '▶ Run Channel Scan'}
                  </button>
                  <span className="text-2xs text-noc-muted/75 font-code">
                    {channelScan?.lastScan ? `Last: ${channelScan.lastScan}` : 'Not yet run'}
                  </span>
                </div>
                <button onClick={() => toggle('channelScan')}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer flex-shrink-0 ${
                    panels.channelScan
                      ? 'text-noc-info border-noc-info/40 bg-noc-info/10'
                      : 'text-noc-label border-noc-border/60 hover:text-noc-fg hover:border-noc-border bg-noc-raised/30'
                  }`}>
                  <ScanLine size={10} />↗ Channel Scan Detail
                </button>
              </div>
            </div>

            {/* ── Band Steering ── */}
            <div className="pt-1 border-t border-noc-border/35 flex items-center gap-2 text-xs">
              <span className="text-noc-label flex-shrink-0">Band steering</span>
              <Dot level={bandSteering ? 'good' : 'warn'} />
              <span className={`font-semibold ${bandSteering ? 'text-noc-accent' : 'text-noc-warning'}`}>
                {bandSteering ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* ── WiFi Network ── */}
            <div className="pt-1 border-t border-noc-border/35">
              <SectionLabel>WiFi Network</SectionLabel>
              <div className="space-y-2.5">
                {(ssids ?? []).map(s => (
                  <div key={s.name} className="flex items-center gap-2 flex-wrap min-w-0">
                    <Lock size={11} className="text-noc-muted/40 flex-shrink-0" />
                    <span className="text-xs font-code font-semibold text-noc-fg w-28 truncate flex-shrink-0">{s.name}</span>
                    <span className="text-xs font-code text-noc-muted flex-1 min-w-0 truncate">
                      {revealed[s.name] ? s.password : '•••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setRevealed(p => ({ ...p, [s.name]: !p[s.name] }))}
                        title={revealed[s.name] ? 'Hide password' : 'Show password'}
                        className="p-1 text-noc-muted hover:text-noc-fg transition-colors cursor-pointer rounded">
                        {revealed[s.name] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button onClick={() => handleSms(s.name)}
                        className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          smsSent[s.name]
                            ? 'border-noc-accent/40 text-noc-accent bg-noc-accent/10'
                            : 'border-noc-border text-noc-muted hover:text-noc-fg'
                        }`}>
                        <MessageSquare size={10} />
                        {smsSent[s.name] ? 'Sent' : 'SMS'}
                      </button>
                      <button onClick={() => handleEmail(s.name)}
                        className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          emailSent[s.name]
                            ? 'border-noc-accent/40 text-noc-accent bg-noc-accent/10'
                            : 'border-noc-border text-noc-muted hover:text-noc-fg'
                        }`}>
                        <Mail size={10} />
                        {emailSent[s.name] ? 'Sent' : 'Email'}
                      </button>
                    </div>
                  </div>
                ))}
                {(!ssids || ssids.length === 0) && (
                  <p className="text-xs text-noc-muted/75">No SSID data available</p>
                )}
              </div>
            </div>

            {/* ── Recommended Actions ── */}
            {recActions.length > 0 && (
              <div className="pt-1 border-t border-noc-border/35">
                <SectionLabel>Recommended Actions</SectionLabel>
                <div className="space-y-1.5 mb-2.5">
                  {recActions.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL[a.level].dot}`} />
                      <span className={LEVEL[a.level].color}>{a.text}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => document.getElementById('zone5')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-noc-border/60 text-noc-fg hover:border-noc-border hover:bg-noc-raised transition-colors cursor-pointer font-semibold"
                >
                  Go to Action Panel →
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ── Floating panels ── */}
      {panels.nodes && (
        <ViewAllNodesPanel devices={devices} onClose={() => toggle('nodes')} />
      )}
      {panels.channelScan && (
        <ChannelScanPanel bands={bands} channelScan={channelScan} onClose={() => toggle('channelScan')} />
      )}
    </>
  )
}
