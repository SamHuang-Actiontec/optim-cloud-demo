import { Clock, ChevronRight } from 'lucide-react'
import { truncateNetworkId, timeAgo } from '../../data/mockCustomers'

const STATUS_DOT = {
  healthy:  'bg-noc-accent',
  online:   'bg-noc-accent',
  degraded: 'bg-noc-warning',
  critical: 'bg-noc-danger',
  offline:  'bg-noc-danger',
  unknown:  'bg-noc-muted',
}

const ACCOUNT_BADGE = {
  active:       'text-noc-accent border-noc-accent/30',
  suspended:    'text-noc-warning border-noc-warning/30',
  disconnected: 'text-noc-danger border-noc-danger/30',
}

export default function RecentSearches({ recentSearches, onSelect }) {
  if (recentSearches.length === 0) return null

  return (
    <div className="dashboard-tool-panel rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="dashboard-section-icon">
          <Clock size={13} />
        </div>
        <span className="text-[12px] font-extrabold tracking-[0.08em] uppercase text-noc-label">Recent Searches</span>
        <span className="text-noc-muted text-2xs font-code ml-auto">{recentSearches.length} of 5</span>
      </div>

      <div className="border border-noc-border rounded-lg overflow-hidden divide-y divide-noc-border">
        {recentSearches.map((customer) => {
          const displayStatus = customer.healthStatus || (customer.status === 'online' ? 'healthy' : customer.status === 'offline' ? 'critical' : customer.status)
          const dot = STATUS_DOT[displayStatus] || STATUS_DOT.unknown
          const badge = customer.accountStatus ? ACCOUNT_BADGE[customer.accountStatus] : null

          return (
            <button
              key={customer.id}
              onClick={() => onSelect(customer)}
              className="w-full flex items-center gap-4 px-4 py-3 bg-noc-surface hover:bg-noc-raised transition-colors duration-150 cursor-pointer text-left group"
              aria-label={`Re-open ${customer.subscriber || customer.serial}`}
            >
              {/* Status dot */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />

              {/* Serial */}
              <span className="font-code text-xs text-noc-fg w-32 shrink-0 truncate">
                {customer.serial}
              </span>

              {/* Name */}
              <span className={`text-sm flex-1 min-w-0 truncate ${customer.subscriber ? 'text-noc-fg' : 'text-noc-muted italic'}`}>
                {customer.subscriber || 'No Subscriber'}
              </span>

              {/* Network ID */}
              <span className="text-noc-info text-xs font-code hidden sm:block w-28 truncate">
                {truncateNetworkId(customer.networkId)}
              </span>

              {/* Account status */}
              {badge ? (
                <span className={`text-2xs font-code border px-1.5 py-0.5 rounded hidden md:block capitalize ${badge}`}>
                  {customer.accountStatus}
                </span>
              ) : (
                <span className="text-noc-muted text-2xs hidden md:block">—</span>
              )}

              {/* Last seen */}
              <span className="text-noc-muted text-2xs font-code hidden lg:block w-14 text-right shrink-0">
                {timeAgo(customer.lastSeen)}
              </span>

              <ChevronRight size={14} className="text-noc-muted group-hover:text-noc-fg transition-colors shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
