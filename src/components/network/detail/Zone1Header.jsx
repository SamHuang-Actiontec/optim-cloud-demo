import { useState } from 'react'
import { ArrowLeft, User, Globe, CalendarDays, Hash, Phone, MapPin, Zap, AlertTriangle, ClipboardList, Info, ChevronRight } from 'lucide-react'
import ActivityLogDrawer from './ActivityLogDrawer'

// ── Account status ─────────────────────────────────────────────────────────────
const ACCT = {
  pending: {
    label: 'Pending',
    textClass: 'text-noc-info',
    bgClass: 'bg-noc-info/10',
    borderClass: 'border-noc-info/30',
    leftBorder: 'border-l-4 border-l-noc-info',
  },
  active: {
    label: 'Active',
    textClass: 'text-noc-accent',
    bgClass: 'bg-noc-accent/10',
    borderClass: 'border-noc-accent/30',
    leftBorder: '',
  },
  suspended: {
    label: 'Suspended',
    textClass: 'text-noc-danger',
    bgClass: 'bg-noc-danger/10',
    borderClass: 'border-noc-danger/30',
    leftBorder: 'border-l-4 border-l-noc-danger',
  },
}

const SUSPENDED_SUBLABEL = {
  'non-payment': '· Non-Payment',
  'voluntary':   '· Voluntary',
  'admin':       '· Administrative',
}

// ── Service health ─────────────────────────────────────────────────────────────
const SVC = {
  online:   { label: 'Online',   textClass: 'text-noc-accent',  dotClass: 'bg-noc-accent',  bgClass: 'bg-noc-accent/10',  borderClass: 'border-noc-accent/30',  pulse: true  },
  degraded: { label: 'Degraded', textClass: 'text-noc-warning', dotClass: 'bg-noc-warning', bgClass: 'bg-noc-warning/10', borderClass: 'border-noc-warning/30', pulse: false },
  offline:  { label: 'Offline',  textClass: 'text-noc-danger',  dotClass: 'bg-noc-danger',  bgClass: 'bg-noc-danger/10',  borderClass: 'border-noc-danger/30',  pulse: false },
  unknown:  { label: 'Unknown',  textClass: 'text-noc-muted',   dotClass: 'bg-noc-muted',   bgClass: 'bg-noc-raised/50',  borderClass: 'border-noc-border',    pulse: false },
}

// ── Legend tooltips ────────────────────────────────────────────────────────────
const ACCT_LEGEND = (
  <div className="space-y-2">
    <p className="font-semibold text-noc-fg text-xs mb-2">Account Status</p>
    <div className="flex gap-2 items-start"><span className="text-noc-info font-semibold text-xs w-20 flex-shrink-0">Pending</span><span className="text-noc-muted text-xs">Order placed, service not yet active</span></div>
    <div className="flex gap-2 items-start"><span className="text-noc-accent font-semibold text-xs w-20 flex-shrink-0">Active</span><span className="text-noc-muted text-xs">Service running, full operator scope</span></div>
    <div className="flex gap-2 items-start"><span className="text-noc-danger font-semibold text-xs w-20 flex-shrink-0">Suspended</span><span className="text-noc-muted text-xs">Service off — resolve account before tech support</span></div>
  </div>
)

const SVC_LEGEND = (
  <div className="space-y-2">
    <p className="font-semibold text-noc-fg text-xs mb-2">Service Health</p>
    <div className="flex gap-2 items-start"><span className="text-noc-accent font-semibold text-xs w-16 flex-shrink-0">Online</span><span className="text-noc-muted text-xs">Device connected, traffic flowing</span></div>
    <div className="flex gap-2 items-start"><span className="text-noc-warning font-semibold text-xs w-16 flex-shrink-0">Degraded</span><span className="text-noc-muted text-xs">Connected but issues detected</span></div>
    <div className="flex gap-2 items-start"><span className="text-noc-danger font-semibold text-xs w-16 flex-shrink-0">Offline</span><span className="text-noc-muted text-xs">Device not reachable</span></div>
    <div className="flex gap-2 items-start"><span className="text-noc-muted font-semibold text-xs w-16 flex-shrink-0">Unknown</span><span className="text-noc-muted text-xs">No recent poll — use Poll Now</span></div>
    <div className="flex gap-2 items-start"><span className="text-noc-muted/50 font-semibold text-xs w-16 flex-shrink-0">—</span><span className="text-noc-muted text-xs">N/A when account is not active</span></div>
  </div>
)

