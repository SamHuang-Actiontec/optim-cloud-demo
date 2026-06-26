import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, CheckCircle2, Bot, X, Send, Cpu, Router, Gauge, ShieldCheck, Wifi, Radio } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'

const ANALYZE_MS = 2400

// ── Priority token — matches Zone 5 exactly ───────────────────────────────────
const P = {
  high: 'bg-noc-danger/15 text-noc-danger border border-noc-danger/30',
  med:  'bg-noc-warning/15 text-noc-warning border border-noc-warning/30',
  low:  'bg-noc-info/15 text-noc-info border border-noc-info/30',
}
const P_LABEL = { high: 'HIGH', med: 'MED', low: 'LOW' }

// ── Score ring — color driven by status, not numeric threshold ────────────────
function ScoreRing({ score, status, size = 64 }) {
  const { theme } = useTheme()
  if (status === 'suspended' || status === 'disconnected' || status === 'pending') return null
  const color = status === 'healthy' ? '#22C55E' : status === 'issues' ? '#F59E0B' : '#EF4444'
  const ringTrack   = theme === 'light' ? '#E2E8F0' : '#1E293B'
  const subTextFill = theme === 'light' ? '#64748B' : '#94A3B8'
  const r = (size - 8) / 2
  const cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.max(score, 0) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={ringTrack} strokeWidth={6} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={circ - dash}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
      <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="17" fontWeight="800" fontFamily="'Fira Code', monospace">
        {score}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle"
        fill={subTextFill} fontSize="7" fontFamily="'Fira Sans', sans-serif" letterSpacing="1">
        /100
      </text>
    </svg>
  )
}

// ── Dots ●●● ─────────────────────────────────────────────────────────────────
function Dots({ count, max = 3 }) {
  return (
    <span className="inline-flex gap-0.5 items-center flex-shrink-0">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`inline-block w-2 h-2 rounded-full ${i < count ? 'bg-noc-warning' : 'bg-noc-border'}`} />
      ))}
    </span>
  )
}

function buildHealthDomains(ai) {
  const base = ai?.healthScore ?? 50
  const pressure = ai?.issueCount ? Math.min(18, ai.issueCount * 6) : 0
  const values = [
    Math.max(0, Math.min(100, base - pressure + 6)),
    Math.max(0, Math.min(100, base - pressure + 2)),
    Math.max(0, Math.min(100, base - pressure - 5)),
    Math.max(0, Math.min(100, base - pressure - 1)),
    Math.max(0, Math.min(100, base - pressure + 1)),
    Math.max(0, Math.min(100, base - pressure - 3)),
  ]
  return [
    { label: 'Device', icon: Cpu, score: values[0] },
    { label: 'Coverage', icon: Router, score: values[1] },
    { label: 'Capacity', icon: Gauge, score: values[2] },
    { label: 'Stability', icon: ShieldCheck, score: values[3] },
    { label: 'Quality', icon: Wifi, score: values[4] },
    { label: 'Environment', icon: Radio, score: values[5] },
  ]
}

function DomainState(score) {
  if (score >= 80) return 'healthy'
  if (score >= 50) return 'degraded'
  return 'critical'
}

// ── Consistent zone action button — shared style ──────────────────────────────
function ActionPanelButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-noc-border/60 text-noc-fg hover:border-noc-border hover:bg-noc-raised transition-colors cursor-pointer font-semibold"
    >
      Go to Action Panel →
    </button>
  )
}

// ── Ask AI dialog ─────────────────────────────────────────────────────────────
const MOCK_RESPONSES = [
  "Based on the diagnostic data, the 2.4GHz channel 6 is showing 74% utilization with 30+ competing networks — well above the 50% congestion threshold. The most effective fix is pushing a channel change to Ch 1 or Ch 11, which both show much lower neighbor density. This takes ~10 seconds and won't interrupt the customer's connection.",
  "The packet loss of 1.2% combined with the upload speed being 39% below the 30-day average is consistent with upstream signal degradation at the DOCSIS layer. I'd recommend checking Rx/Tx optical power levels in Zone 3 and pulling the last 7 days of connection events for any pattern of micro-outages.",
  "For communicating this to the customer, you might say: 'Your home network is experiencing interference from neighboring WiFi networks in the area. We can push a quick channel change from your current Channel 6 to a cleaner channel — it takes about 10 seconds and everything should reconnect automatically.'",
]

