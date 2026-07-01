import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X, Info, ChevronLeft, ChevronRight, Cpu, Network, BarChart3 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useSearch } from '../../hooks/useSearch'
import SearchDropdown from '../network/SearchDropdown'
import GeoMap from './GeoMap'
import { mockCustomers } from '../../data/mockCustomers'
import {
  FLEET_SCORE,
  HERO_KPIS,
  FW_HEALTH,
  DASH_ACCOUNTS,
} from '../../data/mockDashboard'

// ── Helpers ──────────────────────────────────────────────────────────────────
function inZone(score, zone) {
  if (!zone) return true
  if (zone === 'critical') return score < 40
  if (zone === 'degraded') return score >= 40 && score < 70
  return score >= 70
}
function scoreColor(s) { return s < 40 ? '#EF4444' : s < 70 ? '#F59E0B' : '#22C55E' }
function scoreStatus(score) {
  if (score < 40) return 'critical'
  if (score < 70) return 'degraded'
  return 'healthy'
}
function formatScore(v) { return Number(v).toFixed(1) }
const REGION_LABEL_BY_ID = {
  'region-0': 'Seattle Metro',
  'region-1': 'Tacoma / Pierce',
  'region-2': 'Eastside / Snoqualmie',
  'region-3': 'Rural North',
  'region-4': 'Rural West',
}
function accountRegionName(account) {
  return REGION_LABEL_BY_ID[account.region] || account.loc
}
function normalizeTrendData(data) {
  return data.map((point, i) => (
    typeof point === 'number'
      ? { label: `P${i + 1}`, value: point }
      : point
  ))
}
function getTrendStats(data) {
  const values = data.map(point => point.value)
  const low = Math.min(...values)
  const high = Math.max(...values)
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  return { low, avg, high }
}