function Tooltip({ content }) {
  return (
    <div className="relative group">
      <Info size={12} className="text-noc-muted/50 cursor-help hover:text-noc-muted transition-colors" />
      <div className="absolute left-0 top-6 z-50 hidden group-hover:block w-64 bg-noc-raised border border-noc-border rounded-lg p-3.5 shadow-2xl pointer-events-none">
        {content}
      </div>
    </div>
  )
}

// ── Attention strip ────────────────────────────────────────────────────────────
function getAttention(customer) {
  if (customer.accountStatus === 'suspended') {
    const sub = customer.suspendedReason ? ` · ${SUSPENDED_SUBLABEL[customer.suspendedReason]?.replace('· ', '')}` : ''
    return { level: 'danger', msg: `Account suspended${sub} — resolve billing before providing technical support` }
  }
  if (customer.accountStatus === 'pending') {
    return { level: 'info', msg: 'Install pending — service not yet active, technical diagnosis unavailable' }
  }
  return null
}

// ── Phone formatting ───────────────────────────────────────────────────────────
function formatPhone(raw) {
  if (!raw) return null
  const d = raw.replace(/\D/g, '')
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  return raw
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, valueClass = 'text-noc-fg', mono = false }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-noc-label/60 flex-shrink-0">{icon}</span>
      <span className="text-noc-label text-xs flex-shrink-0 min-w-[46px]">{label}</span>
      <span className={`font-medium text-sm truncate ${valueClass} ${mono ? 'font-code' : ''}`}>{value}</span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Zone1Header({ customer, detail, onBack }) {
  const [logOpen, setLogOpen] = useState(false)

  const acctCfg = customer.accountStatus ? (ACCT[customer.accountStatus] ?? null) : null
  const isActive = customer.accountStatus === 'active'
  const svcCfg = isActive ? (SVC[customer.status] ?? SVC.unknown) : null

  const addr = customer.address
    ? `${customer.address.street}, ${customer.address.city} ${customer.address.state}`
    : null

  const attention = getAttention(customer)
  const hasLog = (detail?.activityLog?.length ?? 0) > 0
  const hasAccount = Boolean(customer.accountNumber)

  return (
    <>
      <div className={`flex-shrink-0 bg-noc-surface border-b border-noc-border ${acctCfg?.leftBorder ?? ''}`}>
        <div className="px-5 pt-3 pb-4">

          {/* Back nav */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-noc-muted hover:text-noc-fg text-xs mb-3 transition-colors cursor-pointer group"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            Network / Customer Lookup
          </button>

          {/* Name + serial/device — same row, truncate name only past 50 chars */}
          {(() => {
            const raw = customer.subscriber ?? 'Unprovisioned Device'
            const displayName = raw.length > 50 ? raw.slice(0, 50) + '…' : raw
            return (
              <div className="flex items-baseline justify-between gap-8 mb-2.5">
                <h1 className="text-noc-fg font-bold text-2xl leading-tight">
                  {displayName}
                </h1>
                <div className="flex items-baseline gap-4 flex-shrink-0">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-noc-muted text-[10px] font-semibold uppercase tracking-widest">SN</span>
                    <span className="text-noc-fg text-sm font-code font-semibold tracking-wider">{customer.serial}</span>
                  </span>
                  <span className="text-noc-border/60 select-none text-sm">·</span>
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-noc-muted text-[10px] font-semibold uppercase tracking-widest">CPE</span>
                    <span className="text-noc-muted text-sm">{customer.deviceModel}</span>
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Two badges */}
          {acctCfg && (
            <div className="flex items-center gap-3 mb-4">

              {/* Account badge */}
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1 rounded-full
                  ${acctCfg.textClass} ${acctCfg.bgClass} ${acctCfg.borderClass}`}>
                  <User size={12} className="flex-shrink-0" />
                  {acctCfg.label}
                  {customer.suspendedReason && SUSPENDED_SUBLABEL[customer.suspendedReason] && (
                    <span className="font-normal opacity-75">{SUSPENDED_SUBLABEL[customer.suspendedReason]}</span>
                  )}
                </span>
                <Tooltip content={ACCT_LEGEND} />
              </div>

              {/* Service badge */}
              <div className="flex items-center gap-1.5">
                {svcCfg ? (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1 rounded-full
                    ${svcCfg.textClass} ${svcCfg.bgClass} ${svcCfg.borderClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${svcCfg.dotClass} ${svcCfg.pulse ? 'animate-pulse' : ''}`} />
                    <Globe size={12} className="flex-shrink-0 opacity-80" />
                    {svcCfg.label}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1 rounded-full text-noc-muted/40 bg-noc-raised/20 border-noc-border/40">
                    <Globe size={12} className="flex-shrink-0" />
                    <span>—</span>
                  </span>
                )}
                <Tooltip content={SVC_LEGEND} />
              </div>

            </div>
          )}

          {/* Info grid — 2 columns */}
          {hasAccount && (
            <div className="grid grid-cols-2 gap-x-10 gap-y-2">
              <div className="space-y-2">
                <InfoRow icon={<Hash size={12} />} label="Account" value={customer.accountNumber} mono />
                {customer.serviceLevel && (
                  <InfoRow icon={<Zap size={12} />} label="Plan" value={customer.serviceLevel} valueClass="text-noc-info font-bold" />
                )}
                {detail?.installDate && (
                  <InfoRow icon={<CalendarDays size={12} />} label="Since" value={detail.installDate} />
                )}
              </div>
              <div className="space-y-2">
                {customer.phone && (
                  <InfoRow icon={<Phone size={12} />} label="Phone" value={formatPhone(customer.phone)} mono />
                )}
                {addr && (
                  <InfoRow icon={<MapPin size={12} />} label="Address" value={addr} />
                )}
                {hasLog && (
                  <button
                    onClick={() => setLogOpen(true)}
                    className="group flex items-center gap-2 text-sm text-noc-muted hover:text-noc-fg
                      border border-noc-border/60 hover:border-noc-border
                      bg-transparent hover:bg-noc-raised
                      px-2.5 py-1 rounded transition-all duration-150 cursor-pointer w-fit"
                  >
                    <ClipboardList size={12} className="flex-shrink-0" />
                    Activity Log
                    <ChevronRight size={12} className="flex-shrink-0 text-noc-muted/50 group-hover:text-noc-muted group-hover:translate-x-0.5 transition-all duration-150" />
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Attention strip — conditional */}
        {attention && (
          <div className={`px-5 py-2.5 border-t flex items-center gap-2 text-sm font-medium
            ${attention.level === 'danger'
              ? 'border-noc-danger/30 bg-noc-danger/8 text-noc-danger'
              : 'border-noc-info/30 bg-noc-info/8 text-noc-info'}`}
          >
            <AlertTriangle size={14} className="flex-shrink-0" />
            {attention.msg}
            {hasLog && (
              <button
                onClick={() => setLogOpen(true)}
                className="ml-auto text-sm underline underline-offset-2 cursor-pointer hover:opacity-80 flex-shrink-0"
              >
                Activity Log →
              </button>
            )}
          </div>
        )}

      </div>

      <ActivityLogDrawer
        open={logOpen}
        onClose={() => setLogOpen(false)}
        log={detail?.activityLog ?? []}
        customerName={customer.subscriber ?? 'Unprovisioned Device'}
        serial={customer.serial}
      />
    </>
  )
}
