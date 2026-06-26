import { useState } from 'react'
import {
  LayoutDashboard, Network, CalendarClock, ShieldCheck,
  Settings, Wrench, Bug, Database, HardDrive, Cloud,
  Boxes, Archive, ChevronRight, ChevronLeft, Users, Lock,
} from 'lucide-react'
import { useRole } from '../../context/RoleContext'

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',               icon: LayoutDashboard, active: false },
  { id: 'network',     label: 'Network',                  icon: Network,          active: true  },
  { id: 'subscriber',  label: 'Subscriber',               icon: Users,            active: true  },
  { id: 'scheduler',   label: 'Scheduler & Reports',      icon: CalendarClock,    active: false, children: true },
  { id: 'iam',         label: 'Identity / Access Mgmt',   icon: ShieldCheck,      active: false, children: true },
  { id: 'system',      label: 'System Management',        icon: Settings,         active: false, children: true },
  { id: 'devops',      label: 'DevOps',                   icon: Wrench,           active: false, children: true },
  { id: 'debug',       label: 'Debug',                    icon: Bug,              active: false, children: true },
  { id: 'data',        label: 'Data Element',             icon: Database,         active: false },
  { id: 'firmware',    label: 'Firmware Management',      icon: HardDrive,        active: false, children: true },
  { id: 'cloud',       label: 'Cloud Apps Management',    icon: Cloud,            active: false, children: true },
  { id: 'equipment',   label: 'Equipment Management',     icon: Boxes,            active: false, children: true },
  { id: 'inventory',   label: 'Inventory Management',     icon: Archive,          active: false, children: true },
  { id: 'access',      label: 'Access Management',        icon: Lock,             active: false },
]

export default function Sidebar({ activeItem = 'network', onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const { role } = useRole()

  // Filter items based on role
  let visibleItems = NAV_ITEMS
  if (role === 'operator') {
    // Operators only see customer-facing service tools
    visibleItems = NAV_ITEMS.filter(item => ['network', 'subscriber'].includes(item.id))
  } else if (role === 'engineer') {
    // Engineers see: dashboard, network, subscriber, data element, firmware, inventory
    visibleItems = NAV_ITEMS.filter(item =>
      ['dashboard', 'network', 'subscriber', 'data', 'firmware', 'inventory'].includes(item.id)
    )
  } else if (role === 'isp-admin') {
    // ISP Admin sees: dashboard, network, subscriber, data element, firmware, inventory, access
    visibleItems = NAV_ITEMS.filter(item =>
      ['dashboard', 'network', 'subscriber', 'data', 'firmware', 'inventory', 'access'].includes(item.id)
    )
  }

  return (
    <aside
      className={`
        flex flex-col border-r border-noc-border bg-noc-surface shrink-0
        transition-all duration-200
        ${collapsed ? 'w-14' : 'w-52'}
      `}
    >
      {/* Nav items */}
      <nav className="flex-1 py-2 overflow-y-auto scrollbar-dark">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeItem
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 text-sm
                transition-colors duration-150 cursor-pointer
                ${isActive
                  ? 'bg-noc-info/10 text-noc-info border-r-2 border-noc-info'
                  : 'text-noc-muted hover:bg-noc-raised hover:text-noc-fg'}
              `}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.children && (
                    <ChevronRight size={13} className="shrink-0 opacity-40" />
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-noc-border p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-noc-muted hover:text-noc-fg hover:bg-noc-raised rounded-md text-xs transition-colors duration-150 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  )
}