function AskAIDialog({ ai, customer, onClose }) {
  const [input, setInput]       = useState('')
  const [thinking, setThinking] = useState(false)
  const mockIdxRef              = useRef(0)
  const messagesEndRef          = useRef(null)

  const issueText = ai?.issue?.rootCause
    ? `The primary concern is "${ai.issue.rootCause}" (${ai.issue.confidence}% confidence)`
    : 'No critical issues were found'

  const greeting = `Hi there! I'm your Network Intelligence Assistant — I've just finished analyzing ${customer?.name ?? 'this account'}'s network.\n\n${issueText}. I detected ${ai?.issueCount ?? 0} active issue${ai?.issueCount !== 1 ? 's' : ''} and I'm ready to help.\n\nI can:\n• Explain what each diagnostic indicator means\n• Walk through remediation steps in detail\n• Help you communicate the issue to the customer\n• Analyze historical patterns across zones\n\nWhat would you like to know?`

  const [messages, setMessages] = useState([{ role: 'ai', text: greeting }])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  function handleSend() {
    const q = input.trim()
    if (!q || thinking) return
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      const idx = mockIdxRef.current % MOCK_RESPONSES.length
      mockIdxRef.current += 1
      setThinking(false)
      setMessages(prev => [...prev, { role: 'ai', text: MOCK_RESPONSES[idx] }])
    }, 1400 + Math.random() * 600)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-noc-surface border border-noc-border rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '82vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-noc-border bg-noc-raised/50 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-noc-info/15 border border-noc-info/30 flex items-center justify-center">
              <Bot size={18} className="text-noc-info" />
            </div>
            <div>
              <p className="text-sm font-semibold text-noc-fg">Ask AI — Network Intelligence</p>
              <p className="text-xs text-noc-muted">Context-aware for this account · Powered by Optim AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-noc-muted hover:text-noc-fg transition-colors cursor-pointer rounded-lg hover:bg-noc-raised"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-dark">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-noc-info/15 border border-noc-info/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={13} className="text-noc-info" />
                </div>
              )}
              <div className={`text-sm leading-relaxed whitespace-pre-wrap rounded-xl px-4 py-3 ${
                m.role === 'ai'
                  ? 'bg-noc-raised border border-noc-border text-noc-fg max-w-[88%]'
                  : 'bg-noc-info/15 border border-noc-info/25 text-noc-fg max-w-[75%]'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-noc-info/15 border border-noc-info/25 flex items-center justify-center flex-shrink-0">
                <Bot size={13} className="text-noc-info animate-pulse" />
              </div>
              <div className="bg-noc-raised border border-noc-border rounded-xl px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-noc-muted animate-bounce" style={{ animationDelay: '0ms'   }} />
                <span className="w-1.5 h-1.5 rounded-full bg-noc-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-noc-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-noc-border bg-noc-raised/30 rounded-b-2xl flex-shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask about this network, root cause, remediation steps…"
              className="flex-1 bg-noc-raised border border-noc-border rounded-xl px-4 py-2.5 text-sm text-noc-fg placeholder-noc-muted/50 focus:outline-none focus:border-noc-info/50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              className="px-4 py-2.5 bg-noc-info rounded-xl text-white font-semibold hover:bg-noc-info/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-2xs text-noc-muted/40 mt-2">Press Enter to send · Responses are AI-generated for demonstration</p>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Zone2AIDiagnosis({ ai, customer, showReanalyze = true }) {
  const [phase, setPhase]       = useState('loading')
  const [progress, setProgress] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [diagMins, setDiagMins] = useState(0)
  const [askAIOpen, setAskAIOpen] = useState(false)
  const rafRef   = useRef(null)
  const startRef = useRef(null)
  const timerRef = useRef(null)

  // Analysis animation
  useEffect(() => {
    setPhase('loading'); setProgress(0); setDiagMins(0)
    startRef.current = performance.now()
    const animate = (now) => {
      const t     = Math.min((now - startRef.current) / ANALYZE_MS, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(Math.round(eased * 100))
      if (t < 1) rafRef.current = requestAnimationFrame(animate)
      else        setTimeout(() => setPhase('done'), 280)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [refreshKey, ai])

  // Staleness ticker — increments every minute after analysis completes
  useEffect(() => {
    if (phase !== 'done') return
    timerRef.current = setInterval(() => setDiagMins(m => m + 1), 60000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const isSpecial = ai.status === 'suspended' || ai.status === 'disconnected' || ai.status === 'pending'
  const isStale   = diagMins >= 21
  const healthDomains = buildHealthDomains(ai)

  // Timestamp label + color
  const tsLabel = diagMins === 0 ? 'just now' : `${diagMins} min ago`
  const tsColor = diagMins <= 10 ? 'text-noc-muted'
    : diagMins <= 20 ? 'text-noc-warning'
    : 'text-noc-danger'

  // Status display
  const statusColor = ai.status === 'healthy' ? 'text-noc-accent'
    : (ai.status === 'critical' || isSpecial) ? 'text-noc-danger'
    : 'text-noc-warning'

  const statusTitle = ai.status === 'healthy'      ? 'Healthy'
    : ai.status === 'issues'      ? 'Degraded'
    : ai.status === 'critical'    ? 'Offline'
    : ai.status === 'suspended'   ? 'Suspended'
    : ai.status === 'disconnected'? 'Disconnected'
    : ai.status === 'pending'     ? 'Install Pending'
    : 'Degraded'

  const handleGoToActions = () => {
    document.getElementById('zone5')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="bg-noc-surface border border-noc-border rounded-xl overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-noc-border bg-noc-raised/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-noc-fg whitespace-nowrap">AI Network Diagnosis</span>
          {phase === 'done' && ai.issueCount > 0 && (
            <span className={`text-xs rounded-full px-2 py-0.5 font-semibold border whitespace-nowrap flex-shrink-0
              ${ai.status === 'critical'
                ? 'bg-noc-danger/20 text-noc-danger border-noc-danger/30'
                : 'bg-noc-warning/20 text-noc-warning border-noc-warning/30'}`}>
              {ai.issueCount} issue{ai.issueCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => setAskAIOpen(true)}
            className="btn-ask-ai flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-noc-info/50 text-noc-info bg-noc-info/10 hover:bg-noc-info/20 transition-colors cursor-pointer font-semibold flex-shrink-0"
          >
            <Bot size={12} />
            Ask AI
          </button>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {phase === 'done' && (
            <span className={`text-xs whitespace-nowrap ${tsColor}`}>
              Diagnosed {tsLabel}{diagMins >= 11 ? ' ⚠' : ''}
            </span>
          )}
          {showReanalyze && (
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={phase === 'loading'}
              className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap
                ${isStale
                  ? 'text-noc-warning border border-noc-warning/50 rounded px-2 py-0.5'
                  : 'text-noc-muted hover:text-noc-fg'}`}
            >
              <RefreshCw size={12} className={phase === 'loading' ? 'animate-spin' : ''} />
              Re-analyze
            </button>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {phase === 'loading' && (
        <div className="px-5 py-5">
          <div className="flex items-center justify-between text-xs text-noc-muted mb-2">
            <span>Analyzing network indicators…</span>
            <span className="font-code text-noc-fg font-semibold">{progress}%</span>
          </div>
          <div className="h-1 bg-noc-raised rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-noc-info to-noc-accent"
              style={{ width: `${progress}%`, transition: 'width 50ms linear' }} />
          </div>
        </div>
      )}

      {/* ── Done — 2-column ── */}
      {phase === 'done' && (
        <div className="grid grid-cols-[52fr_48fr] divide-x divide-noc-border/35">

          {/* LEFT — Diagnosis */}
          <div className="px-5 py-4 space-y-3">

            {/* Score + title */}
            <div className="flex items-center gap-3">
              <ScoreRing score={ai.healthScore} status={ai.status} />
              <div>
                <p className={`font-bold text-sm ${statusColor}`}>{statusTitle}</p>
                <p className="text-xs text-noc-muted mt-0.5">
                  {ai.status === 'healthy'
                    ? `${ai.analyzedCount} indicators checked`
                    : ai.issueCount > 0
                      ? `${ai.issueCount} issue${ai.issueCount !== 1 ? 's' : ''} diagnosed`
                      : 'Diagnostics unavailable'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {healthDomains.map((domain) => {
                const state = DomainState(domain.score)
                const Icon = domain.icon
                return (
                  <div key={domain.label} className="border border-noc-border/60 rounded-lg p-2 bg-noc-bg/40">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] text-noc-label uppercase tracking-wide">
                        <Icon size={10} />
                        {domain.label}
                      </span>
                      <span className="text-[10px] font-code text-noc-fg">{domain.score}</span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-noc-border/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          state === 'healthy'
                            ? 'bg-noc-accent'
                            : state === 'degraded'
                              ? 'bg-noc-warning'
                              : 'bg-noc-danger'
                        }`}
                        style={{ width: `${domain.score}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* HEALTHY — top indicator rows */}
            {ai.status === 'healthy' && ai.topIndicators && (
              <div className="space-y-1.5">
                {ai.topIndicators.map((ind, i) => (
                  <div key={i} className="grid grid-cols-[14px_76px_1fr_auto] items-center gap-x-2 text-xs">
                    <CheckCircle2 size={11} className="text-noc-accent" />
                    <span className="text-noc-label">{ind.label}</span>
                    <span className="text-noc-fg font-code truncate">{ind.value}</span>
                    <span className="text-noc-muted">{ind.verdict}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ISSUES — root cause + unified factor rows (symptoms + weights combined) */}
            {ai.issue && (
              <>
                <div>
                  <p className="text-sm font-semibold text-noc-fg leading-snug">{ai.issue.rootCause}</p>
                  <p className="text-xs text-noc-label mt-0.5">{ai.issue.confidence}% confidence</p>
                </div>

                <div className="space-y-1.5">
                  {ai.issue.factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Dots count={f.dots} />
                      <span className="text-noc-fg flex-1 leading-snug">{f.label}</span>
                      <span className="text-noc-label font-code flex-shrink-0">{f.pct}%</span>
                    </div>
                  ))}
                  {ai.secondaryIssues?.map((s, i) => (
                    <div key={`s${i}`} className="flex items-center gap-2 text-xs text-noc-label">
                      <span className="w-6 flex-shrink-0 text-center">–</span>
                      <span className="leading-snug">{s}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* SPECIAL states */}
            {isSpecial && !ai.issue && (
              <p className="text-xs text-noc-muted">
                {ai.status === 'suspended'    ? 'Account suspended — diagnostics unavailable.'
                  : ai.status === 'pending'   ? 'Install pending — no data to analyze.'
                  : 'Service disconnected — no data to analyze.'}
              </p>
            )}
          </div>

          {/* RIGHT — Action / Status */}
          <div className="px-5 py-4">

            {/* HEALTHY */}
            {ai.status === 'healthy' && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-noc-accent flex-shrink-0" />
                  <span className="text-xs font-semibold text-noc-accent">No action needed</span>
                </div>
                {ai.minorObservations?.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-noc-border/35">
                    {ai.minorObservations.map((obs, i) => (
                      <p key={i} className="text-xs text-noc-muted">· {obs}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ISSUES — recommended actions (priority matches Zone 5 tokens) */}
            {ai.issue?.action && (
              <div className="space-y-4">
                {/* Primary */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-2xs font-bold rounded px-1.5 py-0.5 ${P[ai.issue.action.primary.priority] ?? P.med}`}>
                      {P_LABEL[ai.issue.action.primary.priority] ?? 'MED'}
                    </span>
                    <span className="text-xs font-semibold text-noc-fg">{ai.issue.action.primary.label}</span>
                  </div>
                  <p className="text-xs text-noc-muted mb-2.5">{ai.issue.action.primary.detail}</p>
                  <ActionPanelButton onClick={handleGoToActions} />
                </div>

                {/* Secondary */}
                {ai.issue.action.secondary && (
                  <div className="pt-3 border-t border-noc-border/35">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-2xs font-bold rounded px-1.5 py-0.5 ${P[ai.issue.action.secondary.priority] ?? P.low}`}>
                        {P_LABEL[ai.issue.action.secondary.priority] ?? 'LOW'}
                      </span>
                      <span className="text-xs font-medium text-noc-fg">{ai.issue.action.secondary.label}</span>
                    </div>
                    <p className="text-xs text-noc-muted">{ai.issue.action.secondary.detail}</p>
                  </div>
                )}
              </div>
            )}

            {/* SPECIAL */}
            {isSpecial && (
              <p className="text-xs text-noc-muted">See Action Panel for next steps.</p>
            )}
          </div>

        </div>
      )}

      {askAIOpen && (
        <AskAIDialog ai={ai} customer={customer} onClose={() => setAskAIOpen(false)} />
      )}
    </div>
  )
}