function SectionHeader({ icon: Icon, label, detail, action }) {
  return (
    <div className="dashboard-section-header">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="dashboard-section-icon">
            <Icon size={14} />
          </div>
        )}
        <div className="min-w-0">
          <p className="dashboard-section-label">{label}</p>
          {detail && <p className="dashboard-section-detail">{detail}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// ── Gauge Chart ──────────────────────────────────────────────────────────────
// 270° arc, opens at bottom (7:30 → 4:30 through 12 o'clock)
function GaugeChart({ score, delta }) {
  const canvasRef = useRef(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = 190, H = 154
    canvas.width = W * dpr; canvas.height = H * dpr
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    const isLight = theme === 'light'

    // Keep the dial compact enough for the one-page dashboard while preserving readable labels.
    const cx = 95, cy = 92, R = 66, sw = 9
    const toRad = d => d * Math.PI / 180
    const START = toRad(135), SWEEP = toRad(270)

    let animId = null, startTime = null

    function draw(val) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.save()

      // Ambient dial field
      const field = ctx.createRadialGradient(cx, cy, 10, cx, cy, R + 34)
      field.addColorStop(0, isLight ? 'rgba(14,165,233,0.10)' : 'rgba(34,211,238,0.12)')
      field.addColorStop(0.58, isLight ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.10)')
      field.addColorStop(1, 'rgba(2,6,23,0)')
      ctx.beginPath(); ctx.arc(cx, cy, R + 31, 0, Math.PI * 2)
      ctx.fillStyle = field; ctx.fill()

      ;[R + 20, R + 27].forEach((ring, i) => {
        ctx.beginPath(); ctx.arc(cx, cy, ring, START + 0.18, START + SWEEP - 0.18, false)
        ctx.strokeStyle = isLight ? `rgba(14,165,233,${0.12 - i * 0.04})` : `rgba(103,232,249,${0.18 - i * 0.05})`
        ctx.lineWidth = 1
        ctx.stroke()
      })

      for (let tick = 0; tick <= 100; tick += 5) {
        const a = START + toRad(tick / 100 * 270)
        const isMajor = tick % 10 === 0
        const inner = R + (isMajor ? 10 : 14)
        const outer = R + (isMajor ? 18 : 17)
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner)
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer)
        ctx.strokeStyle = isLight ? (isMajor ? 'rgba(15,23,42,0.28)' : 'rgba(15,23,42,0.13)') : (isMajor ? 'rgba(148,163,184,0.38)' : 'rgba(148,163,184,0.18)')
        ctx.lineWidth = isMajor ? 1.2 : 0.8
        ctx.stroke()
      }

      // Track
      ctx.beginPath(); ctx.arc(cx, cy, R, START, START + SWEEP, false)
      ctx.strokeStyle = isLight ? 'rgba(226,232,240,0.86)' : 'rgba(15,23,42,0.92)'
      ctx.lineWidth = sw; ctx.lineCap = 'round'; ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, cy, R, START, START + SWEEP, false)
      ctx.strokeStyle = isLight ? 'rgba(14,165,233,0.16)' : 'rgba(34,211,238,0.16)'
      ctx.lineWidth = sw + 6
      ctx.globalAlpha = 0.9
      ctx.stroke()
      ctx.globalAlpha = 1

      // Zone bands (soft)
      ;[[0, 40, '#EF4444'], [40, 70, '#F59E0B'], [70, 100, '#22C55E']].forEach(([a, b, c]) => {
        ctx.beginPath()
        ctx.arc(cx, cy, R, START + toRad(a / 100 * 270), START + toRad(b / 100 * 270), false)
        ctx.strokeStyle = c; ctx.lineWidth = sw; ctx.globalAlpha = 0.20; ctx.stroke(); ctx.globalAlpha = 1
      })

      // Threshold ticks at 40 and 70
      ;[40, 70].forEach(s => {
        const a = START + toRad(s / 100 * 270)
        const inner = R - sw / 2 - 2, outer = R + sw / 2 + 4
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner)
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer)
        ctx.strokeStyle = isLight ? '#CBD5E1' : '#475569'; ctx.lineWidth = 1.5; ctx.stroke()
      })

      // Active fill arc
      const fillColor = val < 40 ? '#EF4444' : val < 70 ? '#F59E0B' : '#22C55E'
      const fillEnd = START + toRad(Math.max(0.01, val) / 100 * 270)
      const fillGradient = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
      fillGradient.addColorStop(0, fillColor)
      fillGradient.addColorStop(0.58, fillColor)
      fillGradient.addColorStop(1, val >= 70 ? '#22D3EE' : fillColor)
      ctx.beginPath(); ctx.arc(cx, cy, R, START, fillEnd, false)
      ctx.strokeStyle = fillGradient; ctx.lineWidth = sw; ctx.lineCap = 'round'
      ctx.shadowBlur = 18; ctx.shadowColor = fillColor; ctx.stroke(); ctx.shadowBlur = 0

      // Glowing tip dot
      const tx = cx + Math.cos(fillEnd) * R, ty = cy + Math.sin(fillEnd) * R
      ctx.beginPath(); ctx.arc(tx, ty, 11, 0, Math.PI * 2)
      ctx.fillStyle = `${fillColor}22`; ctx.fill()
      ctx.beginPath(); ctx.arc(tx, ty, 5.5, 0, Math.PI * 2)
      ctx.fillStyle = fillColor; ctx.shadowBlur = 14; ctx.shadowColor = fillColor
      ctx.fill(); ctx.shadowBlur = 0

      // Score number
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.font = `900 40px Fira Sans, -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillStyle = isLight ? '#0F172A' : '#F8FAFC'
      ctx.shadowBlur = 10
      ctx.shadowColor = isLight ? 'rgba(14,165,233,0.16)' : 'rgba(34,211,238,0.25)'
      ctx.fillText(Math.round(val), cx, cy - 6)
      ctx.shadowBlur = 0

      ctx.font = `600 10px Fira Code, monospace`
      ctx.fillStyle = isLight ? '#94A3B8' : '#475569'
      ctx.fillText('/ 100', cx, cy + 18)

      // Delta badge
      if (delta > 0) {
        ctx.font = `700 10px Fira Code, monospace`
        ctx.fillStyle = '#22C55E'
        ctx.fillText(`↑ +${delta} vs last week`, cx, cy + 36)
      }

      ctx.restore()
    }

    function tick(ts) {
      if (!startTime) startTime = ts
      const p = Math.min((ts - startTime) / 1400, 1)
      const ease = 1 - Math.pow(1 - p, 4)
      draw(ease * score)
      if (p < 1) animId = requestAnimationFrame(tick)
    }
    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [score, delta, theme])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}

// ── Interactive fleet trend ──────────────────────────────────────────────────
function TrendLineChart({ data }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const pointRef = useRef([])
  const [size, setSize] = useState({ width: 0, height: 118 })
  const [hoverPoint, setHoverPoint] = useState(null)
  const { theme } = useTheme()
  const chartData = useMemo(() => normalizeTrendData(data), [data])
  const hoverIndex = hoverPoint?.index ?? null

  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    const updateSize = () => {
      setSize({ width: Math.max(260, Math.round(node.clientWidth)), height: 118 })
    }
    updateSize()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateSize)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !size.width) return
    const dpr = window.devicePixelRatio || 1
    const W = size.width, H = size.height
    canvas.width = W * dpr; canvas.height = H * dpr
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    const isLight = theme === 'light'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const values = chartData.map(point => point.value)
    const rawMin = Math.min(...values)
    const rawMax = Math.max(...values)
    const mn = Math.floor(rawMin - 1.2)
    const mx = Math.ceil(rawMax + 1.2)
    const pad = { left: 10, right: 30, top: 14, bottom: 28 }
    const chartW = W - pad.left - pad.right
    const chartH = H - pad.top - pad.bottom
    const sx = i => pad.left + (i / Math.max(chartData.length - 1, 1)) * chartW
    const sy = v => pad.top + chartH - ((v - mn) / Math.max(mx - mn, 1)) * chartH
    const points = chartData.map((point, i) => ({ ...point, x: sx(i), y: sy(point.value) }))
    pointRef.current = points

    const grid = isLight ? 'rgba(71,85,105,0.15)' : 'rgba(148,163,184,0.13)'
    const axis = isLight ? 'rgba(51,65,85,0.48)' : 'rgba(203,213,225,0.42)'
    const text = isLight ? '#64748B' : '#94A3B8'

    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, isLight ? 'rgba(14,165,233,0.10)' : 'rgba(34,211,238,0.09)')
    bg.addColorStop(0.52, 'rgba(34,197,94,0.04)')
    bg.addColorStop(1, isLight ? 'rgba(99,102,241,0.05)' : 'rgba(129,140,248,0.06)')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i += 1) {
      const y = pad.top + (i / 4) * chartH
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y)
      ctx.strokeStyle = grid; ctx.stroke()
    }
    for (let i = 0; i < chartData.length; i += Math.max(1, Math.floor(chartData.length / 6))) {
      const x = sx(i)
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + chartH)
      ctx.strokeStyle = grid; ctx.stroke()
    }

    const thresholdY = sy(70)
    if (thresholdY >= pad.top && thresholdY <= pad.top + chartH) {
      ctx.save()
      ctx.setLineDash([5, 5])
      ctx.beginPath(); ctx.moveTo(pad.left, thresholdY); ctx.lineTo(W - pad.right, thresholdY)
      ctx.strokeStyle = isLight ? 'rgba(22,163,74,0.35)' : 'rgba(34,197,94,0.42)'
      ctx.stroke()
      ctx.restore()
      ctx.font = '600 9px Fira Code, monospace'
      ctx.fillStyle = isLight ? 'rgba(22,101,52,0.62)' : 'rgba(134,239,172,0.68)'
      ctx.fillText('70', W - pad.right + 7, thresholdY + 3)
    }

    ctx.beginPath()
    points.forEach((point, i) => i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y))
    ctx.lineTo(points[points.length - 1].x, pad.top + chartH)
    ctx.lineTo(points[0].x, pad.top + chartH)
    ctx.closePath()
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, isLight ? 'rgba(14,165,233,0.20)' : 'rgba(34,211,238,0.24)')
    g.addColorStop(0.52, 'rgba(34,197,94,0.12)')
    g.addColorStop(1, 'rgba(34,197,94,0)')
    ctx.fillStyle = g; ctx.fill()

    const lineGradient = ctx.createLinearGradient(pad.left, 0, W - pad.right, 0)
    lineGradient.addColorStop(0, '#22C55E')
    lineGradient.addColorStop(0.54, '#22D3EE')
    lineGradient.addColorStop(1, '#818CF8')

    ctx.save()
    ctx.beginPath()
    points.forEach((point, i) => i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y))
    ctx.strokeStyle = lineGradient
    ctx.lineWidth = 7
    ctx.globalAlpha = 0.16
    ctx.shadowBlur = 18
    ctx.shadowColor = '#22D3EE'
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    points.forEach((point, i) => i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y))
    ctx.strokeStyle = lineGradient
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()

    points.forEach((point, i) => {
      const shouldDraw = chartData.length <= 8 || i % 5 === 0 || i === chartData.length - 1 || i === hoverIndex
      if (!shouldDraw) return
      ctx.beginPath()
      ctx.arc(point.x, point.y, i === hoverIndex ? 4.5 : 2.5, 0, Math.PI * 2)
      ctx.fillStyle = i === hoverIndex ? '#F8FAFC' : '#22D3EE'
      ctx.shadowBlur = i === hoverIndex ? 12 : 7
      ctx.shadowColor = i === hoverIndex ? '#22D3EE' : '#22C55E'
      ctx.fill()
      ctx.shadowBlur = 0
    })

    if (hoverIndex !== null && points[hoverIndex]) {
      const point = points[hoverIndex]
      ctx.beginPath(); ctx.moveTo(point.x, pad.top); ctx.lineTo(point.x, pad.top + chartH)
      ctx.strokeStyle = isLight ? 'rgba(8,145,178,0.36)' : 'rgba(103,232,249,0.40)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.beginPath(); ctx.arc(point.x, point.y, 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(34,211,238,0.45)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    const last = points[points.length - 1]
    ctx.beginPath(); ctx.arc(last.x, last.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(34,197,94,0.18)'; ctx.fill()
    ctx.beginPath(); ctx.arc(last.x, last.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#22C55E'; ctx.shadowBlur = 13; ctx.shadowColor = '#22C55E'; ctx.fill(); ctx.shadowBlur = 0

    ctx.font = '600 9px Fira Code, monospace'
    ctx.fillStyle = text
    ctx.textAlign = 'left'
    ctx.fillText(points[0].label, pad.left, H - 8)
    ctx.textAlign = 'center'
    ctx.fillText(points[Math.floor(points.length / 2)].label, pad.left + chartW / 2, H - 8)
    ctx.textAlign = 'right'
    ctx.fillText(last.label, W - pad.right, H - 8)
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top + chartH); ctx.lineTo(W - pad.right, pad.top + chartH)
    ctx.strokeStyle = axis; ctx.lineWidth = 1; ctx.stroke()
  }, [chartData, hoverIndex, size, theme])

  function handlePointerMove(e) {
    const canvas = canvasRef.current
    const points = pointRef.current
    if (!canvas || points.length === 0) return
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const nearest = points.reduce((best, point, i) => (
      Math.abs(point.x - px) < Math.abs(points[best].x - px) ? i : best
    ), 0)
    setHoverPoint({ ...points[nearest], index: nearest })
  }

  const tooltipLeft = hoverPoint ? Math.min(Math.max(hoverPoint.x, 44), size.width - 44) : 0
  const tooltipTop = hoverPoint ? Math.max(6, hoverPoint.y - 42) : 0

  return (
    <div ref={wrapRef} className="relative h-[118px] w-full overflow-hidden rounded-lg border border-cyan-400/10 bg-noc-bg/35">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverPoint(null)}
        className="block h-[118px] w-full cursor-crosshair"
      />
      {hoverPoint && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-md border border-cyan-300/30 bg-noc-bg/95 px-2 py-1 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
          style={{ left: `${tooltipLeft}px`, top: `${tooltipTop}px` }}
        >
          <p className="font-code text-[9px] font-semibold uppercase text-cyan-200">{hoverPoint.label}</p>
          <p className="font-code text-[13px] font-bold text-noc-fg">{formatScore(hoverPoint.value)}</p>
        </div>
      )}
    </div>
  )
}

// ── Zone constants (used by AccountDrawer) ───────────────────────────────────
const ISSUE_TYPES = [
  { key: 'offline',  label: 'Offline',   color: '#EF4444' },
  { key: 'speed',    label: 'Speed ↓',   color: '#F97316' },
  { key: 'wifi',     label: 'WiFi',      color: '#F59E0B' },
  { key: 'unstable', label: 'Unstable',  color: '#A855F7' },
  { key: 'other',    label: 'Other',     color: '#64748B' },
  { key: 'healthy',  label: 'Healthy',   color: '#22C55E' },
]
const ZONE_META = {
  critical: { label: 'Critical', count: 153,   pct: '8.2%',  score: '0–40',   color: '#EF4444', border: 'border-red-500/25',    bg: 'bg-red-500/6',    text: 'text-red-400'    },
  degraded: { label: 'Degraded', count: 347,   pct: '18.5%', score: '40–70',  color: '#F59E0B', border: 'border-yellow-500/25', bg: 'bg-yellow-500/6', text: 'text-yellow-400' },
  healthy:  { label: 'Healthy',  count: 1371,  pct: '73.3%', score: '70–100', color: '#22C55E', border: 'border-green-500/25',  bg: 'bg-green-500/6',  text: 'text-green-400'  },
}

const DRAWER_FACTORS = [
  { key: 'offline', label: 'Offline' },
  { key: 'speed', label: 'Speed ↓' },
  { key: 'unstable', label: 'Unstable' },
  { key: 'other', label: 'Other' },
]

function factorKeyForIssue(issue) {
  return DRAWER_FACTORS.some(factor => factor.key === issue) ? issue : 'other'
}

function scoreBandColor(key) {
  if (key === 'critical') return '#EF4444'
  if (key === 'degraded') return '#F59E0B'
  return '#22C55E'
}

function NetworkHealthCommand({ onOpenZone }) {
  const totals = DASH_ACCOUNTS.reduce((acc, account) => {
    const status = scoreStatus(account.score)
    acc[status] += 1
    return acc
  }, { critical: 0, degraded: 0, healthy: 0 })

  const totalInScope = DASH_ACCOUNTS.length
  const healthBands = [
    { key: 'critical', label: 'Critical', count: totals.critical, width: (totals.critical / totalInScope) * 100 },
    { key: 'degraded', label: 'Degraded', count: totals.degraded, width: (totals.degraded / totalInScope) * 100 },
    { key: 'healthy', label: 'Healthy', count: totals.healthy, width: (totals.healthy / totalInScope) * 100 },
  ]

  return (
    <div className="dashboard-health-card dashboard-health-card-network">
      <SectionHeader
        icon={Network}
        label="Network Health Segmentation"
        detail="Critical and degraded are clickable; healthy is compressed for context"
      />

      <div className="dashboard-tool-panel dashboard-seg-panel">
        <div className="dashboard-seg-dist-head dashboard-seg-bars-head">
          <div>
            <p>Focused Health Distribution</p>
            <span>Bar widths reflect actual device proportions</span>
          </div>
        </div>

        <div className="dashboard-seg-bar-stack">
          {healthBands.map(band => {
            const pct = (band.count / totalInScope) * 100
            const isClickable = band.key === 'critical' || band.key === 'degraded'
            return (
              <button
                key={band.key}
                type="button"
                onClick={() => isClickable && onOpenZone(band.key)}
                disabled={!isClickable}
                className={`dashboard-seg-bar-row ${isClickable ? 'is-clickable' : 'is-disabled'}`}
                style={{ '--seg-color': scoreBandColor(band.key) }}
              >
                <span
                  className="dashboard-seg-bar-fill"
                  style={{ width: `${band.width}%` }}
                >
                  <span className="dashboard-seg-bar-copy">
                    <strong>{band.label}</strong>
                    {band.key === 'healthy' && <em>…</em>}
                    <span>{pct.toFixed(1)}% · {band.count.toLocaleString()} devices</span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Issue tag ────────────────────────────────────────────────────────────────
function IssueTag({ issue, label }) {
  const cls = { offline: 'bg-red-500/10 text-red-400 border-red-500/25', speed: 'bg-orange-500/10 text-orange-400 border-orange-500/25', wifi: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25', unstable: 'bg-purple-500/10 text-purple-400 border-purple-500/25', other: 'bg-slate-500/10 text-slate-300 border-slate-500/25', healthy: 'bg-green-500/10 text-green-400 border-green-500/25' }[issue] || 'bg-noc-border/40 text-noc-muted border-noc-border'
  return <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${cls}`}>{label}</span>
}

