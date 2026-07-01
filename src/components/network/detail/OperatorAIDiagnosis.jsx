import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  Gauge,
  Radio,
  RefreshCw,
  Router,
  Send,
  ShieldCheck,
  Sparkles,
  Wifi,
  X,
  Zap,
} from 'lucide-react'

const STATUS_MAP = {
  healthy: 'healthy',
  degraded: 'degraded',
  issues: 'degraded',
  warning: 'degraded',
  critical: 'critical',
  offline: 'critical',
  disconnected: 'critical',
  suspended: 'critical',
  unknown: 'unknown',
  pending: 'unknown',
}

const DOMAINS = [
  {
    key: 'device',
    label: 'Device',
    shortLabel: 'CPE + clients',
    icon: Cpu,
    measures: ['Client census', 'Band steering efficiency', 'Firmware/model capabilities'],
    keywords: ['client census', 'device', 'firmware', 'model', 'band steering', 'steering', 'gateway', 'capability'],
    healthy: 'Device capability and client inventory are aligned with service tier.',
    degraded: 'Device policy or client distribution is limiting the customer experience.',
    action: 'Validate CPE model, firmware branch, and band-steering policy before changing service settings.',
  },
  {
    key: 'coverage',
    label: 'Coverage',
    shortLabel: 'mesh + RSSI',
    icon: Router,
    measures: ['Mesh topology', 'Upstream RSSI', 'Backhaul link quality', 'Hop count'],
    keywords: ['mesh', 'topology', 'rssi', 'backhaul', 'hop', 'weak', 'signal', 'extender', 'placement'],
    healthy: 'Coverage path and mesh topology are within expected operating range.',
    degraded: 'Weak coverage or backhaul quality may be driving intermittent service quality.',
    action: 'Review topology, weak-client locations, and extender placement before escalation.',
  },
  {
    key: 'capacity',
    label: 'Capacity',
    shortLabel: 'radio headroom',
    icon: Gauge,
    measures: ['Channel utilization', 'Throughput headroom', 'PHY-rate headroom per radio'],
    keywords: ['capacity', 'util', 'throughput', 'phy', 'headroom', 'speed', 'channel util', 'congested'],
    healthy: 'Radio and WAN capacity have enough headroom for the current service tier.',
    degraded: 'Capacity headroom is constrained; throughput may drop during busy periods.',
    action: 'Check channel utilization, speed-test history, and radio headroom before applying changes.',
  },
  {
    key: 'stability',
    label: 'Stability',
    shortLabel: 'events + uptime',
    icon: ShieldCheck,
    measures: ['Uptime', 'Reboot count', 'WAN/backhaul events', 'CPU & memory headroom'],
    keywords: ['uptime', 'reboot', 'event', 'watchdog', 'crash', 'memory', 'cpu', 'offline', 'stability'],
    healthy: 'No material instability pattern is visible in the recent event window.',
    degraded: 'Reboots or WAN/backhaul events suggest unstable CPE or service path behavior.',
    action: 'Inspect event history and schedule controlled remediation if crashes repeat.',
  },
  {
    key: 'quality',
    label: 'Quality',
    shortLabel: 'latency + loss',
    icon: Wifi,
    measures: ['End-to-end latency', 'Packet error/retransmission rate', 'Speed test scores'],
    keywords: ['latency', 'packet', 'loss', 'retransmission', 'retry', 'speed test', 'speed'],
    healthy: 'Latency, packet quality, and speed tests are inside expected tolerance.',
    degraded: 'Quality indicators show customer-visible impairment risk.',
    action: 'Run verification tests and compare loss, latency, and speed against baseline.',
  },
  {
    key: 'environment',
    label: 'Environment',
    shortLabel: 'RF conditions',
    icon: Radio,
    measures: ['Noise floor', 'Neighboring-AP interference', 'Channel congestion'],
    keywords: ['noise', 'neighbor', 'interference', 'ap', 'overlap', 'congestion', 'contested'],
    healthy: 'RF environment is clear enough for normal Wi-Fi operation.',
    degraded: 'RF interference or channel congestion is likely contributing to degradation.',
    action: 'Run channel scan and compare neighbor density before recommending Wi-Fi changes.',
  },
]

