import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Globe, RefreshCw, Server, Zap, Activity, GripHorizontal, X, Clock, AlertTriangle } from 'lucide-react'
import { parseTierMbps } from '../../../data/mockNetworkDetail'
import { useTheme } from '../../../context/ThemeContext'

// ── Color tokens ──────────────────────────────────────────────────────────────
const LEVEL = {
  good: { color: 'text-noc-accent',  bg: 'bg-noc-accent/10',  border: 'border-noc-accent/20',  dot: 'bg-noc-accent'  },
  warn: { color: 'text-noc-warning', bg: 'bg-noc-warning/10', border: 'border-noc-warning/20', dot: 'bg-noc-warning' },
  bad:  { color: 'text-noc-danger',  bg: 'bg-noc-danger/10',  border: 'border-noc-danger/20',  dot: 'bg-noc-danger'  },
}
const HEX = { good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', info: '#3B82F6', muted: '#94A3B8', border: '#334155' }

// ── Threshold helpers ─────────────────────────────────────────────────────────
function speedLevel(actual, baseline, tier) {
  if (!actual) return null
  if (baseline) {
    const delta   = (baseline - actual) / baseline
    const tierPct = tier ? actual / tier : 1
    if (delta > 0.35 || tierPct < 0.60) return 'bad'
    if (delta > 0.15 || tierPct < 0.80) return 'warn'
    return 'good'
  }
  if (tier) {
    if (actual / tier < 0.60) return 'bad'
    if (actual / tier < 0.80) return 'warn'
  }
  return 'good'
}
function speedLabel(actual, baseline) {
  if (!actual || !baseline) return null
  const delta = (baseline - actual) / baseline
  if (Math.abs(delta) < 0.15) return '✓ Normal'
  if (delta > 0) return `↓ ${Math.round(delta * 100)}% vs avg`
  return `↑ ${Math.round(-delta * 100)}% vs avg`
}
function latLevel(ms)  { return ms == null  ? null : ms  > 100 ? 'bad' : ms  > 40  ? 'warn' : 'good' }
function pktLevel(pct) { return pct == null ? null : pct > 1   ? 'bad' : pct > 0.3 ? 'warn' : 'good' }
function dnsLevel(ms)  { return ms == null  ? null : ms  > 150 ? 'bad' : ms  > 60  ? 'warn' : 'good' }
function rxLevel(dbm)  { return dbm == null ? null : (dbm < -27 || dbm > -7) ? 'bad' : dbm < -22 ? 'warn' : 'good' }

function fmtMbps(n) {
  if (n == null) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(2)} Gbps` : `${n} Mbps`
}

// ── Uptime helpers ─────────────────────────────────────────────────────────
function parseUptimeHours(str) {
  if (!str) return null
  const d = Number((str.match(/(\d+)d/) ?? [])[1] ?? 0)
  const h = Number((str.match(/(\d+)h/) ?? [])[1] ?? 0)
  const m = Number((str.match(/(\d+)m/) ?? [])[1] ?? 0)
  return d * 24 + h + m / 60
}
function uptimeBadge(str) {
  const hrs = parseUptimeHours(str)
  if (hrs === null) return null
  if (hrs < 2)  return { level: 'bad',  label: 'just rebooted' }
  if (hrs < 12) return { level: 'warn', label: 'recently rebooted' }
  return { level: 'good', label: 'stable' }
}

// ── Equipment badge computation — worst signal wins ────────────────────────
function gwBadgeLevel(firmware, uptimeStr, optical, errors) {
  if (firmware && !firmware.upToDate) {
    // Uptime < 2h = bad regardless of firmware
    const ub = uptimeBadge(uptimeStr)
    if (ub?.level === 'bad')  return 'bad'
    // CRC errors = bad
    if ((errors?.crc ?? 0) > 0) return 'bad'
    // Optical out of range = bad
    if (optical?.rxDbm != null && rxLevel(optical.rxDbm) === 'bad') return 'bad'
    return 'warn'
  }
  const ub = uptimeBadge(uptimeStr)
  if (ub?.level === 'bad')                                           return 'bad'
  if ((errors?.crc ?? 0) > 0)                                        return 'bad'
  if (optical?.rxDbm != null && rxLevel(optical.rxDbm) === 'bad')    return 'bad'
  if (ub?.level === 'warn')                                           return 'warn'
  if (optical?.rxDbm != null && rxLevel(optical.rxDbm) === 'warn')   return 'warn'
  if ((errors?.fec ?? 0) > 1000)                                      return 'warn'
  return 'good'
}
function extBadgeLevel(device) {
  if (device.status === 'offline')             return 'bad'
  if (device.backhaul?.quality === 'poor')     return 'bad'
  if (device.status === 'degraded')            return 'warn'
  if (device.backhaul?.quality === 'fair')     return 'warn'
  return 'good'
}

// ── WAN status — Degraded is ALWAYS amber, Offline is red ─────────────────────
function getWanStatus(customer) {
  if (!customer.wan || customer.status === 'offline') return { level: 'bad',  label: 'Offline'   }
  const { packetLoss, latency } = customer.wan
  if ((packetLoss ?? 0) > 0.3 || (latency ?? 0) > 40)  return { level: 'warn', label: 'Degraded'  }
  return                                                         { level: 'good', label: 'Connected' }
}

// ── Primitive UI ──────────────────────────────────────────────────────────────
function Dot({ level, pulse }) {
  if (!level) return null
  return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL[level].dot} ${pulse ? 'animate-pulse' : ''}`} />
}

