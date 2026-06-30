import { useCallback, useMemo, useState } from 'react'
import {
  ArrowLeft,
  User,
  Globe,
  RefreshCw,
  ClipboardList,
  ChevronRight,
  Gauge,
  Router,
  Wifi,
  KeyRound,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react'
import { getNetworkDetail, parseTierMbps } from '../../../data/mockNetworkDetail'
import OperatorAIDiagnosis from './OperatorAIDiagnosis'
import Zone3WANHealth from './Zone3WANHealth'
import Zone4WiFiHealth from './Zone4WiFiHealth'
import Zone6DeviceOverview from './Zone6DeviceOverview'
import NetworkEventsTab from './NetworkEventsTab'
import ActivityLogDrawer from './ActivityLogDrawer'

const STATUS_MAP = {
  online: 'healthy',
  healthy: 'healthy',
  degraded: 'degraded',
  issues: 'degraded',
  warning: 'degraded',
  offline: 'critical',
  critical: 'critical',
  suspended: 'critical',
  disconnected: 'critical',
  unknown: 'unknown',
}

const HEALTH_BADGE = {
  healthy: 'bg-noc-accent/10 text-noc-accent border border-noc-accent/30',
  degraded: 'bg-noc-warning/10 text-noc-warning border border-noc-warning/30',
  critical: 'bg-noc-danger/10 text-noc-danger border border-noc-danger/30',
  unknown: 'bg-noc-raised/40 text-noc-muted border border-noc-border',
}

const CURRENT_OPERATOR = {
  initials: 'SH',
  name: 'Sam Huang',
}

export default function CustomerDetailPageOperator({ customer, onBack, showNetworkEvents = false }) {
  const detail = getNetworkDetail(customer)
  const [lastPolledMins, setLastPolledMins] = useState(15)
  const [logOpen, setLogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('ai')
  const [activityLog, setActivityLog] = useState(detail.activityLog || [])
  const [isPulling, setIsPulling] = useState(false)
  const [actionState, setActionState] = useState({})
  const [confirmingAction, setConfirmingAction] = useState(null)
  const [showWifiPassword, setShowWifiPassword] = useState(false)

  const healthStatus = STATUS_MAP[detail.ai?.status || customer.status] || 'unknown'

  const appendLog = useCallback((action, label = 'Completed', op = CURRENT_OPERATOR.initials, actor = CURRENT_OPERATOR.name) => {
    const now = new Date()
    const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    setActivityLog((prev) => [
      { date, time, op, actor, action, outcome: 'completed', label },
      ...prev,
    ])
  }, [])

  const finishAction = useCallback((key, action, label, delay = 1600) => {
    setActionState((prev) => ({ ...prev, [key]: 'running' }))
    setTimeout(() => {
      appendLog(action, label)
      setActionState((prev) => ({ ...prev, [key]: 'done' }))
      setTimeout(() => {
        setActionState((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }, 1800)
    }, delay)
  }, [appendLog])

  const confirmOrRun = useCallback((key, action, label, delay) => {
    if (confirmingAction !== key) {
      setConfirmingAction(key)
      return
    }
    setConfirmingAction(null)
    finishAction(key, action, label, delay)
  }, [confirmingAction, finishAction])

  const handlePollNow = useCallback((sourceAction = 'Real-time data pull', label = 'CPE pull + AI diagnosis refreshed') => {
    if (isPulling) return
    setIsPulling(true)
    setActionState((prev) => ({ ...prev, speed: 'running', gateway: 'running', wifi: 'running' }))
    setLastPolledMins(0)
    setTimeout(() => {
      appendLog(sourceAction, label)
      setActionState((prev) => ({ ...prev, speed: 'done', gateway: 'done', wifi: 'done' }))
      setIsPulling(false)
      setTimeout(() => setActionState({}), 1400)
    }, 2100)
    setTimeout(() => setLastPolledMins(1), 60000)
  }, [appendLog, isPulling])

  const cpeNodes = useMemo(
    () => (detail.devices || []).filter((d) => d.cat === 'equipment'),
    [detail.devices]
  )
  const primaryCpe = cpeNodes[0]
  const additionalCpe = cpeNodes.slice(1)
  const lastPullLabel = lastPolledMins <= 1 ? 'just now' : `${lastPolledMins} min ago`
  const latestSpeed = detail.wan?.speedHistory?.[0]
  const currentSpeedLabel = latestSpeed
    ? `${latestSpeed.down}↓ / ${latestSpeed.up}↑ Mbps`
    : customer.wan?.speedMbps
      ? `${customer.wan.speedMbps} Mbps`
      : 'No test result'
  const speedTestTime = latestSpeed?.date || 'No recent test'
  const primarySsid = detail.wifi?.ssids?.[0]
  const gatewayStatus = primaryCpe?.status || customer.status || 'unknown'
  const gatewayLabel = primaryCpe?.model || customer.deviceModel || 'Gateway'
  const tierMbps = parseTierMbps(customer.serviceLevel)
  const speedBenchmark = latestSpeed?.down && tierMbps
    ? `${Math.round((latestSpeed.down / tierMbps) * 100)}% of subscribed plan`
    : customer.serviceLevel
      ? 'Benchmark available in WAN health'
      : 'Plan benchmark unavailable'

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-dark bg-noc-bg">
      <div className="flex-1 p-5 space-y-5">
        <div className="bg-noc-surface border border-noc-border rounded-xl overflow-hidden">
          <div className="px-5 pt-3 pb-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-noc-muted hover:text-noc-fg text-xs transition-colors cursor-pointer group"
              >
                <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                Network / Customer Lookup
              </button>
              <button
                onClick={() => setLogOpen(true)}
                className="text-sm font-semibold flex items-center gap-2 text-noc-info bg-noc-info/10 hover:bg-noc-info/15 border border-noc-info/35 hover:border-noc-info/55 rounded-lg px-3.5 py-2 shadow-[0_0_18px_rgba(56,189,248,0.10)] transition-colors cursor-pointer"
              >
                <ClipboardList size={15} />
                Service Log
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
              <div className="min-w-0">
                <h1 className="text-noc-fg font-bold text-2xl leading-tight">
                  {customer.subscriber || 'Unprovisioned Device'}
                </h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-[15px]">
                  <span className="inline-flex items-center gap-2 text-noc-muted">
                    <span className="font-semibold">Account #</span>
                    <span className="text-noc-fg font-code text-base font-semibold">{customer.accountNumber || '—'}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 text-noc-muted">
                    <span className="font-semibold">SN</span>
                    <span className="text-noc-fg font-code text-base font-semibold">{customer.serial}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 text-noc-muted">
                    <span className="font-semibold">Plan</span>
                    <span className="text-noc-info font-semibold">{customer.serviceLevel || 'Unknown'}</span>
                  </span>
                  <span className={`font-code text-sm ${isPulling ? 'text-noc-info' : 'text-noc-muted'}`}>
                    {isPulling ? 'Pulling live CPE data…' : `Updated ${lastPullLabel}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handlePollNow('Real-time data pull')}
                disabled={isPulling}
                className="dashboard-action-button text-sm px-4 py-2 disabled:opacity-70 disabled:cursor-wait"
              >
                <RefreshCw size={14} className={isPulling ? 'animate-spin' : ''} />
                {isPulling ? 'Pulling Data…' : 'Pull Real-time Data'}
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1 rounded-full text-noc-accent bg-noc-accent/10 border-noc-accent/30">
                <User size={12} className="flex-shrink-0" />
                {(customer.accountStatus || 'unknown').toUpperCase()}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1 rounded-full ${HEALTH_BADGE[healthStatus]}`}>
                <Globe size={12} className="flex-shrink-0 opacity-80" />
                {healthStatus.toUpperCase()}
              </span>
            </div>

            <div className="operator-overview-section">
              <p className="operator-overview-title">Network Overview</p>
              <div className="operator-overview-grid">
                <div className="operator-overview-card is-speed">
                  <div className="operator-overview-card-glow" />
                  <div className="operator-overview-kicker">
                    <span className="inline-flex items-center gap-2"><Gauge size={13} />Current Speed</span>
                    {actionState.speed === 'running' && <span className="text-noc-info font-semibold">Testing…</span>}
                    {actionState.speed === 'done' && <span className="text-noc-accent font-semibold">Updated</span>}
                  </div>
                  <p className="operator-overview-value font-code">
                    {actionState.speed === 'running' ? 'Testing speed…' : currentSpeedLabel}
                  </p>
                  <p className="operator-overview-copy">
                    {actionState.speed === 'running' ? 'Running against subscribed plan' : speedBenchmark}
                  </p>
                  <p className="operator-overview-meta">Last test: {actionState.speed === 'running' ? 'Running now' : speedTestTime}</p>
                  {(isPulling || actionState.speed === 'running') && (
                    <div className="operator-overview-progress">
                      <div className="h-full w-2/3 rounded-full bg-noc-info animate-pulse" />
                    </div>
                  )}
                  <div className="operator-overview-actions">
                    <button
                      onClick={() => finishAction('speed', 'Speed Test', 'Speed test completed', 1800)}
                      disabled={actionState.speed === 'running' || isPulling}
                      className="dashboard-action-button disabled:opacity-60 disabled:cursor-wait"
                    >
                      {actionState.speed === 'running' ? 'Testing…' : 'Run Speed Test'}
                    </button>
                  </div>
                </div>
                <div className="operator-overview-card is-gateway">
                  <div className="operator-overview-card-glow" />
                  <div className="operator-overview-kicker">
                    <span className="inline-flex items-center gap-2"><Router size={13} />Gateway / Router</span>
                    {actionState.gateway === 'running' && <span className="text-noc-warning font-semibold">Rebooting…</span>}
                    {actionState.gateway === 'done' && <span className="text-noc-accent font-semibold">Online</span>}
                  </div>
                  <p className="operator-overview-value truncate">{gatewayLabel}</p>
                  <p className="operator-overview-meta">
                    Status: <span className="text-noc-fg capitalize">{actionState.gateway === 'running' ? 'rebooting' : gatewayStatus}</span>
                    {additionalCpe.length > 0 ? ` · +${additionalCpe.length} CPE` : ''}
                  </p>
                  {actionState.gateway === 'running' && (
                    <div className="operator-overview-progress">
                      <div className="h-full w-1/2 rounded-full bg-noc-warning animate-pulse" />
                    </div>
                  )}
                  <div className="operator-overview-actions">
                    {confirmingAction === 'gateway' ? (
                      <>
                        <button
                          onClick={() => confirmOrRun('gateway', 'Reboot Gateway', 'Gateway reboot completed; back online', 2400)}
                          className="dashboard-action-button-confirm"
                        >
                          Confirm Reboot
                        </button>
                        <button
                          onClick={() => setConfirmingAction(null)}
                          className="dashboard-action-button-cancel"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => confirmOrRun('gateway', 'Reboot Gateway', 'Gateway reboot completed; back online', 2400)}
                        disabled={actionState.gateway === 'running' || isPulling}
                        className="dashboard-action-button disabled:opacity-60 disabled:cursor-wait"
                      >
                        {actionState.gateway === 'running' ? 'Rebooting…' : 'Reboot Gateway'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="operator-overview-card is-wifi">
                  <div className="operator-overview-card-glow" />
                  <div className="operator-overview-kicker">
                    <span className="inline-flex items-center gap-2"><Wifi size={13} />Wi‑Fi</span>
                    {actionState.sendPw === 'running' && <span className="text-noc-info font-semibold">Sending…</span>}
                    {actionState.resetPw === 'running' && <span className="text-noc-warning font-semibold">Resetting…</span>}
                    {actionState.wifi === 'running' && <span className="text-noc-info font-semibold">Refreshing…</span>}
                  </div>
                  <p className="operator-overview-value truncate">SSID: {primarySsid?.name || '—'}</p>
                  <div className="operator-overview-password">
                    <span className="text-noc-muted">PW:</span>
                    <span className="font-code text-noc-fg">
                      {primarySsid?.password ? (showWifiPassword ? primarySsid.password : '••••••••') : '—'}
                    </span>
                    {primarySsid?.password && (
                      <button
                        type="button"
                        onClick={() => setShowWifiPassword((current) => !current)}
                        className="operator-overview-inline-button"
                      >
                        {showWifiPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showWifiPassword ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                  {(actionState.sendPw === 'running' || actionState.resetPw === 'running' || actionState.wifi === 'running') && (
                    <div className="operator-overview-progress">
                      <div className="h-full w-3/5 rounded-full bg-fuchsia-400 animate-pulse" />
                    </div>
                  )}
                  <div className="operator-overview-actions">
                    {confirmingAction === 'sendPw' ? (
                      <>
                        <button
                          onClick={() => confirmOrRun('sendPw', 'Sent Wi‑Fi password', 'Delivered via verified customer channel', 1400)}
                          className="dashboard-action-button-confirm"
                        >
                          <Send size={12} />
                          Confirm Send
                        </button>
                        <button
                          onClick={() => setConfirmingAction(null)}
                          className="dashboard-action-button-cancel"
                        >
                          Cancel
                        </button>
                      </>
                    ) : confirmingAction === 'resetPw' ? (
                      <>
                        <button
                          onClick={() => confirmOrRun('resetPw', 'Reset Wi‑Fi password', 'Password reset completed')}
                          className="dashboard-action-button-confirm"
                        >
                          <KeyRound size={12} />
                          Confirm Reset
                        </button>
                        <button
                          onClick={() => setConfirmingAction(null)}
                          className="dashboard-action-button-cancel"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => confirmOrRun('sendPw', 'Sent Wi‑Fi password', 'Delivered via verified customer channel', 1400)}
                          disabled={actionState.sendPw === 'running' || actionState.resetPw === 'running' || isPulling}
                          className="dashboard-action-button disabled:opacity-60 disabled:cursor-wait"
                        >
                          <Send size={12} />
                          {actionState.sendPw === 'running' ? 'Sending…' : 'Send PW'}
                        </button>
                        <button
                          onClick={() => confirmOrRun('resetPw', 'Reset Wi‑Fi password', 'Password reset completed')}
                          disabled={actionState.sendPw === 'running' || actionState.resetPw === 'running' || isPulling}
                          className="dashboard-action-button disabled:opacity-60 disabled:cursor-wait"
                        >
                          <KeyRound size={12} />
                          {actionState.resetPw === 'running' ? 'Resetting…' : 'Reset PW'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="zone5" className="bg-noc-surface border border-noc-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-1 p-2 border-b border-noc-border bg-noc-raised/30">
            {[
              { id: 'ai', label: 'AI Diagnosis' },
              { id: 'wan', label: 'WAN Health' },
              { id: 'wifi', label: 'Wi‑Fi Insight' },
              { id: 'cpe', label: 'CPE / Devices' },
              ...(showNetworkEvents ? [{ id: 'events', label: 'Network Events' }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-noc-info/15 text-noc-info border-noc-info/35 shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                    : 'border-transparent text-noc-muted hover:text-noc-fg hover:bg-noc-raised/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'ai' && (
              <OperatorAIDiagnosis
                ai={detail.ai}
                initialActions={detail.actions || []}
                onRefresh={() => handlePollNow('AI re-diagnose', 'Six-domain score recalculated')}
                onQueueAction={(action, label) => appendLog(action, label)}
              />
            )}
            {activeTab === 'wan' && (
              <Zone3WANHealth
                customer={customer}
                wan={customer.wan}
                wanExtended={detail.wan}
                devices={detail.devices}
                pollNow={handlePollNow}
                lastPolledMins={lastPolledMins}
              />
            )}
            {activeTab === 'wifi' && (
              <Zone4WiFiHealth
                wifi={detail.wifi}
                devices={detail.devices}
                pollNow={handlePollNow}
                lastPolledMins={lastPolledMins}
              />
            )}
            {activeTab === 'cpe' && detail.devices?.length > 0 && (
              <Zone6DeviceOverview
                devices={detail.devices}
                pollNow={handlePollNow}
                lastPolledMins={lastPolledMins}
              />
            )}
            {activeTab === 'events' && showNetworkEvents && (
              <NetworkEventsTab
                customer={customer}
                detail={detail}
                lastPolledMins={lastPolledMins}
              />
            )}
          </div>
        </div>
      </div>

      <ActivityLogDrawer
        open={logOpen}
        onClose={() => setLogOpen(false)}
        log={activityLog}
        customerName={customer.subscriber || 'Unknown Subscriber'}
        serial={customer.serial}
        onIssueResolved={() => appendLog('Issue resolved', 'Ticket marked resolved')}
        onEscalate={() => appendLog('Escalated to engineer', 'Escalation package sent to engineering queue')}
      />
    </div>
  )
}
