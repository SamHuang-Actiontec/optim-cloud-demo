import { Users, Wifi, AlertTriangle, Clock } from 'lucide-react'
import { mockStats } from '../../data/mockCustomers'

function StatTile({ icon: Icon, label, value, sub, iconColor, trend }) {
  return (
    <div className="dashboard-tech-kpi px-4 py-3 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div className={`dashboard-section-icon ${iconColor}`}>
          <Icon size={14} />
        </div>
        {trend && (
          <span className="text-[11px] font-semibold text-noc-accent font-code shrink-0">{trend}</span>
        )}
      </div>
      <div className="min-w-0 mt-2">
        <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-noc-label truncate">{label}</p>
        <p className="text-noc-fg font-code text-lg font-semibold leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-noc-muted/85 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

export default function StatsBar() {
  const s = mockStats
  const onlinePct = Math.round((s.devicesOnline / s.devicesTotal) * 100)

  return (
    <div className="dashboard-tech-hero border border-noc-border/70 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-noc-border/70">
      <StatTile
        icon={Users}
        label="Active Subscribers"
        value={s.totalSubscribers.toLocaleString()}
        sub={`+${s.newSubscribersToday} today`}
        iconColor="text-noc-info"
        trend={`+${s.newSubscribersToday}`}
      />
      <StatTile
        icon={Wifi}
        label="Devices Online"
        value={`${s.devicesOnline.toLocaleString()}`}
        sub={`${onlinePct}% of fleet`}
        iconColor={onlinePct >= 95 ? 'text-noc-accent' : 'text-noc-warning'}
      />
      <StatTile
        icon={AlertTriangle}
        label="Open Incidents"
        value={s.openIncidents}
        sub={`${s.criticalIncidents} critical`}
        iconColor={s.criticalIncidents > 0 ? 'text-noc-danger' : 'text-noc-warning'}
      />
      <StatTile
        icon={Clock}
        label="Avg Handle Time"
        value={`${Math.floor(s.avgHandleTimeSec / 60)}m ${s.avgHandleTimeSec % 60}s`}
        sub="Per customer case"
        iconColor="text-noc-muted"
      />
    </div>
  )
}
