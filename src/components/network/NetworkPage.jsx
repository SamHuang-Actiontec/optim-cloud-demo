import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import StatsBar from './StatsBar'
import SearchPanel from './SearchPanel'
import RecentSearches from './RecentSearches'
import CustomerDetailPage from './detail/CustomerDetailPage'

const MAX_RECENT = 5

const REFERRER_LABEL = {
  dashboard: '← Dashboard',
  subscriber: '← Subscriber',
}

export default function NetworkPage({
  onLog,
  referrer,
  onNavigateBack,
  initialCustomer,
  DetailPageComponent = CustomerDetailPage,
}) {
  const [recentSearches, setRecentSearches] = useState(() => initialCustomer?.customer ? [initialCustomer.customer] : [])
  const [selectedCustomer, setSelectedCustomer] = useState(() => initialCustomer?.customer || null)

  function addRecent(customer) {
    setRecentSearches((prev) => {
      const filtered = prev.filter((c) => c.id !== customer.id)
      return [customer, ...filtered].slice(0, MAX_RECENT)
    })
  }

  function handleSelectCustomer(customer) {
    addRecent(customer)
    setSelectedCustomer(customer)
  }

  // If a customer has been selected, show the full detail page
  if (selectedCustomer) {
    return (
      <DetailPageComponent
        customer={selectedCustomer}
        onBack={() => {
          if (referrer && onNavigateBack) {
            onNavigateBack()
          } else {
            setSelectedCustomer(null)
          }
        }}
      />
    )
  }

  return (
    <div className="dashboard-tech-bg flex-1 overflow-y-auto scrollbar-dark bg-noc-bg">
      <div className="dashboard-search-band px-6 py-4">
        {referrer && onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 text-noc-info text-xs mb-2 hover:text-noc-fg transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            {REFERRER_LABEL[referrer] || `← Back`}
          </button>
        )}
        <h2 className="text-[14px] font-extrabold tracking-[0.08em] uppercase text-noc-label">Network Lookup</h2>
        <p className="text-noc-muted/90 text-sm mt-1">Unified customer search for ISP engineer and operator roles</p>
      </div>

      <section className="dashboard-ops-band">
        <StatsBar />
      </section>

      <section className="dashboard-ops-band dashboard-ops-band-last network-search-band space-y-4">
        <div className="dashboard-tech-search network-lookup-card border border-noc-border rounded-xl p-5">
          <SearchPanel
            recentSearches={recentSearches}
            onSelectCustomer={handleSelectCustomer}
            onLog={onLog}
          />
        </div>

        {recentSearches.length > 0 && (
          <RecentSearches
            recentSearches={recentSearches}
            onSelect={handleSelectCustomer}
          />
        )}

      </section>
    </div>
  )
}