function SectionLabel({ children }) {
  return <p className="text-[11px] font-semibold text-noc-label uppercase tracking-widest mb-2">{children}</p>
}

function StaleLabel({ mins }) {
  const lvl = mins > 15 ? 'bad' : mins > 10 ? 'warn' : null
  return <span className={`text-xs font-code ${lvl ? LEVEL[lvl].color : 'text-noc-muted'}`}>{mins <= 1 ? 'just now' : `${mins} min ago`}</span>
}

// Universal horizontal row: label · value · optional sub-label · dot
// Used for speed, quality, and equipment — keeps everything on one line.
function MetricRow({ label, value, level, sub, mono = false, badge = null }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-noc-label flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
        <span className={`text-[15px] font-semibold ${mono ? 'font-code' : ''} ${level ? LEVEL[level].color : 'text-noc-fg'} truncate`}>
          {value ?? '—'}
        </span>
        {sub && <span className={`text-xs flex-shrink-0 ${level ? LEVEL[level].color : 'text-noc-muted'}`}>{sub}</span>}
        {badge && (
          <span className="text-xs text-noc-warning border border-noc-warning/40 bg-noc-warning/10 rounded px-1.5 py-px font-medium flex-shrink-0">
            {badge}
          </span>
        )}
        <Dot level={level} />
      </div>
    </div>
  )
}

// IP Stack row — pills instead of a plain value
function IPStackRow({ ipv4, ipv6 }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-noc-label flex-shrink-0">IP Stack</span>
      <div className="flex gap-1.5">
        {[['IPv4', ipv4], ['IPv6', ipv6]].map(([lbl, on]) => (
          <span key={lbl} className={`text-xs font-code font-semibold px-2 py-0.5 rounded border ${
            on ? 'text-noc-accent border-noc-accent/35 bg-noc-accent/10'
               : 'text-noc-muted/40 border-noc-border/50'
          }`}>{lbl}</span>
        ))}
      </div>
    </div>
  )
}

