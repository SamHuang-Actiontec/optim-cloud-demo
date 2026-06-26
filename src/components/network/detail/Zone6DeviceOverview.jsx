import { useState, useMemo } from 'react'
import {
  Search, X, Layers, Globe,
  ArrowUp, ArrowDown, ChevronsUpDown, Network, ChevronRight, ChevronDown,
  RefreshCw,
} from 'lucide-react'

// ── Color system ──────────────────────────────────────────────────────────────
const LEVEL = {
  good: { color: 'text-noc-accent',  bg: 'bg-noc-accent/8',   border: 'border-noc-accent/20',  dot: 'bg-noc-accent'  },
  warn: { color: 'text-noc-warning', bg: 'bg-noc-warning/8',  border: 'border-noc-warning/20', dot: 'bg-noc-warning' },
  bad:  { color: 'text-noc-danger',  bg: 'bg-noc-danger/8',   border: 'border-noc-danger/20',  dot: 'bg-noc-danger'  },
}

function rssiLevel(dbm) {
  if (dbm == null) return null
  if (dbm >= -65) return 'good'
  if (dbm >= -75) return 'warn'
  return 'bad'
}

function timeScore(s) {
  if (!s || s === '—') return -9999
  if (s === 'now') return 0
  const m = s.match(/(\d+)m/)
  if (m) return -parseInt(m[1])
  const h = s.match(/(\d+)h/)
  if (h) return -parseInt(h[1]) * 60
  const d = s.match(/(\d+)d/)
  if (d) return -parseInt(d[1]) * 1440
  return -9999
}

// ── Hardware device icons ─────────────────────────────────────────────────────
// Gateway: front-view of ISP router chassis with LEDs + ports + antennas
function GatewayHardwareIcon({ size = 56, statusColor = '#22c55e' }) {
  return (
    <svg width={size} height={Math.round(size * 0.72)} viewBox="0 0 72 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Antennas */}
      <rect x="10" y="0" width="4" height="17" rx="2" fill="#475569"/>
      <rect x="10" y="0" width="4" height="5"  rx="2" fill="#64748b"/>
      <rect x="58" y="0" width="4" height="17" rx="2" fill="#475569"/>
      <rect x="58" y="0" width="4" height="5"  rx="2" fill="#64748b"/>
      {/* Drop shadow */}
      <rect x="4" y="18" width="66" height="31" rx="5" fill="rgba(0,0,0,0.3)"/>
      {/* Main chassis body */}
      <rect x="1" y="14" width="70" height="30" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
      {/* Top edge highlight (3D depth) */}
      <rect x="1" y="14" width="70" height="8" rx="5" fill="#253448"/>
      {/* LED indicators — left cluster */}
      <circle cx="10" cy="29" r="2.5" fill={statusColor}/>
      <circle cx="17" cy="29" r="2.5" fill={statusColor} opacity="0.8"/>
      <circle cx="24" cy="29" r="2.5" fill="#3b82f6"/>
      <circle cx="31" cy="29" r="2.5" fill="#f59e0b" opacity="0.6"/>
      {/* Port area */}
      <rect x="40" y="19" width="27" height="19" rx="2" fill="#0f172a"/>
      {/* Ethernet ports (2 rows of 3) */}
      <rect x="42" y="21" width="6" height="5" rx="0.5" fill="#162032" stroke="#2d4a6a" strokeWidth="0.5"/>
      <rect x="50" y="21" width="6" height="5" rx="0.5" fill="#162032" stroke="#2d4a6a" strokeWidth="0.5"/>
      <rect x="58" y="21" width="6" height="5" rx="0.5" fill="#162032" stroke="#2d4a6a" strokeWidth="0.5"/>
      <rect x="42" y="28" width="6" height="5" rx="0.5" fill="#162032" stroke="#2d4a6a" strokeWidth="0.5"/>
      <rect x="50" y="28" width="6" height="5" rx="0.5" fill="#162032" stroke="#2d4a6a" strokeWidth="0.5"/>
      <rect x="58" y="28" width="6" height="5" rx="0.5" fill="#2d4a6a"/>
      {/* Ventilation slots bottom strip */}
      <rect x="2" y="36" width="33" height="7" rx="0" fill="#162032"/>
      {[4,8,12,16,20,24,28].map(x => (
        <rect key={x} x={x} y={38} width="2" height="3" rx="0.5" fill="#243447"/>
      ))}
    </svg>
  )
}

// Extender: compact mesh node with single antenna
function ExtenderHardwareIcon({ size = 44, statusColor = '#22c55e' }) {
  return (
    <svg width={size} height={Math.round(size * 0.84)} viewBox="0 0 54 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Single center antenna */}
      <rect x="24" y="0" width="4" height="15" rx="2" fill="#475569"/>
      <rect x="24" y="0" width="4" height="5"  rx="2" fill="#64748b"/>
      {/* Drop shadow */}
      <rect x="3" y="16" width="50" height="29" rx="5" fill="rgba(0,0,0,0.3)"/>
      {/* Main chassis */}
      <rect x="1" y="12" width="52" height="28" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
      {/* Top edge highlight */}
      <rect x="1" y="12" width="52" height="8" rx="5" fill="#253448"/>
      {/* LED indicators */}
      <circle cx="9"  cy="26" r="2.5" fill={statusColor}/>
      <circle cx="16" cy="26" r="2.5" fill={statusColor} opacity="0.8"/>
      <circle cx="23" cy="26" r="2.5" fill="#3b82f6"/>
      {/* Port area */}
      <rect x="32" y="17" width="18" height="17" rx="2" fill="#0f172a"/>
      <rect x="34" y="20" width="6" height="5" rx="0.5" fill="#162032" stroke="#2d4a6a" strokeWidth="0.5"/>
      <rect x="42" y="20" width="6" height="5" rx="0.5" fill="#162032" stroke="#2d4a6a" strokeWidth="0.5"/>
      <rect x="34" y="27" width="6" height="4" rx="0.5" fill="#162032" stroke="#2d4a6a" strokeWidth="0.5"/>
      <rect x="42" y="27" width="6" height="4" rx="0.5" fill="#2d4a6a"/>
      {/* Ventilation */}
      <rect x="2" y="33" width="24" height="6" rx="0" fill="#162032"/>
      {[4,8,12,16,20].map(x => (
        <rect key={x} x={x} y={35} width="2" height="2.5" rx="0.5" fill="#243447"/>
      ))}
    </svg>
  )
}