// ── Account drawer ───────────────────────────────────────────────────────────
const PAGE_SIZE = 8

function AccountDrawer({ open, title, zone, issue, segment, firmware, region, device, accounts, onClose, onOpenAccount }) {
  const [page, setPage] = useState(0)
  const [selectedFactor, setSelectedFactor] = useState('all')

  const isDeviceMode = Boolean(device)
  const showIssueFactors = !isDeviceMode && (zone === 'critical' || zone === 'degraded')
  const factorCounts = useMemo(() => (
    DRAWER_FACTORS.map(factor => ({
      ...factor,
      count: accounts.filter(account => factorKeyForIssue(account.issue) === factor.key).length,
    }))
  ), [accounts])
  const filteredAccounts = selectedFactor === 'all'
    ? accounts
    : accounts.filter(account => factorKeyForIssue(account.issue) === selectedFactor)
  const totalPages = Math.ceil(filteredAccounts.length / PAGE_SIZE)
  const pageItems = filteredAccounts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const zoneLabel = zone ? { critical: 'Critical', degraded: 'Degraded', healthy: 'Healthy' }[zone] : null
  const issueLabel = issue ? ISSUE_TYPES.find(it => it.key === issue)?.label : null
  const hasScope = zoneLabel || issueLabel || segment || firmware || region || isDeviceMode
  const latestFirmware = FW_HEALTH.find(item => item.stage.toLowerCase().includes('latest'))?.label || FW_HEALTH[FW_HEALTH.length - 1]?.label
  const showBatchUpgrade = firmware && firmware !== latestFirmware

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/55 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full w-[460px] bg-noc-surface border-l border-noc-border z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-noc-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-noc-label mb-1.5">{title || 'Account List'}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-bold text-noc-fg">{isDeviceMode ? 'Device detail' : `${accounts.length} devices`}</span>
                {zoneLabel && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${ZONE_META[zone]?.border} ${ZONE_META[zone]?.text}`}>
                    {zoneLabel}
                  </span>
                )}
                {issueLabel && <IssueTag issue={issue} label={issueLabel} />}
                {segment && <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold border-cyan-300/35 text-cyan-200 bg-cyan-400/10">{segment}</span>}
                {firmware && <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold border-green-300/35 text-green-200 bg-green-400/10">{firmware}</span>}
                {region && <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold border-blue-300/35 text-blue-200 bg-blue-400/10">{region}</span>}
                {isDeviceMode && device && <IssueTag issue={device.issue} label={device.label} />}
                {!hasScope && <span className="text-[10px] text-noc-muted/80">all zones</span>}
              </div>
              {showBatchUpgrade && (
                <button type="button" className="dashboard-action-button dashboard-primary-action mt-2">
                  Batch firmware upgrade to {latestFirmware}
                </button>
              )}
            </div>
            <button onClick={onClose} className="text-noc-muted hover:text-noc-fg transition-colors cursor-pointer mt-0.5"><X size={17} /></button>
          </div>
          {showIssueFactors && (
            <div className="dashboard-drawer-factors">
              <div className="dashboard-drawer-factor-head">
                <span>Issue factors</span>
                <em>{selectedFactor === 'all' ? 'All accounts' : `${DRAWER_FACTORS.find(factor => factor.key === selectedFactor)?.label} filter`}</em>
              </div>
              <div className="dashboard-drawer-factor-grid">
                <button
                  type="button"
                  className={`dashboard-drawer-factor ${selectedFactor === 'all' ? 'is-active' : ''}`}
                  onClick={() => { setSelectedFactor('all'); setPage(0) }}
                >
                  <strong>All</strong>
                  <span>{accounts.length}</span>
                </button>
                {factorCounts.map(factor => (
                  <button
                    key={factor.key}
                    type="button"
                    className={`dashboard-drawer-factor ${selectedFactor === factor.key ? 'is-active' : ''}`}
                    onClick={() => { setSelectedFactor(factor.key); setPage(0) }}
                  >
                    <strong>{factor.label}</strong>
                    <span>{factor.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {isDeviceMode && device ? (
            <div className="dashboard-device-detail">
              <div className="dashboard-device-score-card">
                <div>
                  <p>Health score</p>
                  <strong style={{ color: scoreColor(device.score) }}>{device.score}</strong>
                </div>
                <span style={{ background: scoreColor(device.score) }} />
              </div>
              <div className="dashboard-device-detail-grid">
                <div><span>Account</span><strong>{device.accountId}</strong></div>
                <div><span>Serial</span><strong>{device.serial}</strong></div>
                <div><span>Model</span><strong>{device.model}</strong></div>
                <div><span>Firmware</span><strong>{device.fw}</strong></div>
                <div><span>Region</span><strong>{device.regionName || region || accountRegionName(device)}</strong></div>
                <div><span>Location</span><strong>{device.loc}</strong></div>
                <div><span>Segment</span><strong>{device.segment}</strong></div>
                <div><span>Service tier</span><strong>{device.tier}</strong></div>
              </div>
              <div className="dashboard-device-detail-actions">
                <button type="button" onClick={() => onOpenAccount(device)}>Open customer detail</button>
                <button type="button">Run speed test</button>
                <button type="button">Pull live telemetry</button>
              </div>
            </div>
          ) : pageItems.length === 0
            ? <div className="flex items-center justify-center h-full text-noc-muted/50 text-sm">No devices in this segment</div>
            : pageItems.map(a => {
              const sc = scoreColor(a.score)
              const pip = { offline: { background: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.7)' }, degraded: { background: '#F59E0B' }, healthy: { background: '#22C55E' } }[a.status] || {}
              return (
                <div key={a.id} onClick={() => onOpenAccount(a)}
                  className="bg-noc-bg border border-noc-border rounded-xl px-4 py-3 cursor-pointer hover:border-noc-muted/50 hover:bg-noc-raised transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={pip} />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-noc-fg">{a.name}</div>
                        <div className="text-[10px] text-noc-muted font-mono mt-0.5 truncate">{a.serial} · {a.model}</div>
                        <div className="text-[10px] text-noc-muted/85 mt-0.5">{a.segment} · {a.tier} · {a.loc} · FW {a.fw}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <IssueTag issue={a.issue} label={a.label} />
                      <div className="flex items-center gap-1.5">
                        <div className="w-14 h-[3px] bg-noc-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${a.score}%`, background: sc }} />
                        </div>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: sc }}>{a.score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>

        {/* Pagination */}
        {!isDeviceMode && totalPages > 1 && (
          <div className="px-5 py-3 border-t border-noc-border flex items-center justify-between flex-shrink-0 dashboard-drawer-pager">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1 text-[11px] text-noc-muted hover:text-noc-fg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="text-[11px] text-noc-muted">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredAccounts.length)} of {filteredAccounts.length}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 text-[11px] text-noc-muted hover:text-noc-fg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Firmware verification ────────────────────────────────────────────────────
function FirmwareVerification({ onOpenFirmware }) {
  const yMin = 58
  const yMax = 78
  const [active, setActive] = useState(FW_HEALTH[FW_HEALTH.length - 1]?.label || null)

  return (
    <div className="dashboard-tool-panel dashboard-firmware-verify-panel dashboard-tab-panel">
      <div className="dashboard-fw-plot-wrap">
        <div className="dashboard-fw-y-axis">
          <span>78</span>
          <span>75</span>
          <span>72</span>
          <span>69</span>
          <span>66</span>
          <span>60</span>
        </div>
        <div className="dashboard-fw-plot">
          <div
            className="dashboard-fw-zero"
            style={{ top: `${((yMax - 70) / (yMax - yMin)) * 100}%` }}
          />
          {FW_HEALTH.map((item, index) => {
            const left = 8 + ((index / Math.max(FW_HEALTH.length - 1, 1)) * 84)
            const top = 8 + (((yMax - item.postHealth) / (yMax - yMin)) * 72)
            const size = Math.max(20, Math.min(36, Math.sqrt(item.count) * 1.1))
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setActive(item.label)
                  onOpenFirmware(item.label)
                }}
                className={`dashboard-fw-point ${active === item.label ? 'is-active' : ''}`}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  borderColor: `${item.color}99`,
                  background: `${item.color}40`,
                  boxShadow: `0 0 14px ${item.color}55`,
                }}
                aria-label={`${item.label} health score ${item.postHealth}`}
              />
            )
          })}
          <div className="dashboard-fw-inline-axis">
            {FW_HEALTH.map((item, index) => (
              <span
                key={item.label}
                className={index === 0 ? 'is-start' : index === FW_HEALTH.length - 1 ? 'is-end' : ''}
                style={{ left: `${8 + ((index / Math.max(FW_HEALTH.length - 1, 1)) * 84)}%` }}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-fw-legend">
        <span><i className="bg-red-500" />Regressed</span>
        <span><i className="bg-yellow-500" />Neutral</span>
        <span><i className="bg-green-500" />Improved</span>
        <span className="ml-auto">Bubble size = impacted accounts · Y-axis = health score</span>
      </div>

      <div className="dashboard-fw-evidence">
        {FW_HEALTH.map(item => {
          const totalFWAccounts = FW_HEALTH.reduce((sum, fw) => sum + fw.count, 0)
          const pct = ((item.count / totalFWAccounts) * 100).toFixed(1)
          return (
            <button
              type="button"
              key={item.label}
              className={`dashboard-fw-evidence-row ${active === item.label ? 'is-active' : ''}`}
              onClick={() => {
                setActive(item.label)
                onOpenFirmware(item.label)
              }}
            >
              <span><strong>{item.label}</strong> · {pct}%</span>
              <span>{item.stage} · {item.count.toLocaleString()} accts</span>
              <div className={item.healthDelta > 0 ? 'is-up' : 'is-down'}>
                {item.healthDelta > 0 ? '+' : ''}{item.healthDelta.toFixed(1)} pts
              </div>
              <div>{Math.round(item.confidence * 100)}% conf</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
// ── Regional heatmap with map visualization ────────────────────────────────────
function RegionalHeatmap({ openDrawer }) {
  return (
    <div className="dashboard-tool-panel dashboard-region-panel dashboard-tab-panel">
      <GeoMap
        onRegionSelect={(regionId, regionName) => openDrawer({
          region: regionName,
          title: `${regionName} accounts`,
        })}
        onDeviceSelect={(device) => openDrawer({
          device,
          region: device.regionName,
          title: `${device.accountId} device`,
        })}
      />
    </div>
  )
}

function DashboardInsightsTabs({ openDrawer, onOpenFirmware }) {
  const [activeTab, setActiveTab] = useState('region')
  const activeMeta = activeTab === 'region'
    ? {
        icon: BarChart3,
        label: 'Region Health',
        detail: 'Interactive regional map. Click regions to open the account drawer.',
      }
    : {
        icon: Cpu,
        label: 'Firmware Intelligence',
        detail: 'Health score vs version. Click a version to open the account drawer.',
      }

  return (
    <div className="dashboard-health-card dashboard-health-card-tabs">
      <SectionHeader
        icon={activeMeta.icon}
        label={activeMeta.label}
        detail={activeMeta.detail}
        action={(
          <div className="dashboard-insight-tabs" role="tablist" aria-label="Health insight views">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'region'}
              className={activeTab === 'region' ? 'is-active' : ''}
              onClick={() => setActiveTab('region')}
            >
              Region Health
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'firmware'}
              className={activeTab === 'firmware' ? 'is-active' : ''}
              onClick={() => setActiveTab('firmware')}
            >
              Firmware Intelligence
            </button>
          </div>
        )}
      />
      {activeTab === 'region'
        ? <RegionalHeatmap openDrawer={openDrawer} />
        : <FirmwareVerification onOpenFirmware={onOpenFirmware} />}
    </div>
  )
}

function DashboardHealthRow({ openDrawer, onOpenFirmware }) {
  return (
    <section className="dashboard-ops-band dashboard-ops-band-last dashboard-health-row-band">
      <div className="dashboard-health-row-grid">
        <NetworkHealthCommand
          onOpenZone={zone => openDrawer({
            zone,
            title: `${ZONE_META[zone]?.label || 'Scoped'} accounts`,
          })}
        />
        <DashboardInsightsTabs
          openDrawer={openDrawer}
          onOpenFirmware={onOpenFirmware}
        />
      </div>
    </section>
  )
}

// ── Search panel ─────────────────────────────────────────────────────────────
function DashboardSearchPanel({ recentSearches, onSelectCustomer, onLog }) {
  const { query, results, isSearching, setQuery, clearSearch } = useSearch()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [keyboardIndex, setKeyboardIndex] = useState(-1)
  const inputRef = useRef(null), containerRef = useRef(null)

  useEffect(() => {
    const shouldOpen = query.length >= 2 || isSearching || (query.length === 0 && recentSearches.length > 0 && dropdownOpen)
    if (!shouldOpen) return undefined

    const id = window.setTimeout(() => setDropdownOpen(true), 0)
    return () => window.clearTimeout(id)
  }, [query, isSearching, recentSearches.length, dropdownOpen])

  useEffect(() => {
    const handleOut = e => { if (containerRef.current && !containerRef.current.contains(e.target)) { setDropdownOpen(false); setKeyboardIndex(-1) } }
    document.addEventListener('mousedown', handleOut)
    return () => document.removeEventListener('mousedown', handleOut)
  }, [])

  function handleSelect(customer) {
    onLog?.('CUSTOMER_SELECTED', { serial: customer.serial })
    setDropdownOpen(false); setKeyboardIndex(-1); clearSearch(); onSelectCustomer(customer)
  }

  function handleKeyDown(e) {
    const rows = [...recentSearches, ...results.filter(r => !recentSearches.find(rc => rc.id === r.id))]
    if (e.key === 'ArrowDown') { e.preventDefault(); setKeyboardIndex(i => Math.min(i + 1, rows.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setKeyboardIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && keyboardIndex >= 0 && rows[keyboardIndex]) { e.preventDefault(); handleSelect(rows[keyboardIndex]) }
    else if (e.key === 'Escape') { setDropdownOpen(false); setKeyboardIndex(-1); inputRef.current?.blur() }
  }

  return (
    <div className="dashboard-search-band px-5 py-2">
      <div ref={containerRef} className="relative">
        <div className={`dashboard-tech-search flex items-center gap-3 bg-noc-surface border rounded-xl px-4 h-10 transition-all duration-150 ${dropdownOpen ? 'border-noc-info ring-1 ring-noc-info/30' : 'border-noc-border hover:border-noc-muted'}`}>
          {isSearching ? <div className="w-4 h-4 border border-noc-info border-t-transparent rounded-full animate-spin shrink-0" /> : <Search size={16} className="text-noc-muted shrink-0" />}
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
            onFocus={() => { if (recentSearches.length > 0 || query.length >= 2) setDropdownOpen(true) }}
            onKeyDown={handleKeyDown}
            placeholder="Search by Serial #, Phone, Account, or Customer Name…"
            autoComplete="off" spellCheck={false}
            className="flex-1 bg-transparent text-noc-fg placeholder:text-noc-muted/60 focus:outline-none text-sm" />
          {query
            ? <button onClick={() => { clearSearch(); setDropdownOpen(false); inputRef.current?.focus() }} className="text-noc-muted hover:text-noc-fg transition-colors cursor-pointer"><X size={15} /></button>
            : <span className="text-noc-muted text-xs hidden sm:block shrink-0">Network / Customer Lookup</span>}
        </div>
        {dropdownOpen && <SearchDropdown recentSearches={recentSearches} results={results} isSearching={isSearching} query={query} onSelect={handleSelect} keyboardIndex={keyboardIndex} />}
      </div>
    </div>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function DashboardPage({ onLog, onOpenCustomer }) {
  const [recentSearches, setRecentSearches] = useState([])
  const [showFormula, setShowFormula] = useState(false)
  const [trendRange, setTrendRange] = useState('30d')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerZone, setDrawerZone] = useState(null)
  const [drawerIssue, setDrawerIssue] = useState(null)
  const [drawerSegment, setDrawerSegment] = useState(null)
  const [drawerFirmware, setDrawerFirmware] = useState(null)
  const [drawerRegion, setDrawerRegion] = useState(null)
  const [drawerDevice, setDrawerDevice] = useState(null)
  const [drawerTitle, setDrawerTitle] = useState('Account List')

  function openDrawer({ zone = null, issue = null, segment = null, firmware = null, region = null, device = null, title = 'Account List' } = {}) {
    setDrawerZone(zone)
    setDrawerIssue(issue)
    setDrawerSegment(segment)
    setDrawerFirmware(firmware)
    setDrawerRegion(region)
    setDrawerDevice(device)
    setDrawerTitle(title)
    setDrawerOpen(true)
  }

  const drawerAccounts = useMemo(() => {
    let list = DASH_ACCOUNTS
    if (drawerZone) list = list.filter(a => inZone(a.score, drawerZone))
    if (drawerIssue) list = list.filter(a => a.issue === drawerIssue)
    if (drawerSegment) list = list.filter(a => a.segment === drawerSegment)
    if (drawerFirmware) list = list.filter(a => a.fw === drawerFirmware)
    if (drawerRegion) list = list.filter(a => accountRegionName(a) === drawerRegion)
    if (drawerDevice) list = [drawerDevice]
    return list
  }, [drawerZone, drawerIssue, drawerSegment, drawerFirmware, drawerRegion, drawerDevice])

  const trendData = useMemo(() => (
    normalizeTrendData(FLEET_SCORE.trends?.[trendRange] || FLEET_SCORE.trend)
  ), [trendRange])
  const trendStats = useMemo(() => getTrendStats(trendData), [trendData])

  function handleSelectCustomer(c) {
    setRecentSearches(prev => [c, ...prev.filter(p => p.id !== c.id)].slice(0, 5))
    onOpenCustomer?.(c)
  }

  function handleOpenAccount(account) {
    const c = mockCustomers.find(c => c.serial === account.serial) || mockCustomers[0]
    onLog?.('DASHBOARD_ACCOUNT_OPENED', { serial: account.serial })
    setDrawerOpen(false)
    onOpenCustomer?.(c)
  }

  return (
    <div className="dashboard-tech-bg dashboard-page-compact flex-1 overflow-y-auto scrollbar-dark bg-noc-bg">

      <DashboardSearchPanel recentSearches={recentSearches} onSelectCustomer={handleSelectCustomer} onLog={onLog} />

      {/* ── Hero strip ─────────────────────────────────────────────────── */}
      <div className="dashboard-hero-header px-4 sm:px-5 pt-2 pb-1">
        <h2>Fleet Health Score</h2>
        <p>Real-time fleet health, trend direction, and operational KPI overview</p>
      </div>
      <div className="dashboard-tech-hero dashboard-fleet-hero-grid border-y border-noc-border/70">

        {/* Animated gauge */}
        <div className="dashboard-tech-cell px-3 py-2 border-b border-noc-border/80 xl:border-b-0 xl:border-r flex flex-col items-center justify-center gap-1">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-noc-label">Fleet score dial</p>
          <GaugeChart score={FLEET_SCORE.current} delta={FLEET_SCORE.delta} />
          <button onClick={() => setShowFormula(f => !f)}
            className="text-[11px] text-noc-muted/85 hover:text-noc-fg flex items-center gap-1 cursor-pointer transition-colors">
            <Info size={10} /> How scored? {showFormula ? '▴' : '▾'}
          </button>
        </div>

        {/* Interactive line trend */}
        <div className="dashboard-tech-cell px-4 py-3 border-b border-noc-border/80 xl:border-b-0 xl:border-r flex flex-col justify-between">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-noc-label">
                {trendRange === '30d' ? '30-Day Trend' : '7-Day Trend'}
              </p>
            </div>
            <div className="dashboard-toggle" role="group" aria-label="Trend range">
              {[
                ['30d', '30D'],
                ['7d', '7D'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={trendRange === key}
                  onClick={() => setTrendRange(key)}
                  className={trendRange === key ? 'is-active' : ''}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <TrendLineChart data={trendData} />
          <div className="mt-2 flex items-center gap-5">
            {[
              ['Low', formatScore(trendStats.low)],
              ['Avg', formatScore(trendStats.avg)],
              ['High', formatScore(trendStats.high)],
            ].map(([k, v]) => (
              <span key={k} className="text-[11px] text-noc-muted/90">
                {k}: <span className="text-noc-fg font-semibold font-mono tabular-nums">{v}</span>
              </span>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        <div className="dashboard-kpi-compact-grid">
          {HERO_KPIS.map(kpi => (
            <div key={kpi.label} className="dashboard-tech-kpi px-3 py-2 flex flex-col justify-center hover:bg-noc-raised/40 transition-colors">
              <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-noc-label mb-0.5">{kpi.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[17px] font-bold text-noc-fg tabular-nums">{kpi.value}</span>
                <span className={`text-[11px] font-semibold ${kpi.trend === 'up' ? 'text-noc-accent' : kpi.trend === 'down' ? 'text-noc-danger' : 'text-noc-muted'}`}>
                  {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'} {kpi.trendVal}
                </span>
              </div>
              <p className="text-[11px] text-noc-muted/85 mt-0.5 leading-tight">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formula */}
      {showFormula && (
        <section className="dashboard-ops-band dashboard-formula-band">
          <SectionHeader
            icon={Info}
            label="Composite formula — 0 to 100 pts"
            detail="Offline devices always score 0"
          />
          <div className="dashboard-tool-panel dashboard-formula-panel">
            {[['WAN speed vs. provisioned tier', 30, '#3B82F6'], ['Latency (target < 20 ms)', 20, '#06B6D4'], ['Packet loss (target 0%)', 20, '#A855F7'], ['WiFi channel health + band steering', 20, '#F59E0B'], ['Equipment stability (reboots / day)', 10, '#22C55E']].map(([name, pts, c]) => (
              <div key={name} className="dashboard-formula-row">
                <span>{name}</span>
                <div><div style={{ width: `${pts}%`, background: c, boxShadow: `0 0 8px ${c}55` }} /></div>
                <strong>{pts} pts</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Health row: segmentation + region / firmware tabs ───────────── */}
      <DashboardHealthRow
        openDrawer={openDrawer}
        onOpenFirmware={version => openDrawer({
          firmware: version,
          title: `Firmware ${version} accounts`,
        })}
      />

      {/* ── Account Drawer ──────────────────────────────────────────────── */}
      <AccountDrawer
        key={`${drawerZone || 'all'}-${drawerIssue || 'all'}-${drawerSegment || 'all'}-${drawerFirmware || 'all'}-${drawerRegion || 'all'}-${drawerDevice?.id || 'all'}`}
        open={drawerOpen}
        title={drawerTitle}
        zone={drawerZone}
        issue={drawerIssue}
        segment={drawerSegment}
        firmware={drawerFirmware}
        region={drawerRegion}
        device={drawerDevice}
        accounts={drawerAccounts}
        onClose={() => setDrawerOpen(false)}
        onOpenAccount={handleOpenAccount}
      />
    </div>
  )
}
