import { useEffect } from 'react'
import { X, ClipboardList, CheckCircle2, Send } from 'lucide-react'

const OUTCOME_CLASS = {
  completed:   'text-noc-accent',
  interrupted: 'text-noc-warning',
  failed:      'text-noc-danger',
  info:        'text-noc-muted',
  system:      'text-noc-muted',
}

function groupByDate(log) {
  const groups = []
  let current = null
  for (const entry of log) {
    if (!current || current.date !== entry.date) {
      current = { date: entry.date, entries: [] }
      groups.push(current)
    }
    current.entries.push(entry)
  }
  return groups
}

export default function ActivityLogDrawer({
  open,
  onClose,
  log,
  customerName,
  serial,
  onIssueResolved,
  onEscalate,
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const groups = groupByDate(log)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-96 z-50 bg-noc-surface border-l border-noc-border
        flex flex-col shadow-2xl transition-transform duration-200
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-noc-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <ClipboardList size={15} className="text-noc-muted mt-0.5" />
            <div>
              <p className="text-noc-fg text-sm font-semibold leading-tight">Activity Log</p>
              <p className="text-noc-muted text-xs mt-0.5">{customerName} · <span className="font-code">{serial}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-noc-muted hover:text-noc-fg transition-colors cursor-pointer mt-0.5"
          >
            <X size={15} />
          </button>
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto scrollbar-dark">
          {log.length === 0 ? (
            <p className="px-5 py-10 text-xs text-noc-muted text-center">
              No activity recorded for this account.
            </p>
          ) : (
            groups.map(group => (
              <div key={group.date}>
                {/* Date header */}
                <div className="px-5 py-1.5 text-[10px] font-semibold text-noc-muted/60 uppercase tracking-widest bg-noc-bg/60 border-b border-noc-border/40">
                  {group.date}
                </div>

                {/* Entries */}
                {group.entries.map((entry, i) => (
                  <div
                    key={i}
                    className="px-5 py-2.5 border-b border-noc-border/30 flex items-center gap-3 hover:bg-noc-raised/20 transition-colors"
                  >
                    {/* Time */}
                    <span className="text-[11px] text-noc-muted font-code w-[58px] flex-shrink-0">
                      {entry.time}
                    </span>

                    {/* Operator badge */}
                    <span
                      className="text-[10px] font-bold text-noc-fg/70 bg-noc-raised border border-noc-border rounded px-1.5 py-0.5 flex-shrink-0 min-w-[26px] text-center"
                      title={entry.actor || entry.op}
                    >
                      {entry.op}
                    </span>

                    {/* Action */}
                    <span className="text-xs text-noc-fg flex-1 min-w-0 truncate" title={`${entry.actor || entry.op} · ${entry.time} · ${entry.action}`}>
                      <span className="text-noc-muted">{entry.actor || entry.op}</span>
                      <span className="text-noc-border/70 px-1">·</span>
                      {entry.action}
                    </span>

                    {/* Outcome */}
                    <span className={`text-[11px] flex-shrink-0 text-right max-w-[110px] leading-tight ${OUTCOME_CLASS[entry.outcome] ?? 'text-noc-muted'}`}>
                      {entry.label}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-noc-border flex-shrink-0 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onIssueResolved}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-noc-accent/35 bg-noc-accent/10 px-3 py-2 text-xs font-semibold text-noc-accent hover:bg-noc-accent/15 transition-colors cursor-pointer"
            >
              <CheckCircle2 size={13} />
              Issue Resolved
            </button>
            <button
              type="button"
              onClick={onEscalate}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-noc-warning/35 bg-noc-warning/10 px-3 py-2 text-xs font-semibold text-noc-warning hover:bg-noc-warning/15 transition-colors cursor-pointer"
            >
              <Send size={13} />
              Escalate
            </button>
          </div>
          <p className="text-[10px] text-noc-muted/50 leading-relaxed">
            Platform actions only — device events, operator sessions, and actions taken through Optim.
          </p>
        </div>
      </div>
    </>
  )
}