// ── StatusDot ────────────────────────────────────────────────────────────────
function StatusDot({ status, rssi, pulse = false, size = 'w-2 h-2' }) {
  let level = 'good'
  if (status === 'offline') level = 'bad'
  else if (status === 'degraded') level = 'warn'
  else if (rssi != null) level = rssiLevel(rssi) ?? 'good'
  const cfg = LEVEL[level]
  return (
    <span className="relative inline-flex flex-shrink-0 items-center justify-center">
      <span className={`inline-block rounded-full ${size} ${cfg.dot}`} />
      {pulse && level === 'bad' && (
        <span className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-60`} />
      )}
    </span>
  )
}

// ── PopRow ────────────────────────────────────────────────────────────────────
function PopRow({ label, value, level, note, mono = false }) {
  const cfg = level ? LEVEL[level] : null
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-2xs text-noc-muted">{label}</span>
      <div className="flex items-center gap-1.5">
        {note && <span className="text-2xs text-noc-muted">{note}</span>}
        <span className={`text-2xs font-medium ${cfg ? cfg.color : 'text-noc-fg'} ${mono ? 'font-code' : ''}`}>
          {value}
        </span>
      </div>
    </div>
  )
}

// ── Simple gateway/extender icon (small strip version) ────────────────────────
function SmallGatewayIcon({ className = '' }) {
  return (
    <svg width="12" height="10" viewBox="0 0 72 52" fill="none" className={className}>
      <rect x="10" y="0" width="4" height="17" rx="2" fill="currentColor" opacity="0.6"/>
      <rect x="58" y="0" width="4" height="17" rx="2" fill="currentColor" opacity="0.6"/>
      <rect x="1" y="14" width="70" height="30" rx="5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2"/>
      <rect x="1" y="14" width="70" height="10" rx="5" fill="currentColor" opacity="0.15"/>
      <circle cx="12" cy="29" r="3.5" fill="currentColor" opacity="0.8"/>
      <circle cx="21" cy="29" r="3.5" fill="currentColor" opacity="0.5"/>
      <rect x="40" y="19" width="27" height="19" rx="2" fill="currentColor" opacity="0.1"/>
    </svg>
  )
}

function SmallExtenderIcon({ className = '' }) {
  return (
    <svg width="12" height="10" viewBox="0 0 54 46" fill="none" className={className}>
      <rect x="24" y="0" width="4" height="15" rx="2" fill="currentColor" opacity="0.6"/>
      <rect x="1" y="12" width="52" height="28" rx="5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2"/>
      <rect x="1" y="12" width="52" height="10" rx="5" fill="currentColor" opacity="0.15"/>
      <circle cx="10" cy="26" r="3.5" fill="currentColor" opacity="0.8"/>
      <circle cx="19" cy="26" r="3.5" fill="currentColor" opacity="0.5"/>
    </svg>
  )
}

// ── Equipment Strip ───────────────────────────────────────────────────────────
function EquipmentStrip({ equipment }) {
  const [openId, setOpenId] = useState(null)
  if (!equipment.length) return null

  return (
    <div className="px-4 py-3 border-b border-noc-border bg-noc-raised/20">
      <p className="text-2xs font-semibold text-noc-muted uppercase tracking-wide mb-2.5">Network Backbone</p>
      <div className="flex items-start gap-1 flex-wrap">
        {equipment.map((eq, i) => {
          const level = eq.status === 'offline' ? 'bad' : eq.status === 'degraded' ? 'warn' : 'good'
          const cfg = LEVEL[level]
          const isOpen = openId === eq.id
          const bhColor = eq.backhaul?.quality === 'poor' ? '#EF4444'
                        : eq.backhaul?.quality === 'fair' ? '#F59E0B' : '#334155'
          const bhLabel = eq.backhaul?.type === 'ethernet' ? 'ETH'
                        : eq.backhaul?.type === 'wireless-5g' ? '5G' : eq.backhaul ? '2.4G' : null

          return (
            <div key={eq.id} className="flex items-center gap-1">
              {i > 0 && (
                <div className="flex flex-col items-center gap-0.5 px-1">
                  <div className="w-8 h-px" style={{ background: bhColor }} />
                  {bhLabel && <span className="font-code text-noc-muted/70" style={{ fontSize: '9px' }}>{bhLabel}</span>}
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setOpenId(isOpen ? null : eq.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border cursor-pointer transition-all hover:opacity-90 ${cfg.border} ${cfg.bg}`}
                >
                  <div className="flex items-center gap-1.5">
                    {eq.type === 'gateway'
                      ? <SmallGatewayIcon className={cfg.color} />
                      : <SmallExtenderIcon className={cfg.color} />}
                    <span className="text-xs font-semibold text-noc-fg">
                      {eq.location ?? (eq.type === 'gateway' ? 'Gateway' : 'Extender')}
                    </span>
                    <StatusDot status={eq.status} pulse={eq.status === 'offline'} size="w-1.5 h-1.5" />
                  </div>
                  <span className="text-2xs text-noc-muted font-code">{eq.model}</span>
                  <div className="flex items-center gap-2">
                    {eq.firmware && (
                      <span className={`text-2xs font-code ${eq.firmware.upToDate ? 'text-noc-accent' : 'text-noc-warning'}`}>
                        FW {eq.firmware.current} {eq.firmware.upToDate ? '✓' : '⚠'}
                      </span>
                    )}
                    {eq.status === 'offline'
                      ? <span className="text-2xs text-noc-danger font-semibold">Offline</span>
                      : eq.uptime && <span className="text-2xs text-noc-muted">{eq.uptime}</span>}
                  </div>
                </button>

                {isOpen && (
                  <div className="absolute top-full left-0 mt-1 z-20 w-56 bg-noc-raised border border-noc-border rounded-lg shadow-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-noc-fg">{eq.model}</span>
                      <button onClick={() => setOpenId(null)} className="text-noc-muted hover:text-noc-fg cursor-pointer"><X size={11} /></button>
                    </div>
                    <PopRow label="Status"   value={eq.status}   level={level} />
                    {eq.uptime    && <PopRow label="Uptime"   value={eq.uptime}  mono />}
                    {eq.firmware  && (
                      <PopRow label="Firmware" value={eq.firmware.current}
                        level={eq.firmware.upToDate ? 'good' : 'warn'}
                        note={!eq.firmware.upToDate ? `→ ${eq.firmware.latest}` : undefined} mono />
                    )}
                    {eq.rxDbm != null && (
                      <PopRow label="Opt Rx" value={`${eq.rxDbm.toFixed(1)} dBm`}
                        level={eq.rxDbm > -22 ? 'good' : eq.rxDbm > -27 ? 'warn' : 'bad'} mono />
                    )}
                    {eq.backhaul  && (
                      <PopRow label="Backhaul" value={eq.backhaul.type}
                        level={eq.backhaul.quality === 'poor' ? 'bad' : eq.backhaul.quality === 'fair' ? 'warn' : 'good'} />
                    )}
                    {eq.mac && <PopRow label="MAC" value={eq.mac} mono />}
                    <div className="pt-1 space-y-1">
                      {eq.status !== 'online' && (
                        <button className="w-full py-1.5 text-2xs font-semibold text-noc-info bg-noc-info/10 hover:bg-noc-info/20 border border-noc-info/20 rounded cursor-pointer transition-colors">
                          ↑ Add Reboot to Action Panel
                        </button>
                      )}
                      {eq.firmware && !eq.firmware.upToDate && eq.status === 'online' && (
                        <button className="w-full py-1.5 text-2xs font-semibold text-noc-warning bg-noc-warning/10 hover:bg-noc-warning/20 border border-noc-warning/20 rounded cursor-pointer transition-colors">
                          Schedule Firmware Upgrade →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {openId && <div className="fixed inset-0 z-10" onClick={() => setOpenId(null)} />}
    </div>
  )
}

// ── Sortable column header ────────────────────────────────────────────────────
function SortableHeader({ label, col, sortCol, sortDir, onSort, className = '', title }) {
  const active = sortCol === col
  return (
    <th
      onClick={() => onSort(col)}
      title={title}
      className={`py-2 pr-3 text-left text-2xs font-semibold uppercase tracking-wide cursor-pointer select-none transition-colors
        ${active ? 'text-noc-info' : 'text-noc-muted hover:text-noc-fg'} ${className}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? (sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)
          : <ChevronsUpDown size={10} className="opacity-0 group-hover:opacity-40" />}
      </div>
    </th>
  )
}

// ── RSSI bar ──────────────────────────────────────────────────────────────────
function RSSIBar({ dbm }) {
  if (dbm == null) return <span className="text-2xs text-noc-muted/40">—</span>
  const level = rssiLevel(dbm)
  const cfg = LEVEL[level]
  const pct = Math.max(6, Math.min(100, ((dbm + 90) / 60) * 100))
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-noc-border overflow-hidden">
        <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-2xs font-code font-semibold ${cfg.color} w-[52px] text-right shrink-0`}>
        {dbm} dBm
      </span>
    </div>
  )
}

// ── Usage bar ─────────────────────────────────────────────────────────────────
function UsageBar({ mbps, maxMbps }) {
  if (mbps == null) return <span className="text-2xs text-noc-muted/40">—</span>
  const pct = maxMbps > 0 ? Math.min(100, (mbps / maxMbps) * 100) : 0
  const isHigh = mbps >= 10
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-noc-border overflow-hidden">
        <div className={`h-full rounded-full ${isHigh ? 'bg-noc-warning' : 'bg-noc-info/60'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-2xs font-code text-noc-fg w-[52px] text-right shrink-0">
        {mbps === 0 ? '0.0' : mbps < 0.1 ? '<0.1' : mbps.toFixed(1)} M
      </span>
    </div>
  )
}

// ── KV ────────────────────────────────────────────────────────────────────────
function KV({ label, value, mono = false, level }) {
  const cfg = level ? LEVEL[level] : null
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-noc-muted/70">{label}</span>
      <span className={`font-medium ${cfg ? cfg.color : 'text-noc-fg'} ${mono ? 'font-code' : ''}`}>{value}</span>
    </div>
  )
}

// ── Client row ────────────────────────────────────────────────────────────────
function ClientRow({ device, maxUsage, showUsage }) {
  const [open, setOpen] = useState(false)
  const rLevel = rssiLevel(device.rssi)

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        className="border-b border-noc-border/30 cursor-pointer hover:bg-noc-raised/40 transition-colors"
      >
        <td className="py-2 pl-4 pr-1 w-10">
          <div className="flex items-center gap-1">
            {open
              ? <ChevronDown size={11} className="text-noc-muted/50 shrink-0" />
              : <ChevronRight size={11} className="text-noc-muted/30 shrink-0" />}
            <StatusDot status={device.status} rssi={device.rssi} />
          </div>
        </td>
        {/* Name + MAC inline */}
        <td className="py-2 pr-3">
          <span className="text-sm text-noc-fg font-medium">{device.name}</span>
          {device.mac && (
            <div className="text-2xs font-code text-noc-muted leading-tight">{device.mac}</div>
          )}
        </td>
        <td className="py-2 pr-3 hidden sm:table-cell">
          <span className="text-xs text-noc-muted">{device.connectedTo ?? '—'}</span>
        </td>
        <td className="py-2 pr-3">
          <span className="text-xs font-code text-noc-fg">{device.band ?? '—'}</span>
        </td>
        <td className="py-2 pr-3 hidden md:table-cell">
          <RSSIBar dbm={device.rssi} />
        </td>
        {showUsage && (
          <td className="py-2 pr-3 hidden lg:table-cell">
            <UsageBar mbps={device.usageMbps} maxMbps={maxUsage} />
          </td>
        )}
        <td className="py-2 pr-4 hidden sm:table-cell">
          <span className="text-xs text-noc-muted">{device.lastSeen ?? '—'}</span>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-noc-border/30">
          <td colSpan={6 + (showUsage ? 1 : 0)} className="px-4 pb-3 pt-1">
            <div className="bg-noc-raised/40 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-1 text-xs">
              {device.mac          && <KV label="MAC"         value={device.mac}               mono />}
              {device.band         && <KV label="Band"        value={device.band} />}
              {device.rssi != null && <KV label="RSSI"        value={`${device.rssi} dBm`}     mono level={rLevel ?? undefined} />}
              {device.connectedTo  && <KV label="Node"        value={device.connectedTo} />}
              {device.lastSeen     && <KV label="Last active" value={device.lastSeen} />}
              {device.usageMbps != null && <KV label="Usage"  value={`${device.usageMbps.toFixed(1)} Mbps`} />}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Band color mapping (matching reference UX) ────────────────────────────────
const BAND_CFG = [
  { key: '2.4G',     label: '2.4GHz', color: 'text-amber-400',  filter: c => c.band === '2.4G' },
  { key: '5G',       label: '5GHz',   color: 'text-purple-400', filter: c => c.band === '5G' },
  { key: '6G',       label: '6GHz',   color: 'text-cyan-400',   filter: c => c.band === '6G' },
  { key: 'ETH',      label: 'ETH',    color: 'text-noc-accent', filter: c => c.band === 'Ethernet' || c.band === 'ETH' },
  { key: 'MLO',      label: 'MLO',    color: 'text-noc-muted/30', filter: () => false },
]

// ── Topology: Node card ───────────────────────────────────────────────────────
function TopologyNodeCard({ node, clients, showDetails, searchQuery, selectedNode, onSelect, isGateway = false }) {
  const level = node.status === 'offline' ? 'bad' : node.status === 'degraded' ? 'warn' : 'good'
  const cfg = LEVEL[level]
  const isSelected = selectedNode?.id === node.id
  const nodeLabel = node.location ?? (isGateway ? 'Gateway' : 'Extender')
  const weakCount = clients.filter(c => c.rssi != null && c.rssi < -75).length
  const statusColor = node.status === 'offline' ? '#EF4444' : node.status === 'degraded' ? '#F59E0B' : '#22c55e'

  const hasMatch = searchQuery.length >= 2 && clients.some(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.mac ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      onClick={() => onSelect(isSelected ? null : node)}
      className={`rounded-2xl border-2 cursor-pointer transition-all select-none w-64
        ${isSelected
          ? 'border-noc-info shadow-xl shadow-noc-info/20 bg-noc-raised'
          : `${cfg.border.replace('border-', 'border-')} bg-noc-surface/80 hover:bg-noc-raised hover:shadow-lg`}
        ${hasMatch && !isSelected ? 'border-amber-400/60' : ''}`}
    >
      {/* Device icon area */}
      <div className="flex items-center justify-center py-4 px-4 border-b border-noc-border/40">
        {isGateway
          ? <GatewayHardwareIcon size={56} statusColor={statusColor} />
          : <ExtenderHardwareIcon size={44} statusColor={statusColor} />}
      </div>

      {/* Info area */}
      <div className="p-3">
        {/* Node label + status */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-bold text-noc-fg truncate">{nodeLabel}</span>
          <StatusDot status={node.status} pulse={node.status === 'offline'} size="w-2 h-2" />
          {!isGateway && (
            <span className="text-2xs font-medium text-noc-muted border border-noc-border rounded px-1 ml-auto shrink-0">Ext</span>
          )}
        </div>

        {/* Model */}
        <div className="text-2xs font-code text-noc-muted mb-2">{node.model}</div>

        {/* Details (uptime + firmware) */}
        {showDetails && (
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            {node.uptime && node.status !== 'offline' && (
              <span className="text-2xs text-noc-muted">↑ {node.uptime}</span>
            )}
            {node.firmware && (
              <span className={`text-2xs font-code ${node.firmware.upToDate ? 'text-noc-accent' : 'text-noc-warning'}`}>
                FW {node.firmware.current} {node.firmware.upToDate ? '✓' : '⚠'}
              </span>
            )}
          </div>
        )}

        {/* Band list — vertical, colored like reference */}
        <div className="space-y-0.5 mb-2.5 px-1">
          {BAND_CFG.map(({ key, label, color, filter }) => {
            const count = key === 'MLO' ? 0 : clients.filter(filter).length
            return (
              <div key={key} className="flex items-center justify-between">
                <span className={`text-2xs font-code ${color}`}>{label}</span>
                <span className={`text-2xs font-bold tabular-nums ${count > 0 ? 'text-noc-fg' : 'text-noc-muted/25'}`}>
                  {count}
                </span>
              </div>
            )
          })}
        </div>

        {/* Client count */}
        <div className={`text-xs font-medium border-t border-noc-border/40 pt-2 ${weakCount > 0 ? 'text-noc-danger' : 'text-noc-muted'}`}>
          {clients.length === 0
            ? <span className="text-noc-muted/40 text-xs">No devices connected</span>
            : <>{clients.length} device{clients.length !== 1 ? 's' : ''}
                {weakCount > 0 && <span className="ml-1">· {weakCount} 🔴</span>}</>
          }
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="px-3 py-1.5 bg-noc-info/10 border-t border-noc-info/30 rounded-b-2xl text-center">
          <span className="text-2xs text-noc-info font-semibold">Details shown →</span>
        </div>
      )}

      {/* Offline banner */}
      {node.status === 'offline' && !isSelected && (
        <div className="px-3 py-1.5 bg-noc-danger/10 border-t border-noc-danger/20 rounded-b-2xl">
          <span className="text-2xs font-bold text-noc-danger">● OFFLINE</span>
        </div>
      )}
    </div>
  )
}

// ── Topology canvas ───────────────────────────────────────────────────────────
function TopologyCanvas({ equipment, clients, showDetails, searchQuery, selectedNode, onSelectNode }) {
  const gateway  = equipment.find(e => e.type === 'gateway')
  const extenders = equipment.filter(e => e.type === 'extender')

  const clientsByNode = useMemo(() => {
    const map = {}
    clients.forEach(c => {
      const key = c.connectedTo ?? (gateway ? (gateway.location ?? 'Gateway') : 'Gateway')
      if (!map[key]) map[key] = []
      map[key].push(c)
    })
    return map
  }, [clients, gateway])

  const gwLabel   = gateway ? (gateway.location ?? 'Gateway') : 'Gateway'
  const gwClients = clientsByNode[gwLabel] ?? clientsByNode['Gateway'] ?? []

  if (!gateway) return (
    <div className="text-center text-noc-muted text-sm py-12">No gateway data available</div>
  )

  return (
    <div className="flex flex-col items-center gap-0 w-full max-w-4xl mx-auto">

      {/* WAN globe */}
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-noc-info/10 border-2 border-noc-info/30 flex items-center justify-center shadow-lg shadow-noc-info/5">
          <Globe size={24} className="text-noc-info" />
        </div>
        <span className="text-xs font-code text-noc-info/70 mt-1">Internet</span>
        {/* Dashed vertical line down */}
        <div className="h-10 w-0 border-l-2 border-dashed border-noc-border/50 mt-1" />
      </div>

      {/* Gateway */}
      <TopologyNodeCard
        node={gateway}
        clients={gwClients}
        showDetails={showDetails}
        searchQuery={searchQuery}
        selectedNode={selectedNode}
        onSelect={onSelectNode}
        isGateway
      />

      {/* Extenders */}
      {extenders.length > 0 && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical line from gateway */}
          <div className="h-10 w-0 border-l-2 border-dashed border-noc-border/50" />

          <div className="relative w-full flex justify-center">
            {/* Horizontal dashed bar */}
            {extenders.length > 1 && (
              <div
                className="absolute top-0 border-t-2 border-dashed border-noc-border/50"
                style={{ width: `${(extenders.length - 1) * 18}rem`, left: '50%', transform: 'translateX(-50%)' }}
              />
            )}

            <div className="flex gap-16">
              {extenders.map(ext => {
                const extLabel    = ext.location ?? 'Extender'
                const extClients  = clientsByNode[extLabel] ?? []
                const bhTextColor = ext.backhaul?.quality === 'poor' ? 'text-noc-danger'
                                  : ext.backhaul?.quality === 'fair' ? 'text-noc-warning' : 'text-noc-accent'
                const bhLineColor = ext.backhaul?.quality === 'poor' ? 'border-noc-danger'
                                  : ext.backhaul?.quality === 'fair' ? 'border-noc-warning' : 'border-noc-border/50'
                const bhLabel     = ext.backhaul?.type === 'ethernet'    ? 'ETH'
                                  : ext.backhaul?.type === 'wireless-5g' ? '5G'
                                  : ext.backhaul?.type === 'wireless-6g' ? '6G'
                                  : ext.backhaul ? '2.4G' : ''

                return (
                  <div key={ext.id} className="flex flex-col items-center">
                    {showDetails && bhLabel && (
                      <span className={`text-xs font-code font-semibold ${bhTextColor} mb-0.5`}>{bhLabel} Wireless</span>
                    )}
                    <div className={`h-10 w-0 border-l-2 border-dashed ${bhLineColor}`} />
                    <TopologyNodeCard
                      node={ext}
                      clients={extClients}
                      showDetails={showDetails}
                      searchQuery={searchQuery}
                      selectedNode={selectedNode}
                      onSelect={onSelectNode}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Topology Modal ────────────────────────────────────────────────────────────
function TopologyModal({ equipment, clients, onClose }) {
  const [search, setSearch]           = useState('')
  const [showDetails, setShowDetails] = useState(true)
  const [timeMachine, setTimeMachine] = useState(false)
  const [selectedDate, setSelectedDate] = useState('Jun 7')
  const [selectedNode, setSelectedNode] = useState(null)

  const gateway = equipment.find(e => e.type === 'gateway')

  const clientsByNode = useMemo(() => {
    const map = {}
    clients.forEach(c => {
      const key = c.connectedTo ?? (gateway ? (gateway.location ?? 'Gateway') : 'Gateway')
      if (!map[key]) map[key] = []
      map[key].push(c)
    })
    return map
  }, [clients, gateway])

  const gwLabel = gateway ? (gateway.location ?? 'Gateway') : 'Gateway'
  const selectedClients = selectedNode
    ? (selectedNode.type === 'gateway'
        ? (clientsByNode[gwLabel] ?? clientsByNode['Gateway'] ?? [])
        : clientsByNode[selectedNode.location ?? 'Extender'] ?? [])
    : []

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex flex-col">

      {/* ── Modal header ── */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-noc-surface border-b border-noc-border shrink-0">
        <div className="flex items-center gap-3">
          <Network size={15} className="text-noc-info" />
          <span className="text-base font-bold text-noc-fg">Network Topology</span>
          <span className="text-xs px-2.5 py-0.5 bg-noc-raised border border-noc-border rounded-full text-noc-muted">
            {equipment.length} node{equipment.length !== 1 ? 's' : ''} · {clients.length} device{clients.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-5">
          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-noc-muted/60 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search device or MAC…"
              className="pl-8 pr-6 py-2 w-52 text-xs bg-noc-raised border border-noc-border rounded-lg text-noc-fg placeholder-noc-muted/50 focus:outline-none focus:border-noc-info/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-noc-muted hover:text-noc-fg cursor-pointer">
                <X size={11} />
              </button>
            )}
          </div>

          {/* Toggles */}
          <label className="flex items-center gap-2 text-xs text-noc-muted hover:text-noc-fg cursor-pointer select-none">
            <input type="checkbox" checked={showDetails} onChange={e => setShowDetails(e.target.checked)} className="accent-noc-info w-3.5 h-3.5" />
            Show details
          </label>
          <label className="flex items-center gap-2 text-xs text-noc-muted hover:text-noc-fg cursor-pointer select-none">
            <input type="checkbox" checked={timeMachine} onChange={e => setTimeMachine(e.target.checked)} className="accent-noc-info w-3.5 h-3.5" />
            Time machine
          </label>
          {timeMachine && (
            <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="text-xs bg-noc-raised border border-noc-border rounded-lg px-2.5 py-1.5 text-noc-fg focus:outline-none cursor-pointer">
              {['Jun 7', 'Jun 6', 'Jun 5', 'Jun 4', 'Jun 3'].map(d => <option key={d}>{d}</option>)}
            </select>
          )}

          {/* Close */}
          <button onClick={onClose} className="p-2 rounded-lg text-noc-muted hover:text-noc-fg hover:bg-noc-raised cursor-pointer transition-colors" title="Close (Esc)">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-12 bg-noc-bg">
          <TopologyCanvas
            equipment={equipment}
            clients={clients}
            showDetails={showDetails}
            searchQuery={search}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
          />
        </div>

        {/* Right detail panel */}
        <div className="w-80 border-l border-noc-border bg-noc-surface flex flex-col shrink-0 overflow-hidden">
          {selectedNode ? (
            <>
              {/* Node header */}
              <div className="p-5 border-b border-noc-border">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${selectedNode.type === 'gateway' ? 'bg-noc-info/10' : 'bg-noc-accent/10'}`}>
                    {selectedNode.type === 'gateway'
                      ? <GatewayHardwareIcon size={40} statusColor={
                          selectedNode.status === 'offline' ? '#EF4444'
                          : selectedNode.status === 'degraded' ? '#F59E0B' : '#22c55e'} />
                      : <ExtenderHardwareIcon size={32} statusColor={
                          selectedNode.status === 'offline' ? '#EF4444'
                          : selectedNode.status === 'degraded' ? '#F59E0B' : '#22c55e'} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-bold text-noc-fg">
                        {selectedNode.location ?? (selectedNode.type === 'gateway' ? 'Gateway' : 'Extender')}
                      </span>
                      <StatusDot status={selectedNode.status} pulse={selectedNode.status === 'offline'} size="w-2 h-2" />
                    </div>
                    <div className="text-xs font-code text-noc-muted">{selectedNode.model}</div>
                    {selectedNode.type !== 'gateway' && (
                      <div className="text-2xs text-noc-muted mt-0.5">
                        Mesh Extender · {selectedNode.backhaul?.type ?? 'wireless'}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-noc-muted hover:text-noc-fg cursor-pointer p-1 shrink-0 mt-1">
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {selectedNode.uptime    && <PopRow label="Uptime"   value={selectedNode.uptime}               mono />}
                  {selectedNode.firmware  && (
                    <PopRow label="Firmware" value={selectedNode.firmware.current}
                      level={selectedNode.firmware.upToDate ? 'good' : 'warn'}
                      note={!selectedNode.firmware.upToDate ? `→ ${selectedNode.firmware.latest}` : undefined} mono />
                  )}
                  {selectedNode.backhaul  && (
                    <PopRow label="Backhaul" value={selectedNode.backhaul.type}
                      level={selectedNode.backhaul.quality === 'poor' ? 'bad'
                           : selectedNode.backhaul.quality === 'fair' ? 'warn' : 'good'} />
                  )}
                  {selectedNode.rxDbm != null && (
                    <PopRow label="Opt Rx" value={`${selectedNode.rxDbm.toFixed(1)} dBm`}
                      level={selectedNode.rxDbm > -22 ? 'good' : selectedNode.rxDbm > -27 ? 'warn' : 'bad'} mono />
                  )}
                  {selectedNode.mac && <PopRow label="MAC" value={selectedNode.mac} mono />}
                </div>
              </div>

              {/* Connected client list */}
              <div className="flex-1 overflow-y-auto scrollbar-dark">
                <div className="px-5 py-2.5 text-2xs font-semibold text-noc-muted uppercase tracking-wide sticky top-0 bg-noc-surface border-b border-noc-border/30 z-10">
                  {selectedClients.length} Connected Device{selectedClients.length !== 1 ? 's' : ''}
                </div>
                {selectedClients.length === 0 ? (
                  <div className="px-5 py-8 text-center text-xs text-noc-muted">No connected devices</div>
                ) : (
                  selectedClients.map(c => {
                    const rl = rssiLevel(c.rssi)
                    const rc = rl ? LEVEL[rl] : null
                    return (
                      <div key={c.id} className="flex items-start gap-3 px-5 py-3 border-b border-noc-border/20 last:border-0 hover:bg-noc-raised/30 transition-colors">
                        <StatusDot status={c.status} rssi={c.rssi} size="w-2 h-2" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-noc-fg truncate">{c.name}</div>
                          {c.mac && <div className="text-2xs font-code text-noc-muted truncate mt-0.5">{c.mac}</div>}
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-xs font-code text-noc-muted">{c.band}</span>
                          {c.rssi != null && (
                            <span className={`text-xs font-code font-semibold ${rc?.color ?? 'text-noc-muted'}`}>{c.rssi} dBm</span>
                          )}
                          {c.usageMbps != null && c.usageMbps > 0 && (
                            <span className="text-2xs text-noc-muted">{c.usageMbps.toFixed(1)} M</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-noc-raised border border-noc-border flex items-center justify-center mb-4">
                <Network size={26} className="text-noc-muted/35" />
              </div>
              <p className="text-sm font-medium text-noc-muted mb-1.5">No node selected</p>
              <p className="text-xs text-noc-muted leading-relaxed">
                Click a node card in the topology to view its connected devices and technical details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Filter chips ──────────────────────────────────────────────────────────────
const FILTER_CHIPS = [
  { id: 'all',          label: 'All' },
  { id: 'problems',     label: '🔴 Problems' },
  { id: 'highUsage',    label: '⚡ High Usage' },
  { id: '2.4G',         label: '2.4G' },
  { id: '5G',           label: '5G' },
  { id: '6G',           label: '6G' },
  { id: 'disconnected', label: 'Disconnected' },
]

const OPTIONAL_COLS = [
  { id: 'ip',   label: 'IP Address' },
  { id: 'ssid', label: 'SSID' },
  { id: 'mode', label: 'WiFi Mode' },
]

const DEFAULT_DIR = {
  health:   'asc',
  rssi:     'asc',
  name:     'asc',
  node:     'asc',
  usage:    'desc',
  lastSeen: 'desc',
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Zone6DeviceOverview({ devices = [], pollNow, lastPolledMins = 0 }) {
  const [showTopology, setShowTopology] = useState(false)
  const [query, setQuery]               = useState('')
  const [filter, setFilter]             = useState('all')
  const [sortCol, setSortCol]           = useState('health')
  const [sortDir, setSortDir]           = useState('asc')
  const [showColumnsMenu, setShowColumnsMenu] = useState(false)
  const [optionalCols, setOptionalCols] = useState(new Set())

  const equipment = useMemo(() => devices.filter(d => d.cat === 'equipment'), [devices])
  const clients   = useMemo(() => devices.filter(d => d.cat === 'client'),    [devices])

  const problemCount = clients.filter(d => d.status !== 'online' || (d.rssi != null && d.rssi < -75)).length
  const totalUsage   = clients.reduce((s, d) => s + (d.usageMbps ?? 0), 0)
  const maxUsage     = Math.max(...clients.map(d => d.usageMbps ?? 0), 1)
  const hasUsage     = clients.some(d => d.usageMbps != null)

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir(DEFAULT_DIR[col] ?? 'asc')
    }
  }

  function healthScore(d) {
    if (d.status === 'offline')  return 4
    if (d.status === 'degraded') return 3
    if (d.rssi != null && d.rssi < -75) return 2
    if (d.rssi != null && d.rssi < -65) return 1
    return 0
  }

  function getSortKey(d, col) {
    switch (col) {
      case 'health':   return -healthScore(d)
      case 'rssi':     return d.rssi ?? -999
      case 'name':     return d.name?.toLowerCase() ?? ''
      case 'node':     return (d.connectedTo ?? '').toLowerCase()
      case 'usage':    return d.usageMbps ?? -1
      case 'lastSeen': return timeScore(d.lastSeen)
      default:         return 0
    }
  }

  const filtered = useMemo(() => {
    let list = [...clients]
    if (query.length >= 2) {
      const q = query.toLowerCase()
      list = list.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        (d.mac ?? '').toLowerCase().includes(q) ||
        (d.connectedTo ?? '').toLowerCase().includes(q) ||
        (d.band ?? '').toLowerCase().includes(q)
      )
    }
    if (filter === 'problems')     list = list.filter(d => d.status !== 'online' || (d.rssi != null && d.rssi < -75))
    else if (filter === 'highUsage')    list = list.filter(d => (d.usageMbps ?? 0) >= 5)
    else if (filter === '2.4G')    list = list.filter(d => d.band === '2.4G')
    else if (filter === '5G')      list = list.filter(d => d.band === '5G')
    else if (filter === '6G')      list = list.filter(d => d.band === '6G')
    else if (filter === 'disconnected') list = list.filter(d => d.status === 'offline')

    const mult = sortDir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      const ka = getSortKey(a, sortCol)
      const kb = getSortKey(b, sortCol)
      const cmp = typeof ka === 'string' ? ka.localeCompare(kb) : ka - kb
      return cmp * mult
    })
    return list
  }, [clients, query, filter, sortCol, sortDir])

  return (
    <div className="bg-noc-surface border border-noc-border rounded-xl overflow-visible">

      {/* ── Zone header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-noc-border bg-noc-raised/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-noc-info" />
          <span className="text-sm font-semibold text-noc-fg">Device Overview &amp; Maintenance</span>
          {problemCount > 0 && (
            <span className="text-2xs font-bold text-noc-danger bg-noc-danger/10 border border-noc-danger/30 rounded-full px-2 py-0.5">
              {problemCount} need attention
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Poll Now — consistent with Zone 3/4 */}
          <div className="flex items-center gap-1.5">
            {lastPolledMins > 0 && (
              <span className="text-2xs text-noc-muted/70">
                {lastPolledMins}m ago
              </span>
            )}
            {pollNow && (
              <button
                onClick={pollNow}
                className="flex items-center gap-1 text-2xs text-noc-muted border border-noc-border rounded px-2 py-1 hover:text-noc-fg hover:border-noc-muted/50 transition-colors cursor-pointer"
              >
                <RefreshCw size={10} />
                Poll Now
              </button>
            )}
          </div>

          {/* Topology modal trigger */}
          <button
            onClick={() => setShowTopology(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-noc-muted border border-noc-border rounded-lg hover:text-noc-info hover:border-noc-info/40 hover:bg-noc-info/5 transition-colors cursor-pointer"
          >
            <Network size={12} />
            Topology ↗
          </button>
        </div>
      </div>

      {/* ── Equipment strip ── */}
      <EquipmentStrip equipment={equipment} />

      {/* ── Table ── */}
      <>
        {/* Search + controls */}
        <div className="px-4 py-3 border-b border-noc-border/50 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-noc-muted/60 pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search name, MAC, SSID, IP…"
                className="w-full pl-7 pr-7 py-1.5 text-xs bg-noc-raised border border-noc-border rounded-lg text-noc-fg placeholder-noc-muted/50 focus:outline-none focus:border-noc-info/50 transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-noc-muted hover:text-noc-fg cursor-pointer">
                  <X size={11} />
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowColumnsMenu(v => !v)}
                className="text-2xs text-noc-muted border border-noc-border rounded px-2.5 py-1.5 hover:text-noc-fg hover:border-noc-muted/50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
              >
                Columns {showColumnsMenu ? '▲' : '▾'}
              </button>
              {showColumnsMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowColumnsMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-noc-raised border border-noc-border rounded-lg shadow-xl p-2 space-y-0.5 min-w-[150px]">
                    {OPTIONAL_COLS.map(col => (
                      <label key={col.id} className="flex items-center gap-2 px-2 py-1 text-xs text-noc-muted hover:text-noc-fg cursor-pointer rounded hover:bg-noc-surface/50">
                        <input
                          type="checkbox"
                          checked={optionalCols.has(col.id)}
                          onChange={e => {
                            const next = new Set(optionalCols)
                            e.target.checked ? next.add(col.id) : next.delete(col.id)
                            setOptionalCols(next)
                          }}
                          className="accent-noc-info cursor-pointer"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_CHIPS.map(chip => (
              <button
                key={chip.id}
                onClick={() => setFilter(chip.id === filter && chip.id !== 'all' ? 'all' : chip.id)}
                className={`text-2xs font-medium px-2.5 py-1 rounded-full border transition-colors cursor-pointer
                  ${filter === chip.id
                    ? 'bg-noc-info/15 text-noc-info border-noc-info/30'
                    : 'text-noc-muted border-noc-border hover:border-noc-muted/50 hover:text-noc-fg'}`}
              >
                {chip.label}
                {chip.id === 'problems' && problemCount > 0 && (
                  <span className="ml-1 font-bold">{problemCount}</span>
                )}
              </button>
            ))}
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-2xs text-noc-info hover:underline cursor-pointer ml-1">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 py-2 flex items-center gap-3 flex-wrap border-b border-noc-border/30">
          <span className="text-2xs text-noc-muted">{clients.length} client devices</span>
          {problemCount > 0 && (
            <span className="text-2xs text-noc-danger">· {problemCount} 🔴 signal problem</span>
          )}
          {hasUsage && totalUsage > 0 && (
            <span className="text-2xs text-noc-muted">· {totalUsage.toFixed(1)} Mbps total usage</span>
          )}
          {filtered.length < clients.length && (
            <span className="text-2xs text-noc-info ml-auto">{filtered.length} of {clients.length} shown</span>
          )}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-noc-muted text-sm">
            {query ? `No devices match "${query}"` : 'No devices match the current filter'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full group">
              <thead>
                <tr className="border-b border-noc-border/50">
                  <th className="py-2 pl-4 pr-1 w-10" />
                  <SortableHeader label="Name"        col="name"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Node"        col="node"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                  <SortableHeader label="Band"        col="band"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Signal"      col="rssi"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                  {hasUsage && (
                    <SortableHeader label="Usage"     col="usage"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                  )}
                  <SortableHeader
                    label="Last Active"
                    col="lastSeen"
                    sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
                    className="hidden sm:table-cell"
                    title="Last time device was detected on network. Refreshes on Poll Now."
                  />
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <ClientRow key={d.id} device={d} maxUsage={maxUsage} showUsage={hasUsage} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>

      {/* ── Topology Modal ── */}
      {showTopology && (
        <TopologyModal
          equipment={equipment}
          clients={clients}
          onClose={() => setShowTopology(false)}
        />
      )}
    </div>
  )
}