// Speed test in-progress — inline progress bar on same row as label
function SpeedTestRow({ label, active, done }) {
  const [pct, setPct] = useState(done ? 100 : 0)
  useEffect(() => {
    if (!active) { if (done) setPct(100); return }
    const iv = setInterval(() => setPct(p => Math.min(p + 3, 100)), 100)
    return () => clearInterval(iv)
  }, [active, done])
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-noc-label flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-noc-raised rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-100 ${done ? 'bg-noc-accent' : active ? 'bg-noc-info' : 'bg-noc-border/50'}`}
             style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-noc-muted flex-shrink-0 w-14 text-right">
        {done ? '✓ Done' : active ? 'Testing…' : 'Waiting'}
      </span>
    </div>
  )
}

// ── Floating panel shell ──────────────────────────────────────────────────────
function FloatingPanel({ title, subtitle, onClose, defaultX = 500, defaultY = 160, width = 660, children }) {
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
      <div className="px-5 py-5">{children}</div>
    </div>,
    document.body
  )
}

// ── Latency panel ─────────────────────────────────────────────────────────────
function LatencyPanel({ latencyHistory, currentMs }) {
  const { theme }   = useTheme()
  const chartMuted  = theme === 'light' ? '#64748B' : '#94A3B8'
  const chartBorder = theme === 'light' ? '#CBD5E1' : '#334155'
  const dotStroke   = theme === 'light' ? '#FFFFFF' : '#0F172A'
  const valid     = latencyHistory?.filter(d => d.ms > 0) ?? []
  const maxMs     = valid.length ? Math.max(...valid.map(d => d.ms)) : 0
  const avgMs     = valid.length ? Math.round(valid.reduce((s, d) => s + d.ms, 0) / valid.length) : 0
  const lineColor = maxMs > 100 ? HEX.bad : maxMs > 40 ? HEX.warn : HEX.info
  const yMax      = Math.ceil(Math.max(maxMs * 1.25, 60) / 20) * 20
  const xTickSet  = new Set([0, 6, 12, 18, latencyHistory.length - 1])
  const xTicks    = latencyHistory.filter((_, i) => xTickSet.has(i)).map(d => d.time)

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const { time, ms } = payload[0].payload
    const lv = latLevel(ms)
    return (
      <div className="bg-noc-raised border border-noc-border rounded-lg px-3.5 py-2.5 shadow-xl">
        <p className="text-xs text-noc-muted/80 mb-1">{time}</p>
        <p className={`text-lg font-bold font-code ${lv ? LEVEL[lv].color : 'text-noc-fg'}`}>{ms} ms</p>
      </div>
    )
  }

  return (
    <div>
      {/* 3-stat summary */}
      <div className="grid grid-cols-3 gap-3 mb-5 pb-4 border-b border-noc-border/40">
        {[
          { label: 'Current',      val: currentMs ?? '—', lv: latLevel(currentMs) },
          { label: '24h Average',  val: avgMs,             lv: latLevel(avgMs)     },
          { label: '24h Maximum',  val: maxMs,             lv: latLevel(maxMs)     },
        ].map(({ label, val, lv }) => (
          <div key={label} className="bg-noc-raised/40 rounded-lg px-3 py-3">
            <p className="text-xs text-noc-muted mb-1.5">{label}</p>
            <p className={`text-2xl font-bold font-code leading-none ${lv ? LEVEL[lv].color : 'text-noc-fg'}`}>
              {val}<span className="text-sm font-normal ml-1 opacity-70">ms</span>
            </p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={latencyHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={lineColor} stopOpacity={0.28} />
              <stop offset="92%" stopColor={lineColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 4" stroke={chartBorder} strokeOpacity={0.35} vertical={false} />
          <XAxis dataKey="time" ticks={xTicks} interval="preserveStartEnd"
            tick={{ fill: chartMuted, fontSize: 12 }} tickLine={false} axisLine={{ stroke: chartBorder }} />
          <YAxis domain={[0, yMax]} tickCount={6} tickFormatter={v => `${v} ms`}
            tick={{ fill: chartMuted, fontSize: 12 }} tickLine={false} axisLine={false} width={52} />
          <Tooltip content={<Tip />} cursor={{ stroke: chartMuted, strokeWidth: 1, strokeDasharray: '4 4' }} />
          {maxMs > 30 && (
            <ReferenceLine y={40} stroke={HEX.warn} strokeDasharray="6 3" strokeWidth={1.5} strokeOpacity={0.65}
              label={{ value: '40 ms — Warning', position: 'insideTopLeft', fill: HEX.warn, fontSize: 11, dy: -3 }} />
          )}
          {maxMs > 80 && (
            <ReferenceLine y={100} stroke={HEX.bad} strokeDasharray="6 3" strokeWidth={1.5} strokeOpacity={0.65}
              label={{ value: '100 ms — Critical', position: 'insideTopLeft', fill: HEX.bad, fontSize: 11, dy: -3 }} />
          )}
          <Area type="monotone" dataKey="ms" stroke={lineColor} strokeWidth={2.5}
            fill="url(#latGrad)" dot={false}
            activeDot={{ r: 5, fill: lineColor, stroke: dotStroke, strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-6 mt-4 pt-3 border-t border-noc-border/40">
        <div className="flex items-center gap-2">
          <span className="inline-block w-5 h-0.5 rounded" style={{ background: lineColor }} />
          <span className="text-xs text-noc-muted/70">Latency (ms)</span>
        </div>
        {maxMs > 30 && (
          <div className="flex items-center gap-2">
            <span className="inline-block w-5 h-px border-t-2 border-dashed" style={{ borderColor: HEX.warn }} />
            <span className="text-xs text-noc-muted/70">Warning — 40 ms</span>
          </div>
        )}
        {maxMs > 80 && (
          <div className="flex items-center gap-2">
            <span className="inline-block w-5 h-px border-t-2 border-dashed" style={{ borderColor: HEX.bad }} />
            <span className="text-xs text-noc-muted/70">Critical — 100 ms</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Speed history panel ───────────────────────────────────────────────────────
function SpeedHistoryPanel({ speedHistory, baseline, tier }) {
  const rowStatus = (row) => {
    if (!baseline?.down) return null
    const delta = (baseline.down - row.down) / baseline.down
    if (delta > 0.35) return { level: 'bad',  label: 'Critical'   }
    if (delta > 0.15) return { level: 'warn', label: 'Below avg'  }
    return                  { level: 'good', label: 'Normal'     }
  }

  return (
    <div>
      {baseline?.down && (
        <div className="grid grid-cols-2 gap-3 mb-4 p-3.5 rounded-lg bg-noc-raised/50 border border-noc-border/60">
          <div>
            <p className="text-xs text-noc-muted mb-1">30-Day Avg Download</p>
            <p className="text-lg font-bold font-code text-noc-fg/80">{fmtMbps(baseline.down)}</p>
          </div>
          <div>
            <p className="text-xs text-noc-muted mb-1">30-Day Avg Upload</p>
            <p className="text-lg font-bold font-code text-noc-fg/80">{fmtMbps(baseline.up)}</p>
          </div>
        </div>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b border-noc-border/50">
            {['Date', 'Download', 'Upload', 'Latency', 'Status'].map((h, i) => (
              <th key={h} className={`pb-2.5 text-xs font-semibold text-noc-muted ${i === 0 ? 'text-left pr-4' : 'text-right pr-4 last:pr-0'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!speedHistory?.length && (
            <tr><td colSpan={5} className="py-6 text-center text-sm text-noc-muted/40">No history available</td></tr>
          )}
          {(speedHistory ?? []).map((row, i) => {
            const st = rowStatus(row)
            return (
              <tr key={i} className={`border-b border-noc-border/20 last:border-0 ${row.anomaly ? 'bg-noc-danger/5' : i % 2 ? 'bg-noc-raised/15' : ''}`}>
                <td className="py-3 pr-4"><span className={`text-sm font-medium ${row.anomaly ? 'text-noc-danger' : 'text-noc-fg/75'}`}>{row.date}</span></td>
                <td className={`py-3 pr-4 text-right font-code text-sm font-semibold ${row.anomaly ? 'text-noc-danger' : 'text-noc-fg'}`}>{fmtMbps(row.down)}</td>
                <td className={`py-3 pr-4 text-right font-code text-sm font-semibold ${row.anomaly ? 'text-noc-danger' : 'text-noc-fg'}`}>{fmtMbps(row.up)}</td>
                <td className={`py-3 pr-4 text-right font-code text-sm ${row.anomaly ? 'text-noc-danger' : 'text-noc-muted/65'}`}>{row.latency} ms</td>
                <td className="py-3 text-right">
                  {st && <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${LEVEL[st.level].color} ${LEVEL[st.level].bg}`}>{st.label}</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p className="text-xs text-noc-muted/70 mt-4">
        Anomaly threshold: &gt;35% below 30-day average, or &lt;60% of {tier ? `${fmtMbps(tier)} provisioned tier` : 'provisioned tier'}
      </p>
    </div>
  )
}

// ── Connection events panel ───────────────────────────────────────────────────
function ConnectionEventsPanel({ connectionEvents }) {
  return (
    <div className="relative pl-2">
      <div className="absolute left-[19px] top-5 bottom-5 w-px bg-noc-border/50" />
      <div className="space-y-1">
        {!connectionEvents?.length && <p className="text-sm text-noc-muted/40 py-4 pl-10">No events in the last 7 days</p>}
        {(connectionEvents ?? []).map((ev, i) => (
          <div key={i} className="flex items-start gap-4 py-3.5">
            <div className="flex-shrink-0 relative z-10 mt-0.5">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs font-bold ${
                ev.online ? 'bg-noc-accent/15 border-noc-accent text-noc-accent'
                          : 'bg-noc-danger/15 border-noc-danger text-noc-danger'
              }`}>{ev.online ? '✓' : '!'}</span>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-4">
                <p className={`text-sm font-semibold ${ev.online ? 'text-noc-fg' : 'text-noc-danger'}`}>{ev.label}</p>
                {ev.duration && (
                  <span className={`flex-shrink-0 text-xs font-code font-semibold px-2.5 py-1 rounded-md ${
                    ev.online ? 'text-noc-muted/70 bg-noc-raised border border-noc-border'
                              : 'text-noc-danger bg-noc-danger/10 border border-noc-danger/30'
                  }`}>{ev.duration}</span>
                )}
              </div>
              {ev.note && <p className="text-sm text-noc-muted mt-1">{ev.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── All Nodes floating panel ──────────────────────────────────────────────────
function AllNodesPanel({ devices, onClose }) {
  const [query, setQuery] = useState('')
  const nodes    = (devices ?? []).filter(d => d.cat === 'equipment')
  const filtered = query
    ? nodes.filter(d =>
        (d.name     ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (d.type     ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (d.location ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : nodes

  function nodeLevel(d) {
    if (d.status === 'offline')             return 'bad'
    if (d.backhaul?.quality === 'poor')     return 'bad'
    if (d.status === 'degraded')            return 'warn'
    if (d.backhaul?.quality === 'fair')     return 'warn'
    return 'good'
  }
  function backhaulText(d) {
    if (!d.backhaul)                          return '—'
    if (d.backhaul.type === 'ethernet')       return 'Ethernet'
    if (d.backhaul.type === 'wireless-5g')    return 'WiFi 5G'
    if (d.backhaul.type === 'wireless-2.4g')  return 'WiFi 2.4G'
    return d.backhaul.type
  }
  function backhaulLevel(d) {
    if (!d.backhaul) return null
    return d.backhaul.quality === 'good' ? 'good' : d.backhaul.quality === 'fair' ? 'warn' : 'bad'
  }

  const onlineCount = nodes.filter(d => d.status === 'online').length

  return (
    <FloatingPanel
      title="Equipment Nodes"
      subtitle={`${nodes.length} total · ${onlineCount} online`}
      onClose={onClose}
      defaultX={500}
      defaultY={170}
      width={720}
    >
      {/* Search */}
      <div className="relative mb-4">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, type, or location…"
          className="w-full pl-3 pr-8 py-2 text-xs bg-noc-raised border border-noc-border rounded-lg text-noc-fg placeholder-noc-muted/50 focus:outline-none focus:border-noc-info/50 transition-colors"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-noc-muted hover:text-noc-fg cursor-pointer">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Table header */}
      <div className="grid gap-2 pb-2 border-b border-noc-border/60 mb-1"
           style={{ gridTemplateColumns: '2fr 1fr 1.1fr 1.4fr 0.5fr 1fr 1.3fr' }}>
        {['Node', 'Type', 'Status', 'Backhaul', 'Dev', 'Uptime', 'Firmware'].map(h => (
          <span key={h} className="text-[10px] font-semibold text-noc-label uppercase tracking-wide">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {filtered.map(d => {
          const sl = nodeLevel(d)
          const bl = backhaulLevel(d)
          const bt = backhaulText(d)
          return (
            <div key={d.id}
                 className="grid gap-2 py-2 border-b border-noc-border/20 last:border-0 items-center hover:bg-noc-raised/30 rounded px-1 transition-colors"
                 style={{ gridTemplateColumns: '2fr 1fr 1.1fr 1.4fr 0.5fr 1fr 1.3fr' }}>
              <div className="flex items-center gap-2 min-w-0">
                <Dot level={sl} pulse={sl === 'bad'} />
                <span className="text-xs text-noc-fg truncate font-medium">
                  {d.location ? `${d.model} · ${d.location}` : d.name}
                </span>
              </div>
              <span className="text-xs text-noc-label capitalize">{d.type ?? '—'}</span>
              <span className={`text-xs font-semibold ${LEVEL[sl].color}`}>
                {d.status === 'offline' ? 'Offline' : d.status === 'degraded' ? 'Degraded' : 'Online'}
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`text-xs truncate ${bl ? LEVEL[bl].color : 'text-noc-label'}`}>{bt}</span>
                {bl && <Dot level={bl} />}
              </div>
              <span className="text-xs font-code text-noc-fg">{d.clientCount ?? '—'}</span>
              <span className="text-xs font-code text-noc-label">{d.uptime ?? '—'}</span>
              <span className={`text-xs ${
                d.firmware
                  ? d.firmware.upToDate
                    ? 'text-noc-accent'
                    : 'text-noc-warning'
                  : 'text-noc-fg/30'
              }`}>
                {d.firmware
                  ? d.firmware.upToDate
                    ? 'Up to date'
                    : `→ ${d.firmware.latest}`
                  : '—'}
              </span>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-noc-fg/40 py-4 text-center">No nodes match "{query}"</p>
        )}
      </div>
    </FloatingPanel>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Zone3WANHealth({ customer, wan, wanExtended, devices, pollNow, lastPolledMins }) {
  const [testRunning, setTestRunning] = useState(false)
  const [testPhase,   setTestPhase]   = useState('dl')   // 'dl' | 'ul' | 'done'
  const [polling,     setPolling]     = useState(false)
  const [panels,      setPanels]      = useState({ latency: false, history: false, events: false, allNodes: false })

  const wanStatus = getWanStatus(customer)
  const statusCfg = LEVEL[wanStatus.level]
  const tier      = parseTierMbps(customer.serviceLevel)
  const staleMins = lastPolledMins ?? 8

  const { latencyHistory, dnsMs, ipv4, ipv6, firmware, optical, errors,
          baseline, liveUsageMbps, speedHistory, connectionEvents } = wanExtended ?? {}

  const dlLvl   = speedLevel(wan?.speedDown, baseline?.down, tier)
  const dlLabel = speedLabel(wan?.speedDown, baseline?.down)
  const ulLvl   = speedLevel(wan?.speedUp,   baseline?.up,   tier)
  const ulLabel = speedLabel(wan?.speedUp,   baseline?.up)

  const usagePct = liveUsageMbps && tier ? Math.round(liveUsageMbps / tier * 100) : null
  const lastTest = speedHistory?.[0]?.date ?? null

  // ── Equipment derived data ─────────────────────────────────────────────────
  const equipmentNodes   = (devices ?? []).filter(d => d.cat === 'equipment')
  const gwDevice         = equipmentNodes.find(d => d.type === 'gateway')
  const extenders        = equipmentNodes.filter(d => d.type === 'extender')
  const gwUptime         = gwDevice?.uptime ?? customer.uptime
  const gwUptimeBadge    = uptimeBadge(gwUptime)
  const gwLevel          = gwBadgeLevel(firmware, gwUptime, optical, errors)
  const problemExtenders = extenders.filter(d => extBadgeLevel(d) !== 'good')
  const healthyExtCount  = extenders.length - problemExtenders.length

  function handlePoll() { setPolling(true); setTimeout(() => { setPolling(false); pollNow?.() }, 1800) }
  function handleSpeedTest() {
    setTestRunning(true); setTestPhase('dl')
    setTimeout(() => setTestPhase('ul'), 3500)
    setTimeout(() => { setTestPhase('done'); setTimeout(() => setTestRunning(false), 800) }, 7000)
  }
  const toggle = (key) => setPanels(p => ({ ...p, [key]: !p[key] }))

  return (
    <div className="bg-noc-surface border border-noc-border rounded-xl overflow-hidden h-full flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-noc-border bg-noc-raised/30">
        <div className="flex items-center gap-2.5">
          <Globe size={14} className="text-noc-info" />
          <span className="text-sm font-semibold text-noc-fg">Internet · WAN</span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
            <Dot level={wanStatus.level} pulse={wanStatus.level === 'good'} />
            {wanStatus.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Activity size={11} className="text-noc-muted" />
            <StaleLabel mins={polling ? 0 : staleMins} />
          </div>
          <button onClick={handlePoll} disabled={polling}
            className="flex items-center gap-1.5 text-xs text-noc-muted hover:text-noc-fg transition-colors cursor-pointer disabled:opacity-40">
            <RefreshCw size={11} className={polling ? 'animate-spin' : ''} />
            Poll Now
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3 flex-1 overflow-y-auto scrollbar-dark">

        {/* ══ SPEED ════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <SectionLabel>Speed</SectionLabel>
            <button onClick={handleSpeedTest} disabled={testRunning || customer.status === 'offline'}
              className="flex items-center gap-1.5 text-xs text-noc-info hover:text-noc-info/80 disabled:opacity-40 cursor-pointer transition-colors">
              <Zap size={11} />{testRunning ? 'Testing…' : 'Run Speed Test'}
            </button>
          </div>

          {/* Download | Upload — same row, two columns */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {testRunning ? (
              <>
                <SpeedTestRow label="Download" active={testPhase === 'dl'} done={testPhase === 'ul' || testPhase === 'done'} />
                <SpeedTestRow label="Upload"   active={testPhase === 'ul'} done={testPhase === 'done'} />
              </>
            ) : (
              <>
                <MetricRow label="Download" value={fmtMbps(wan?.speedDown)} level={dlLvl} sub={dlLabel} mono />
                <MetricRow label="Upload"   value={fmtMbps(wan?.speedUp)}   level={ulLvl} sub={ulLabel} mono />
              </>
            )}
            {liveUsageMbps != null && tier != null && (
              <MetricRow
                label="Live Usage"
                value={`${liveUsageMbps} Mbps`}
                sub={`${usagePct}% of ${fmtMbps(tier)} tier`}
                level={usagePct > 70 ? 'warn' : null}
                mono
              />
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-3">
            {baseline?.down && (
              <p className="text-xs text-noc-muted/70 font-code">
                30-day avg — {fmtMbps(baseline.down)} ↓ · {fmtMbps(baseline.up)} ↑
              </p>
            )}
            {lastTest && <p className="text-xs text-noc-muted/65">Last test: {lastTest}</p>}
          </div>
        </div>

        <div className="border-t border-noc-border/35" />

        {/* ══ CONNECTION QUALITY ════════════════════════════════════ */}
        <div>
          <SectionLabel>Connection Quality</SectionLabel>
          {/* Latency | Packet Loss / DNS Response | IP Stack — same rows */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <MetricRow label="Latency"      value={wan?.latency    != null ? `${wan.latency} ms`   : null} level={latLevel(wan?.latency)}    mono />
            <MetricRow label="Packet Loss"  value={wan?.packetLoss != null ? `${wan.packetLoss}%`  : null} level={pktLevel(wan?.packetLoss)}  mono />
            <MetricRow label="DNS Response" value={dnsMs           != null ? `${dnsMs} ms`         : null} level={dnsLevel(dnsMs)}            mono />
            <IPStackRow ipv4={ipv4} ipv6={ipv6} />
          </div>
        </div>

        <div className="border-t border-noc-border/35" />

        {/* ══ EQUIPMENT ════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Server size={11} className="text-noc-label" />
            <SectionLabel>Gateway Equipment</SectionLabel>
          </div>

          {/* ── Equipment rows ── */}
          <div className="space-y-3">

            {/* GATEWAY */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Dot level={gwLevel} pulse={gwLevel === 'bad'} />
                <span className="text-sm font-semibold text-noc-fg">
                  Gateway — {gwDevice?.model ?? customer.deviceModel ?? 'Unknown'}
                </span>
              </div>
              {/* Always-visible: Serial + Uptime */}
              <div className="ml-[18px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-noc-label flex-shrink-0">Serial</span>
                  <span className="text-noc-fg font-code truncate">{gwDevice?.serial ?? customer.serial ?? '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-noc-label flex-shrink-0">Uptime</span>
                  <span className={gwUptimeBadge && gwUptimeBadge.level !== 'good' ? LEVEL[gwUptimeBadge.level].color : 'text-noc-fg'}>
                    {gwUptime ?? '—'}
                  </span>
                </div>
                {/* Firmware (col 1) + Errors (col 2) — same row */}
                {firmware && !firmware.upToDate && (
                  <div className="flex items-center gap-1.5 text-xs min-w-0">
                    <span className="text-noc-label flex-shrink-0">Firmware</span>
                    <AlertTriangle size={10} className="text-noc-warning flex-shrink-0" />
                    <span className="text-noc-warning truncate">{firmware.current} → {firmware.latest}</span>
                    <button
                      onClick={() => document.getElementById('zone5')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded border border-noc-border/60 text-noc-fg hover:border-noc-border hover:bg-noc-raised transition-colors cursor-pointer"
                    >
                      Upgrade →
                    </button>
                  </div>
                )}
                {errors && ((errors.crc ?? 0) > 0 || (errors.fec ?? 0) > 1000) && (
                  <div className="flex items-center gap-1.5 text-xs min-w-0">
                    <span className="text-noc-label flex-shrink-0">Errors</span>
                    <AlertTriangle size={10} className={(errors.crc ?? 0) > 0 ? 'text-noc-danger flex-shrink-0' : 'text-noc-warning flex-shrink-0'} />
                    <span className={(errors.crc ?? 0) > 0 ? 'text-noc-danger truncate' : 'text-noc-warning truncate'}>
                      {(errors.crc ?? 0) > 0 ? `${errors.crc} CRC` : ''}
                      {(errors.crc ?? 0) > 0 && (errors.fec ?? 0) > 0 ? ' · ' : ''}
                      {(errors.fec ?? 0) > 0 ? `${errors.fec.toLocaleString()} FEC/hr` : ''}
                    </span>
                  </div>
                )}
                {optical?.rxDbm != null && rxLevel(optical.rxDbm) !== 'good' && (
                  <div className="flex items-center gap-1.5 text-xs col-span-2">
                    <span className="text-noc-label flex-shrink-0">Optical Rx</span>
                    <AlertTriangle size={10} className={`${LEVEL[rxLevel(optical.rxDbm)].color} flex-shrink-0`} />
                    <span className={LEVEL[rxLevel(optical.rxDbm)].color}>
                      {optical.rxDbm.toFixed(1)} dBm — {rxLevel(optical.rxDbm) === 'bad' ? 'out of range' : 'marginal'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PROBLEM EXTENDERS */}
            {problemExtenders.map((d, idx) => {
              const el = extBadgeLevel(d)
              const bt = d.backhaul?.type === 'ethernet'       ? 'Ethernet'
                       : d.backhaul?.type === 'wireless-5g'    ? 'WiFi 5G'
                       : d.backhaul?.type === 'wireless-2.4g'  ? 'WiFi 2.4G' : null
              const bl = d.backhaul?.quality === 'good' ? 'good' : d.backhaul?.quality === 'fair' ? 'warn' : 'bad'
              const extUptimeBadge = uptimeBadge(d.uptime)
              // Show All nodes inline on the last extender's uptime row when no healthy extenders
              const isLast = idx === problemExtenders.length - 1
              const showAllNodes = isLast && healthyExtCount === 0 && extenders.length > 0
              return (
                <div key={d.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <Dot level={el} pulse={el === 'bad'} />
                    <span className="text-sm font-semibold text-noc-fg">
                      Extender · {d.location ?? d.model}
                    </span>
                  </div>
                  <div className="ml-[18px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {d.status === 'offline' && (
                      <div className="flex items-center gap-1.5 text-xs col-span-2">
                        <span className="text-noc-label flex-shrink-0">Status</span>
                        <AlertTriangle size={10} className="text-noc-danger flex-shrink-0" />
                        <span className="text-noc-danger">Offline</span>
                        <button
                          onClick={() => document.getElementById('zone5')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          className="ml-auto flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded border border-noc-border/60 text-noc-fg hover:border-noc-border hover:bg-noc-raised transition-colors cursor-pointer"
                        >
                          Action Panel →
                        </button>
                      </div>
                    )}
                    {bt && bl !== 'good' && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-noc-label flex-shrink-0">Backhaul</span>
                        <AlertTriangle size={10} className={`${LEVEL[bl].color} flex-shrink-0`} />
                        <span className={LEVEL[bl].color}>{bt}{d.rssi ? ` (${d.rssi} dBm)` : ''}</span>
                      </div>
                    )}
                    {/* Uptime row — spans full width when hosting the All nodes button */}
                    {(d.uptime || showAllNodes) && (
                      <div className={`flex items-center gap-1.5 text-xs${showAllNodes ? ' col-span-2' : ''}`}>
                        <span className="text-noc-label flex-shrink-0">Uptime</span>
                        <span className={extUptimeBadge && extUptimeBadge.level !== 'good' ? LEVEL[extUptimeBadge.level].color : 'text-noc-fg'}>
                          {d.uptime ?? '—'}
                        </span>
                        {showAllNodes && (
                          <button onClick={() => toggle('allNodes')}
                            className={`ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                              panels.allNodes
                                ? 'text-noc-info border-noc-info/40 bg-noc-info/10'
                                : 'text-noc-label border-noc-border/60 hover:text-noc-fg hover:border-noc-border bg-noc-raised/30'
                            }`}>
                            <Server size={10} />↗ All nodes ({equipmentNodes.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* HEALTHY EXTENDERS grouped — only shown when there are healthy extenders */}
            {extenders.length > 0 && healthyExtCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dot level="good" />
                  <span className="text-sm text-noc-fg">
                    {healthyExtCount} {healthyExtCount === 1 ? 'extender' : 'extenders'} healthy
                  </span>
                </div>
                <button onClick={() => toggle('allNodes')}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                    panels.allNodes
                      ? 'text-noc-info border-noc-info/40 bg-noc-info/10'
                      : 'text-noc-label border-noc-border/60 hover:text-noc-fg hover:border-noc-border bg-noc-raised/30'
                  }`}>
                  <Server size={10} />↗ All nodes ({equipmentNodes.length})
                </button>
              </div>
            )}
            {/* All extenders healthy, no problem extenders — still show All nodes */}
            {extenders.length > 0 && problemExtenders.length === 0 && (
              <div className="flex justify-end">
                <button onClick={() => toggle('allNodes')}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                    panels.allNodes
                      ? 'text-noc-info border-noc-info/40 bg-noc-info/10'
                      : 'text-noc-label border-noc-border/60 hover:text-noc-fg hover:border-noc-border bg-noc-raised/30'
                  }`}>
                  <Server size={10} />↗ All nodes ({equipmentNodes.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ DIAGNOSTIC PANEL LAUNCHERS ═══════════════════════════ */}
        <div className="border-t border-noc-border/35 pt-3 flex items-center gap-2 flex-wrap">
          {[
            { key: 'latency', label: 'Latency 24h',      icon: Activity },
            { key: 'history', label: 'Speed History',     icon: Zap      },
            { key: 'events',  label: 'Connection Events', icon: Clock    },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                panels[key]
                  ? 'text-noc-info border-noc-info/40 bg-noc-info/10'
                  : 'text-noc-label border-noc-border/60 hover:text-noc-fg hover:border-noc-border bg-noc-raised/30'
              }`}>
              <Icon size={10} />↗ {label}
            </button>
          ))}
        </div>

      </div>

      {/* ── Floating panels ── */}
      {panels.latency && latencyHistory && (
        <FloatingPanel title="Latency · Last 24 Hours"
          subtitle="Round-trip time from gateway to ISP backbone — measured hourly"
          onClose={() => toggle('latency')} defaultX={500} defaultY={140} width={660}>
          <LatencyPanel latencyHistory={latencyHistory} currentMs={wan?.latency} />
        </FloatingPanel>
      )}
      {panels.history && (
        <FloatingPanel title="Speed Test History"
          subtitle={`vs. 30-day customer baseline · ${customer.serviceLevel ?? 'Unknown tier'}`}
          onClose={() => toggle('history')} defaultX={500} defaultY={180} width={680}>
          <SpeedHistoryPanel speedHistory={speedHistory} baseline={baseline} tier={tier} />
        </FloatingPanel>
      )}
      {panels.events && (
        <FloatingPanel title="Connection Events · Last 7 Days"
          subtitle="Gateway online / offline history with outage duration"
          onClose={() => toggle('events')} defaultX={500} defaultY={220} width={580}>
          <ConnectionEventsPanel connectionEvents={connectionEvents} />
        </FloatingPanel>
      )}
      {panels.allNodes && equipmentNodes.length > 0 && (
        <AllNodesPanel devices={devices} onClose={() => toggle('allNodes')} />
      )}

    </div>
  )
}
