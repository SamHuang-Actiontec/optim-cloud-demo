import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { RoleProvider, useRole } from './context/RoleContext'
import TopBar from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import NetworkPage from './components/network/NetworkPage'
import NetworkPageOperator from './components/network/NetworkPageOperator'
import SubscriberPage from './components/subscriber/SubscriberPage'
import DashboardPage from './components/dashboard/DashboardPage'
import InventoryManagementPage from './components/inventory/InventoryManagementPage'
import DataElementPage from './components/data/DataElementPage'
import AccessManagementPage from './components/access/AccessManagementPage'
import { useAuditLog } from './hooks/useAuditLog'
import FloatingFeedback from './components/layout/FloatingFeedback'

export default function App() {
  return (
    <ThemeProvider>
      <RoleProvider>
        <AppShell />
      </RoleProvider>
    </ThemeProvider>
  )
}

function AppShell() {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [referrer, setReferrer] = useState(null)
  const [navCount, setNavCount] = useState(0)
  const [networkLaunch, setNetworkLaunch] = useState(null)
  const { log, operator } = useAuditLog()
  const { role } = useRole()

  function navigateTo(page) {
    setReferrer(null)
    setNetworkLaunch(null)
    setActiveNav(page)
    if (page === 'dashboard') setNavCount(c => c + 1)
  }

  function navigateBack() {
    const dest = referrer || 'dashboard'
    setNetworkLaunch(null)
    setActiveNav(dest)
    setReferrer(null)
    if (dest === 'dashboard') setNavCount(c => c + 1)
  }

  function openNetworkFromSubscriber(customer) {
    setReferrer('subscriber')
    setNetworkLaunch({ customer, token: Date.now() })
    setActiveNav('network')
  }

  const breadcrumbs = {
    dashboard: 'Dashboard',
    network:   'Network / Customer Lookup',
    subscriber: 'Subscriber / Customer Directory',
    inventory: 'Inventory Management',
    data:      'Data Element',
    access:    'Access Management',
  }

  return (
    <div className="flex flex-col h-screen bg-noc-bg overflow-hidden" style={{ zoom: 1.265 }}>
      <TopBar
        operator={operator}
        breadcrumb={breadcrumbs[activeNav] || null}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={activeNav} onNavigate={navigateTo} />
        <main
          className={`flex-1 flex flex-col overflow-hidden${activeNav !== 'dashboard' ? ' page-zoom' : ''}`}
        >
          {activeNav === 'dashboard' ? (
            <DashboardPage key={navCount} onLog={log} />
          ) : activeNav === 'network' ? (
            role === 'operator' ? (
              <NetworkPageOperator
                onLog={log}
                referrer={referrer}
                onNavigateBack={navigateBack}
                initialCustomer={networkLaunch}
              />
            ) : (
              <NetworkPage
                onLog={log}
                referrer={referrer}
                onNavigateBack={navigateBack}
                initialCustomer={networkLaunch}
              />
            )
          ) : activeNav === 'subscriber' ? (
            <SubscriberPage
              onLog={log}
              onOpenNetwork={openNetworkFromSubscriber}
            />
          ) : activeNav === 'inventory' ? (
            <InventoryManagementPage onLog={log} />
          ) : activeNav === 'data' ? (
            <DataElementPage onLog={log} />
          ) : activeNav === 'access' ? (
            <AccessManagementPage onLog={log} />
          ) : (
            <PlaceholderPage label={activeNav} />
          )}
        </main>
      </div>
      <FloatingFeedback />
    </div>
  )
}

function PlaceholderPage({ label }) {
  const titles = {
    scheduler:  'Scheduler & Reports',
    iam:        'Identity / Access Management',
    system:     'System Management',
    devops:     'DevOps',
    debug:      'Debug',
    data:       'Data Element',
    firmware:   'Firmware Management',
    cloud:      'Cloud Apps Management',
    equipment:  'Equipment Management',
    subscriber: 'Subscriber Directory',
  }
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-noc-muted text-lg font-medium">{titles[label] || label}</p>
        <p className="text-noc-muted/50 text-sm mt-1">This section will be built in a future phase.</p>
      </div>
    </div>
  )
}
