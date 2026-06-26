import { truncateNetworkId, timeAgo } from '../../data/mockCustomers'

const STATUS_CONFIG = {
  healthy:  { dot: 'bg-noc-accent',  label: 'Healthy',  badge: 'text-noc-accent border-noc-accent/30 bg-noc-accent/10' },
  degraded: { dot: 'bg-noc-warning', label: 'Degraded', badge: 'text-noc-warning border-noc-warning/30 bg-noc-warning/10' },
  critical: { dot: 'bg-noc-danger',  label: 'Critical', badge: 'text-noc-danger border-noc-danger/30 bg-noc-danger/10' },
  unknown:  { dot: 'bg-noc-muted',   label: 'Unknown',  badge: 'text-noc-muted border-noc-border bg-noc-raised/40' },
}

export default function SearchResultRow({ customer, onClick, isKeyboardSelected }) {
  const displayStatus = customer.healthStatus || (customer.status === 'online' ? 'healthy' : customer.status === 'offline' ? 'critical' : customer.status)
  const cfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.unknown
  const netId = truncateNetworkId(customer.networkId)
  const isSubscriber = !!customer.subscriber

  return (
    <button
      onClick={() => onClick(customer)}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer
        transition-colors duration-100
        ${isKeyboardSelected ? 'bg-noc-info/10' : 'hover:bg-noc-raised'}
        focus:outline-none focus:bg-noc-info/10
      `}
      aria-label={`Select customer ${customer.subscriber || customer.serial}`}
    >
      {/* Status dot */}
      <div className="shrink-0 flex flex-col items-center gap-1">
        <span
          className={`w-2 h-2 rounded-full ${cfg.dot} ${displayStatus === 'healthy' ? 'shadow-[0_0_6px_1px] shadow-noc-accent/50' : ''}`}
          aria-label={cfg.label}
        />
      </div>

      {/* Serial */}
      <span className="font-code text-sm text-noc-fg w-36 shrink-0 truncate">
        {customer.serial}
      </span>

      {/* Name */}
      <span className={`text-sm flex-1 min-w-0 truncate ${isSubscriber ? 'text-noc-fg' : 'text-noc-muted italic'}`}>
        {customer.subscriber || 'No Subscriber'}
      </span>

      {/* Network ID */}
      <span className="text-noc-info text-xs font-code w-32 shrink-0 truncate hidden sm:block">
        {netId}
      </span>

      {/* Health badge */}
      <span className="w-20 shrink-0 hidden md:block">
        <span className={`inline-flex justify-center min-w-[64px] text-2xs font-semibold px-1.5 py-0.5 rounded border font-code ${cfg.badge}`}>
          {cfg.label}
        </span>
      </span>

      {/* Last seen */}
      <span className="text-noc-muted text-2xs font-code w-16 shrink-0 text-right hidden lg:block">
        {timeAgo(customer.lastSeen)}
      </span>
    </button>
  )
}
