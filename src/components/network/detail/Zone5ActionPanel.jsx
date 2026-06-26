import { useState } from 'react'
import { CheckCircle2, X, RefreshCw, Shield } from 'lucide-react'

const P = {
  high: { badge: 'bg-noc-danger/15 text-noc-danger border-noc-danger/30',   bar: 'bg-noc-danger',   btn: 'bg-noc-danger hover:bg-noc-danger/85 text-white',           label: 'HIGH' },
  med:  { badge: 'bg-noc-warning/15 text-noc-warning border-noc-warning/30', bar: 'bg-noc-warning', btn: 'bg-noc-warning hover:bg-noc-warning/85 text-noc-bg',          label: 'MED'  },
  low:  { badge: 'bg-noc-info/15 text-noc-info border-noc-info/30',          bar: 'bg-noc-info',    btn: 'bg-noc-info hover:bg-noc-info/85 text-white',                 label: 'LOW'  },
}

function ActionCard({ action, onDismiss, onComplete }) {
  const [confirmed, setConfirmed] = useState(false)
  const [executing, setExecuting] = useState(false)
  const cfg = P[action.priority] ?? P.low

  function handleExecute() {
    setExecuting(true)
    setTimeout(() => { setExecuting(false); onComplete(action.id) }, 2000)
  }

  if (action._completed) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg border border-noc-border/50 bg-noc-raised/20 h-full min-h-[120px]">
        <CheckCircle2 size={14} className="text-noc-accent flex-shrink-0" />
        <span className="text-xs text-noc-muted flex-1 truncate">{action.title}</span>
        <span className="text-2xs text-noc-accent font-semibold">Done</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-noc-border overflow-hidden bg-noc-raised/30 flex flex-col h-full">
      <div className={`h-0.5 flex-shrink-0 ${cfg.bar}`} />
      <div className="p-3 flex flex-col flex-1 gap-2">

        {/* Badge + dismiss */}
        <div className="flex items-center justify-between">
          <span className={`text-2xs font-bold tracking-wider px-1.5 py-0.5 rounded border ${cfg.badge}`}>
            {cfg.label}
          </span>
          <button
            onClick={() => onDismiss(action.id)}
            className="text-noc-muted/40 hover:text-noc-muted transition-colors cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>

        {/* Title */}
        <p className="text-xs font-semibold text-noc-fg leading-snug">{action.title}</p>

        {/* Detail — 1 line */}
        <p className="text-2xs text-noc-muted leading-snug">{action.detail}</p>

        {/* Push consent + button to bottom */}
        <div className="flex-1" />

        {/* Consent */}
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="accent-noc-info cursor-pointer flex-shrink-0"
          />
          <span className="text-2xs text-noc-muted group-hover:text-noc-fg transition-colors">
            Customer informed and agrees
          </span>
        </label>

        {/* CTA */}
        <button
          onClick={handleExecute}
          disabled={!confirmed || executing}
          className={`w-full py-1.5 px-3 rounded-lg text-2xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${cfg.btn}`}
        >
          {executing ? 'Executing…' : `${action.cta} →`}
        </button>

      </div>
    </div>
  )
}

export default function Zone5ActionPanel({ initialActions = [], onRefresh }) {
  const [actions, setActions] = useState(
    initialActions.map(a => ({ ...a, _completed: false, _dismissed: false }))
  )

  const dismiss  = id => setActions(prev => prev.map(a => a.id === id ? { ...a, _dismissed: true }  : a))
  const complete = id => setActions(prev => prev.map(a => a.id === id ? { ...a, _completed: true } : a))

  const active  = actions.filter(a => !a._dismissed)
  const pending = active.filter(a => !a._completed).length

  return (
    <div className="bg-noc-surface border border-noc-border rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-noc-border bg-noc-raised/30">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-noc-info" />
          <span className="text-sm font-semibold text-noc-fg">Action Panel</span>
          {pending > 0 ? (
            <span className="text-2xs font-bold bg-noc-danger/15 text-noc-danger border border-noc-danger/30 rounded-full px-2 py-0.5">
              {pending} pending
            </span>
          ) : (
            <span className="text-2xs text-noc-accent flex items-center gap-1">
              <CheckCircle2 size={11} /> All clear
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-noc-muted hover:text-noc-fg transition-colors cursor-pointer"
        >
          <RefreshCw size={12} />
          Refresh Diagnosis
        </button>
      </div>

      {/* Cards — 3 per row */}
      <div className="p-4">
        {pending === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <CheckCircle2 size={28} className="text-noc-accent opacity-60" />
            <p className="text-sm font-semibold text-noc-fg">No pending actions</p>
            <p className="text-xs text-noc-muted">Network is healthy — nothing needs attention right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {active.map(a => (
              <ActionCard key={a.id} action={a} onDismiss={dismiss} onComplete={complete} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