const DOMAIN_GEOMETRY = {
  device: { line: [360, 66, 200, 166], card: [138, 78] },
  coverage: { line: [360, 66, 520, 166], card: [582, 102] },
  capacity: { line: [520, 166, 520, 334], card: [614, 236] },
  stability: { line: [520, 334, 360, 424], card: [558, 420] },
  quality: { line: [360, 424, 200, 334], card: [162, 420] },
  environment: { line: [200, 334, 200, 166], card: [106, 258] },
}

const STATUS_COLOR = {
  healthy: '#22C55E',
  degraded: '#F59E0B',
  critical: '#EF4444',
  unknown: '#64748B',
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function levelFromScore(score) {
  if (score >= 80) return 'healthy'
  if (score >= 50) return 'degraded'
  return 'critical'
}

function levelLabel(level) {
  if (level === 'critical') return 'Critical'
  if (level === 'degraded') return 'Degraded'
  if (level === 'healthy') return 'Healthy'
  return 'Unknown'
}

function operatorDisplayLevel(level) {
  return level === 'critical' ? 'degraded' : level
}

function domainColor(level) {
  return STATUS_COLOR[level] || STATUS_COLOR.unknown
}

function factorText(factor) {
  return `${factor?.label || ''} ${factor?.detail || ''}`.toLowerCase()
}

function factorImpact(factor, fallback = 16) {
  if (typeof factor?.pct === 'number') return factor.pct
  if (typeof factor?.dots === 'number') return factor.dots * 16
  return fallback
}

function domainMatchesFactor(domain, factor) {
  const text = factorText(factor)
  return domain.keywords.some((keyword) => text.includes(keyword))
}

function deriveDomainData(ai, healthScore, normalizedStatus) {
  const factors = ai?.issue?.factors || []
  const issueCount = ai?.issueCount || 0
  const fallbackScores = normalizedStatus === 'critical'
    ? { stability: 32, quality: 38, capacity: 46, device: 56 }
    : normalizedStatus === 'degraded'
      ? { quality: 60, capacity: 62, environment: 66 }
      : {}
  const fallbackRisks = {
    device: 'Live telemetry / service status',
    capacity: 'Throughput headroom',
    quality: 'Customer-visible quality',
    stability: 'WAN/backhaul events',
    environment: 'RF congestion risk',
  }

  return DOMAINS.map((domain, index) => {
    const evidence = factors.filter((factor) => domainMatchesFactor(domain, factor))
    const evidenceImpact = evidence.reduce((sum, factor) => sum + factorImpact(factor), 0)
    const noEvidenceScore = normalizedStatus === 'unknown' || normalizedStatus === 'pending'
      ? 72
      : 88 + ((index % 3) * 2)
    const fallbackScore = issueCount > 0 ? fallbackScores[domain.key] : undefined
    const score = evidence.length
      ? clamp(100 - evidenceImpact - Math.max(0, issueCount - 1) * 3, 24, 92)
      : typeof fallbackScore === 'number'
        ? fallbackScore
      : clamp(noEvidenceScore, 0, 96)
    const level = levelFromScore(score)

    return {
      ...domain,
      score,
      level,
      evidence,
      diagnosis: level === 'healthy' ? domain.healthy : domain.degraded,
      risk: evidence.length ? evidence[0].label : fallbackRisks[domain.key] || domain.measures[0],
    }
  })
}

function domainStatusClass(level, selected, hovered) {
  return [
    `operator-domain-card is-${level}`,
    level !== 'healthy' ? 'is-actionable' : 'is-overall-link',
    selected ? 'is-selected' : '',
    hovered ? 'is-hovered' : '',
  ].filter(Boolean).join(' ')
}

function actionPriorityClass(priority) {
  if (priority === 'high') return 'is-high'
  if (priority === 'med' || priority === 'medium') return 'is-med'
  return 'is-low'
}

function priorityRank(priority) {
  if (priority === 'high') return 0
  if (priority === 'med' || priority === 'medium') return 1
  return 2
}

function domainSummary(domain) {
  if (domain.level === 'healthy') {
    if (domain.key === 'device') return 'Normal'
    if (domain.key === 'coverage') return 'Coverage OK'
    if (domain.key === 'capacity') return 'Headroom OK'
    if (domain.key === 'stability') return 'Stable'
    if (domain.key === 'quality') return 'Quality OK'
    if (domain.key === 'environment') return 'RF clear'
    return 'Healthy'
  }

  if (domain.evidence?.[0]?.label) return domain.evidence[0].label
  if (domain.key === 'coverage') return 'Weak coverage path'
  if (domain.key === 'capacity') return 'Limited headroom'
  if (domain.key === 'stability') return 'Recent events'
  if (domain.key === 'quality') return 'Quality risk'
  if (domain.key === 'environment') return 'Interference risk'
  return domain.risk
}

function buildFallbackActions(domains) {
  return domains
    .filter((domain) => domain.level !== 'healthy')
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((domain, idx) => ({
      id: `auto-${domain.key}`,
      domainKeys: [domain.key],
      priority: idx === 0 ? 'high' : 'med',
      title: `${domain.label} verification`,
      detail: domain.action,
      cta: 'Queue Action',
    }))
}

function actionMatchesDomain(action, domain) {
  const text = `${action.title || ''} ${action.detail || ''} ${action.cta || ''}`.toLowerCase()
  const isChannelAction = text.includes('channel') && !text.includes('not channel')
  if (domain.key === 'coverage') {
    return ['extender', 'weak client', 'weak-signal', 'placement', 'rssi', 'backhaul', 'mesh'].some((term) => text.includes(term))
  }
  if (domain.key === 'environment') {
    return isChannelAction || ['ap density', 'competing ap', 'contested', 'interference', 'noise', 'neighbor'].some((term) => text.includes(term))
  }
  if (domain.key === 'capacity') {
    return isChannelAction || ['speed', 'throughput', 'capacity', 'scheduler', 'headroom'].some((term) => text.includes(term))
  }
  if (domain.key === 'quality') {
    return ['packet', 'loss', 'latency', 'retry', 'speed'].some((term) => text.includes(term))
  }
  if (domain.key === 'stability') {
    return ['firmware', 'reboot', 'crash', 'watchdog', 'memory', 'stability', 'scheduler'].some((term) => text.includes(term))
  }
  if (domain.key === 'device') {
    return ['firmware', 'model', 'cpe', 'band steering', 'band', 'device'].some((term) => text.includes(term))
  }
  return false
}

function normalizeActionItems(initialActions, domains) {
  const actionableDomains = domains.filter((domain) => domain.level !== 'healthy')
  const actionableKeys = actionableDomains.map((domain) => domain.key)

  if (initialActions.length === 0) return buildFallbackActions(domains)

  const normalized = initialActions.map((action) => {
    const domainKeys = actionableDomains
      .filter((domain) => action.domainKeys?.includes(domain.key) || actionMatchesDomain(action, domain))
      .map((domain) => domain.key)

    return {
      ...action,
      domainKeys: domainKeys.length > 0 ? domainKeys : actionableKeys,
    }
  })

  const covered = new Set(normalized.flatMap((action) => action.domainKeys))
  const fallbackActions = actionableDomains
    .filter((domain) => !covered.has(domain.key))
    .map((domain) => ({
      id: `auto-${domain.key}`,
      domainKeys: [domain.key],
      priority: domain.level === 'critical' ? 'high' : 'med',
      title: `${domain.label} verification`,
      detail: domain.action,
      cta: 'Queue Action',
    }))

  return [...normalized, ...fallbackActions]
}

function buildOverallBullets(ai, domains, overallLevel) {
  if (overallLevel === 'healthy') {
    return [
      'All six domains are within healthy thresholds.',
      'No degraded or critical telemetry detected.',
      'Continue normal monitoring.',
    ]
  }

  const symptoms = ai?.issue?.symptoms || []
  if (symptoms.length > 0) return symptoms.slice(0, 3)

  const risks = domains
    .filter((domain) => domain.level !== 'healthy')
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((domain) => `${domain.label}: ${domain.risk}`)

  return risks.length > 0
    ? risks
    : ['AI detected account-level health degradation. Review affected domains before applying an operator action.']
}

function ScoreLevelBadge({ level }) {
  return <span className={`operator-level-badge is-${level}`}>{levelLabel(level)}</span>
}

export default function OperatorAIDiagnosis({
  ai,
  initialActions = [],
  onQueueAction,
  onRefresh,
}) {
  const [isDiagnosing, setIsDiagnosing] = useState(true)
  const [diagnoseProgress, setDiagnoseProgress] = useState(8)
  const [hasDiagnosisResult, setHasDiagnosisResult] = useState(false)
  const [diagnosisRun, setDiagnosisRun] = useState(0)
  const [completedActions, setCompletedActions] = useState({})
  const [actionFeedback, setActionFeedback] = useState(null)
  const [askAiOpen, setAskAiOpen] = useState(false)
  const [askAiInput, setAskAiInput] = useState('')
  const [askAiMessages, setAskAiMessages] = useState([])
  const [askAiTyping, setAskAiTyping] = useState(false)
  const diagnoseTimerRef = useRef(null)
  const askAiEndRef = useRef(null)

  const baseHealthScore = clamp(ai?.healthScore ?? 50, 0, 100)
  const normalizedStatus = STATUS_MAP[ai?.status] || 'unknown'
  const diagnosisAdjustment = diagnosisRun === 0
    ? 0
    : normalizedStatus === 'critical'
      ? -1
      : normalizedStatus === 'degraded'
        ? 1
        : 0
  const recalculatedHealthScore = clamp(baseHealthScore + diagnosisAdjustment, 0, 100)
  const healthScore = isDiagnosing
    ? clamp(recalculatedHealthScore + Math.round((diagnoseProgress % 24) / 12) - 1, 0, 100)
    : recalculatedHealthScore
  const overallLevel = normalizedStatus === 'critical'
    ? 'critical'
    : normalizedStatus === 'degraded'
      ? 'degraded'
      : levelFromScore(healthScore)

  const domains = useMemo(
    () => deriveDomainData(ai, healthScore, normalizedStatus),
    [ai, healthScore, normalizedStatus]
  )
  const [selectedKey, setSelectedKey] = useState('overall')
  const [hoveredKey, setHoveredKey] = useState(null)

  const selectedDomain = domains.find((domain) => domain.key === selectedKey) || null
  const actionableSelectedDomain = selectedDomain?.level !== 'healthy' ? selectedDomain : null
  const SelectedDomainIcon = actionableSelectedDomain?.icon
  const rightPanelMode = actionableSelectedDomain ? 'domain' : 'overall'
  const domainByKey = useMemo(
    () => new Map(domains.map((domain) => [domain.key, domain])),
    [domains]
  )
  const actionItems = useMemo(
    () => normalizeActionItems(initialActions, domains),
    [initialActions, domains]
  )
  const showAiActions = rightPanelMode === 'domain' || overallLevel !== 'healthy'
  const panelActions = (actionableSelectedDomain
    ? actionItems.filter((action) => action.domainKeys?.includes(actionableSelectedDomain.key))
    : showAiActions ? actionItems : [])
    .slice()
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
  const overallBullets = useMemo(
    () => buildOverallBullets(ai, domains, overallLevel),
    [ai, domains, overallLevel]
  )
  const scoreArc = Math.max(2, Math.round(healthScore * 0.72))
  const overallDisplayLevel = operatorDisplayLevel(overallLevel)
  const scoreColor = domainColor(overallDisplayLevel)
  const rightPanelLevel = actionableSelectedDomain?.level || overallDisplayLevel
  const isDiagnosisLoading = isDiagnosing
  const diagnosisBullets = overallBullets.slice(0, 2)
  const diagnosisTitle = rightPanelMode === 'overall'
    ? overallDisplayLevel === 'healthy' ? 'Network is healthy' : 'Service experience degraded'
    : domainSummary(actionableSelectedDomain)

  useEffect(() => {
    let nextProgress = 8
    diagnoseTimerRef.current = window.setInterval(() => {
      nextProgress = Math.min(100, nextProgress + 10)
      setDiagnoseProgress(nextProgress)

      if (nextProgress >= 100) {
        window.clearInterval(diagnoseTimerRef.current)
        diagnoseTimerRef.current = null
        window.setTimeout(() => {
          setHasDiagnosisResult(true)
          setIsDiagnosing(false)
        }, 260)
      }
    }, 170)

    return () => {
      if (diagnoseTimerRef.current) window.clearInterval(diagnoseTimerRef.current)
    }
  }, [])

  function queueAction(item) {
    if (completedActions[item.id]) return
    const completedAt = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    setCompletedActions((current) => ({
      ...current,
      [item.id]: { time: completedAt },
    }))
    setActionFeedback(`${item.title} completed at ${completedAt}`)
    onQueueAction?.(`AI action taken: ${item.title}`, `${item.cta || 'Action'} completed`)
  }

  function selectDomain(domain) {
    setSelectedKey(domain.level === 'healthy' ? 'overall' : domain.key)
  }

  function buildAiReply(question) {
    const q = question.toLowerCase()
    const worstDomain = [...domains].sort((a, b) => a.score - b.score)[0]
    const degradedDomains = domains.filter((d) => d.level !== 'healthy')

    if (q.includes('root cause') || q.includes('why') || q.includes('problem')) {
      return degradedDomains.length
        ? `The primary root cause is in the **${worstDomain.label}** domain (score ${worstDomain.score}/100). ${worstDomain.degraded} ${worstDomain.action}`
        : 'All six domains are within healthy thresholds. No root cause detected at this time.'
    }
    if (q.includes('fix') || q.includes('resolv') || q.includes('action')) {
      const actions = degradedDomains.map((d) => `• **${d.label}**: ${d.action}`).join('\n')
      return actions || 'No remediation needed — network health looks good across all domains.'
    }
    if (q.includes('speed') || q.includes('throughput') || q.includes('bandwidth')) {
      const cap = domains.find((d) => d.key === 'capacity')
      return cap?.level !== 'healthy'
        ? `Capacity domain is degraded (score ${cap.score}/100). ${cap.degraded} Recommend: ${cap.action}`
        : 'WAN throughput and radio headroom look adequate. Run a speed test to confirm against the subscribed tier.'
    }
    if (q.includes('wifi') || q.includes('wi-fi') || q.includes('channel') || q.includes('signal')) {
      const env = domains.find((d) => d.key === 'environment')
      const cov = domains.find((d) => d.key === 'coverage')
      const parts = []
      if (env?.level !== 'healthy') parts.push(`RF environment is degraded — ${env.degraded}`)
      if (cov?.level !== 'healthy') parts.push(`Coverage path issue — ${cov.degraded}`)
      return parts.length ? parts.join(' ') : 'Wi-Fi environment and coverage both look healthy. No channel interference or signal issues detected.'
    }
    if (q.includes('reboot') || q.includes('stable') || q.includes('crash')) {
      const stab = domains.find((d) => d.key === 'stability')
      return stab?.level !== 'healthy'
        ? `Stability domain is degraded (score ${stab.score}/100). ${stab.degraded} ${stab.action}`
        : 'No reboot events or stability issues detected in the current window.'
    }
    if (q.includes('summar') || q.includes('overview') || q.includes('status')) {
      const summary = degradedDomains.length
        ? `Overall health: **${overallDisplayLevel.toUpperCase()}** (${healthScore}/100). Degraded domains: ${degradedDomains.map((d) => `${d.label} (${d.score})`).join(', ')}.`
        : `Overall health: **HEALTHY** (${healthScore}/100). All six domains are within normal operating range.`
      return summary
    }
    return `Based on the six-domain analysis, overall health is **${healthScore}/100** (${overallDisplayLevel}). ${degradedDomains.length ? `Focus areas: ${degradedDomains.map((d) => d.label).join(', ')}. The highest-impact issue is in ${worstDomain.label}: ${worstDomain.diagnosis}` : 'All domains are healthy.'}`
  }

  function sendAskAi(question) {
    if (!question.trim()) return
    const userMsg = { role: 'user', text: question.trim() }
    setAskAiMessages((prev) => [...prev, userMsg])
    setAskAiInput('')
    setAskAiTyping(true)
    setTimeout(() => {
      const reply = buildAiReply(question)
      setAskAiMessages((prev) => [...prev, { role: 'ai', text: reply }])
      setAskAiTyping(false)
      setTimeout(() => askAiEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }, 900)
  }

  const QUICK_QUESTIONS = [
    'What is the root cause?',
    'How do I fix this?',
    'Why is Wi-Fi slow?',
    'Give me a summary',
  ]

  function runRediagnose() {
    if (isDiagnosing) return
    onRefresh?.()
    setSelectedKey('overall')
    setIsDiagnosing(true)
    setHasDiagnosisResult(false)
    setDiagnoseProgress(8)

    if (diagnoseTimerRef.current) window.clearInterval(diagnoseTimerRef.current)

    let nextProgress = 8
    diagnoseTimerRef.current = window.setInterval(() => {
      nextProgress = Math.min(100, nextProgress + 16)
      setDiagnoseProgress(nextProgress)

      if (nextProgress >= 100) {
        window.clearInterval(diagnoseTimerRef.current)
        diagnoseTimerRef.current = null
        window.setTimeout(() => {
          setHasDiagnosisResult(true)
          setDiagnosisRun((current) => current + 1)
          setIsDiagnosing(false)
        }, 260)
      }
    }, 160)
  }

  return (
    <section className="operator-ai-shell">
      <header className="operator-ai-header">
        <div className="operator-ai-title">
          <span className="operator-ai-icon"><Bot size={17} /></span>
          <div>
            <p>AI Network Diagnosis</p>
            <span>{isDiagnosisLoading ? 'Running six-domain analysis' : 'Six-domain customer health score'}</span>
          </div>
          {ai?.issueCount > 0 && !isDiagnosisLoading && (
            <ScoreLevelBadge level={overallDisplayLevel} />
          )}
        </div>

        <div className="operator-ai-header-right">
          <button
            type="button"
            onClick={() => { setAskAiOpen(true); if (askAiMessages.length === 0) setAskAiMessages([{ role: 'ai', text: `I've analyzed this network. Overall health is **${healthScore}/100** (${overallDisplayLevel}). ${domains.filter(d => d.level !== 'healthy').length ? `I detected issues in: ${domains.filter(d => d.level !== 'healthy').map(d => d.label).join(', ')}. Ask me anything about root cause, fixes, or specific domains.` : 'All six domains look healthy. Ask me anything about this network.'}` }]) }}
            className="ask-ai-button"
          >
            <Sparkles size={13} className="ask-ai-sparkle" />
            Ask AI
          </button>
          <div className="operator-rediagnose-control">
            <button
              type="button"
              onClick={runRediagnose}
              className={`operator-refresh-button ${isDiagnosing ? 'is-running' : ''}`}
              disabled={isDiagnosing}
            >
              <RefreshCw size={13} />
              {isDiagnosing ? `Analyzing ${diagnoseProgress}%` : 'Re-diagnose'}
            </button>
            <span>{isDiagnosing ? 'AI diagnosis in progress' : hasDiagnosisResult && diagnosisRun === 0 ? 'Diagnosis ready' : diagnosisRun > 0 ? 'Re-diagnosed just now' : 'Ready'}</span>
            <div className="operator-rediagnose-track" aria-hidden="true">
              <i style={{ width: `${isDiagnosing ? diagnoseProgress : diagnosisRun > 0 ? 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </header>

      {askAiOpen && (
        <div className="ask-ai-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAskAiOpen(false) }}>
          <div className="ask-ai-dialog">
            <div className="ask-ai-dialog-header">
              <div className="ask-ai-dialog-title">
                <Sparkles size={15} className="ask-ai-sparkle" />
                <span>AI Network Assistant</span>
                <span className="ask-ai-badge">LIVE</span>
              </div>
              <button type="button" onClick={() => setAskAiOpen(false)} className="ask-ai-close"><X size={15} /></button>
            </div>

            <div className="ask-ai-messages">
              {askAiMessages.map((msg, i) => (
                <div key={i} className={`ask-ai-msg ask-ai-msg-${msg.role}`}>
                  {msg.role === 'ai' && <span className="ask-ai-msg-icon"><Bot size={13} /></span>}
                  <div className="ask-ai-msg-bubble">
                    {msg.text.split('\n').map((line, j) => (
                      <p key={j}>{line.split(/\*\*(.*?)\*\*/g).map((part, k) =>
                        k % 2 === 1 ? <strong key={k}>{part}</strong> : part
                      )}</p>
                    ))}
                  </div>
                </div>
              ))}
              {askAiTyping && (
                <div className="ask-ai-msg ask-ai-msg-ai">
                  <span className="ask-ai-msg-icon"><Bot size={13} /></span>
                  <div className="ask-ai-msg-bubble ask-ai-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={askAiEndRef} />
            </div>

            <div className="ask-ai-quick">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} type="button" className="ask-ai-chip" onClick={() => sendAskAi(q)}>{q}</button>
              ))}
            </div>

            <div className="ask-ai-input-row">
              <input
                type="text"
                className="ask-ai-input"
                placeholder="Ask about root cause, fixes, Wi-Fi, stability…"
                value={askAiInput}
                onChange={(e) => setAskAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendAskAi(askAiInput) }}
              />
              <button type="button" className="ask-ai-send" onClick={() => sendAskAi(askAiInput)} disabled={!askAiInput.trim()}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="operator-ai-grid">
        <div className="operator-hex-panel">
          <div className="operator-hex-stage" aria-label="Six-domain network health score">
            <svg className="operator-hex-svg" viewBox="0 0 720 500" aria-hidden="true">
              <defs>
                <radialGradient id="operatorCenterGlow" cx="50%" cy="50%" r="58%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
                  <stop offset="55%" stopColor="rgba(236,253,245,0.92)" />
                  <stop offset="100%" stopColor="rgba(219,234,254,0.62)" />
                </radialGradient>
                <filter id="operatorHexGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <polygon
                className="operator-hex-shadow"
                points="360,66 520,166 520,334 360,424 200,334 200,166"
              />

              {domains.map((domain) => {
                const selected = selectedKey === domain.key
                const hovered = hoveredKey === domain.key
                const geometry = DOMAIN_GEOMETRY[domain.key]
                return (
                  <line
                    key={domain.key}
                    x1={geometry.line[0]}
                    y1={geometry.line[1]}
                    x2={geometry.line[2]}
                    y2={geometry.line[3]}
                    vectorEffect="non-scaling-stroke"
                    role="button"
                    tabIndex={0}
                    className={`operator-hex-edge is-${domain.level} ${selected ? 'is-selected' : ''} ${hovered ? 'is-hovered' : ''}`}
                    style={{ '--domain-color': domainColor(domain.level) }}
                    onClick={() => selectDomain(domain)}
                    onMouseEnter={() => setHoveredKey(domain.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        selectDomain(domain)
                      }
                    }}
                  />
                )
              })}
            </svg>

            {domains.map((domain) => {
              const Icon = domain.icon
              const selected = selectedKey === domain.key
              const hovered = hoveredKey === domain.key
              const geometry = DOMAIN_GEOMETRY[domain.key]
              return (
                <button
                  key={domain.key}
                  type="button"
                  onClick={() => selectDomain(domain)}
                  onMouseEnter={() => setHoveredKey(domain.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={`${domainStatusClass(domain.level, selected && domain.level !== 'healthy', hovered)} is-${domain.key} ${isDiagnosisLoading ? 'is-loading' : ''}`}
                  style={{
                    left: `${geometry.card[0]}px`,
                    top: `${geometry.card[1]}px`,
                    '--domain-color': domainColor(domain.level),
                  }}
                >
                  <span className="operator-domain-main">
                    <span className="operator-domain-label">
                      <span className="operator-domain-glyph">
                        <Icon size={15} />
                      </span>
                      {domain.label}
                    </span>
                    <span className="operator-domain-score">{isDiagnosisLoading ? '…' : domain.score}</span>
                  </span>
                  <span className="operator-domain-risk">{isDiagnosisLoading ? 'Analyzing telemetry…' : domainSummary(domain)}</span>
                  {!isDiagnosisLoading && domain.level !== 'healthy' && (
                    <ul className="operator-domain-checks">
                      {(domain.evidence.length > 0 ? domain.evidence.map((item) => item.label) : domain.measures).slice(0, 2).map((measure) => (
                        <li key={measure}>{measure}</li>
                      ))}
                    </ul>
                  )}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setSelectedKey('overall')}
              className={`operator-center-score is-${overallDisplayLevel} ${selectedKey === 'overall' ? 'is-selected' : ''} ${isDiagnosing ? 'is-calculating' : ''}`}
              style={{ '--score-color': scoreColor, '--score-pct': `${healthScore}%` }}
            >
              <svg className="operator-score-meter" viewBox="0 0 160 160" aria-hidden="true">
                <circle className="operator-score-meter-track" cx="80" cy="80" r="68" pathLength="100" />
                <circle
                  className="operator-score-meter-fill"
                  cx="80"
                  cy="80"
                  r="68"
                  pathLength="100"
                  style={{ strokeDasharray: `${scoreArc} 100` }}
                />
              </svg>
              <span>{isDiagnosing ? 'Calculating' : 'Network Health'}</span>
              <strong>{isDiagnosisLoading ? '--' : healthScore}<small>/100</small></strong>
              <em>{isDiagnosisLoading ? 'Analyzing' : levelLabel(overallDisplayLevel)}</em>
            </button>
          </div>
        </div>

        <aside className="operator-diagnosis-panel">
          <div className={`operator-panel-card is-primary is-${rightPanelLevel} ${isDiagnosisLoading ? 'is-loading' : ''}`}>
            <div className="operator-panel-kicker">
              {rightPanelMode === 'overall' ? (
                <>
                  <Activity size={14} />
                  {isDiagnosisLoading ? 'Running diagnosis' : 'Overall diagnosis'}
                </>
              ) : (
                <>
                  {SelectedDomainIcon && <SelectedDomainIcon size={14} />}
                  {actionableSelectedDomain.label} diagnosis
                </>
              )}
            </div>

            {!isDiagnosisLoading && (rightPanelMode !== 'overall' || overallLevel !== 'healthy') && (
              <h3>{diagnosisTitle}</h3>
            )}

            {isDiagnosisLoading ? (
              <div className="operator-loading-stack" aria-label="AI diagnosis loading">
                <span />
                <span />
                <span />
              </div>
            ) : rightPanelMode === 'overall' ? (
              <ul className="operator-panel-bullets">
                {diagnosisBullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : (
              <div className="operator-domain-panel-checks">
                <p className="operator-mini-heading">Score reasoning</p>
                <ul className="operator-panel-bullets">
                  {actionableSelectedDomain.evidence.length > 0 ? (
                    actionableSelectedDomain.evidence.map((factor) => (
                      <li key={factor.label}>{factor.label}</li>
                    ))
                  ) : (
                    <>
                      <li>{actionableSelectedDomain.risk}</li>
                      <li>{actionableSelectedDomain.diagnosis}</li>
                    </>
                  )}
                </ul>
              </div>
            )}

          </div>

          <div className={`operator-panel-card is-actions is-${rightPanelLevel} ${!showAiActions ? 'is-monitoring' : ''} ${isDiagnosisLoading ? 'is-loading' : ''}`}>
            <div className="operator-panel-kicker">
              <Zap size={14} />
              {isDiagnosisLoading ? 'Generating actions' : 'Recommended actions'}
            </div>
            {actionFeedback && (
              <div className="operator-action-toast">
                <CheckCircle2 size={13} />
                {actionFeedback}
              </div>
            )}

            <div className={`operator-action-list ${panelActions.length < 2 || isDiagnosisLoading ? 'is-single' : ''}`}>
              {isDiagnosisLoading ? (
                <div className="operator-action-loading" aria-label="AI action items loading">
                  <span />
                  <span />
                  <span />
                </div>
              ) : panelActions.length > 0 ? panelActions.map((item, index) => {
                const completed = completedActions[item.id]
                const primaryDomain = item.domainKeys?.map((key) => domainByKey.get(key)).find(Boolean)
                return (
                  <div key={item.id} className={`operator-action-item ${actionPriorityClass(item.priority)} ${completed ? 'is-complete' : ''}`}>
                    <div>
                      <div className="operator-action-topline">
                        <span className="operator-action-rank">{index + 1}</span>
                        <span className="operator-action-context">
                          {completed ? 'Completed' : `${(item.priority || 'low').toUpperCase()} priority`}
                          {primaryDomain ? ` · ${primaryDomain.label}` : ''}
                        </span>
                      </div>
                      <p>{item.title}</p>
                      <em title={item.detail}>{item.detail}</em>
                      {completed && (
                        <span className="operator-action-confirmation">
                          <CheckCircle2 size={12} />
                          Taken {completed.time}
                        </span>
                      )}
                    </div>
                    <button type="button" onClick={() => queueAction(item)} disabled={Boolean(completed)}>
                      {completed ? 'Action Taken' : item.cta || 'Queue Action'}
                      {completed ? <CheckCircle2 size={12} /> : <ArrowRight size={12} />}
                    </button>
                  </div>
                )
              }) : (
                <div className={`operator-empty-action ${!showAiActions ? 'is-monitoring' : ''}`}>
                  <ShieldCheck size={16} />
                  {!showAiActions ? 'No AI remediation recommended.' : 'No action item is currently recommended.'}
                </div>
              )}
            </div>
          </div>

        </aside>
      </div>
    </section>
  )
}
