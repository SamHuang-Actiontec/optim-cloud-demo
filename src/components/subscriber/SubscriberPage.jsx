import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Network,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { maskPhone, mockCustomers, timeAgo, truncateNetworkId } from '../../data/mockCustomers'

const PAGE_SIZE = 8

const ADDITIONAL_NETWORKS = {
  'cust-001': [
    {
      key: 'guest',
      networkId: 'Strothmann_Guest',
      serial: 'JG1250100088',
      deviceModel: 'Actiontec WF-Mesh Extender',
      status: 'online',
      lastSeen: new Date(Date.now() - 75 * 1000).toISOString(),
      serviceLevel: '300 Mbps Managed Wi-Fi',
      wan: { type: 'fiber', health: 'good', speedDown: 288, speedUp: 279, latency: 5, packetLoss: 0 },
      wifi: { rssi: -58, snr: 25, band: '5 GHz', channel: 44, retries: 5 },
    },
  ],
  'cust-002': [
    {
      key: 'mesh',
      networkId: 'Choo_Work_Studio',
      serial: 'JG1250100091',
      deviceModel: 'Actiontec WF-720GF',
      status: 'degraded',
      lastSeen: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      serviceLevel: '300 Mbps Cable',
      wan: { type: 'docsis', health: 'warning', speedDown: 188, speedUp: 20, latency: 28, packetLoss: 1.6 },
      wifi: { rssi: -71, snr: 16, band: '2.4 GHz', channel: 11, retries: 34 },
    },
  ],
  'cust-006': [
    {
      key: 'business',
      networkId: 'Webb_Studio',
      serial: 'JG1250200086',
      deviceModel: 'Actiontec WF-1000v4',
      status: 'online',
      lastSeen: new Date(Date.now() - 25 * 1000).toISOString(),
      serviceLevel: '1 Gbps Fiber',
      wan: { type: 'fiber', health: 'good', speedDown: 954, speedUp: 920, latency: 4, packetLoss: 0 },
      wifi: { rssi: -51, snr: 30, band: '6 GHz', channel: 37, retries: 2 },
    },
  ],
}

const STATUS_STYLE = {
  active: 'text-noc-accent border-noc-accent/30 bg-noc-accent/10',
  pending: 'text-noc-warning border-noc-warning/30 bg-noc-warning/10',
  suspended: 'text-noc-danger border-noc-danger/30 bg-noc-danger/10',
  disconnected: 'text-noc-danger border-noc-danger/30 bg-noc-danger/10',
  online: 'text-noc-accent border-noc-accent/30 bg-noc-accent/10',
  degraded: 'text-noc-warning border-noc-warning/30 bg-noc-warning/10',
  offline: 'text-noc-danger border-noc-danger/30 bg-noc-danger/10',
  unknown: 'text-noc-muted border-noc-border bg-noc-raised/50',
}

function normalizePhone(value) {
  return (value || '').replace(/\D/g, '')
}

function formatAddress(address) {
  if (!address) return '—'
  return `${address.street}, ${address.city}, ${address.state} ${address.zip}`
}

function cloneNetwork(customer, variant) {
  return {
    ...customer,
    ...variant,
    id: `${customer.id}-${variant.key}`,
    accountNumber: customer.accountNumber,
    subscriber: customer.subscriber,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    accountStatus: customer.accountStatus,
  }
}

function buildSubscriberRecords(localSubscribers) {
  const records = mockCustomers
    .filter((customer) => customer.subscriber && customer.phone)
    .map((customer) => {
      const networks = [
        customer,
        ...(ADDITIONAL_NETWORKS[customer.id] || []).map((variant) => cloneNetwork(customer, variant)),
      ]

      return {
        id: `sub-${customer.id}`,
        name: customer.subscriber,
        phone: customer.phone,
        email: customer.email,
        accountNumber: customer.accountNumber,
        address: customer.address,
        accountStatus: customer.accountStatus || 'unknown',
        plan: customer.serviceLevel || 'Unknown',
        networks,
      }
    })

  return [...localSubscribers, ...records]
}

function csvEscape(value) {
  const str = value == null ? '' : String(value)
  return `"${str.replaceAll('"', '""')}"`
}

function exportSpreadsheet(records) {
  const headers = ['Subscriber', 'Phone', 'Email', 'Account', 'Address', 'Status', 'Plan', 'Networks']
  const rows = records.map((subscriber) => [
    subscriber.name,
    subscriber.phone,
    subscriber.email,
    subscriber.accountNumber,
    formatAddress(subscriber.address),
    subscriber.accountStatus,
    subscriber.plan,
    subscriber.networks.map((network) => network.networkId || network.serial).join('; '),
  ])
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `subscriber-export-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function StatusBadge({ value }) {
  const key = value || 'unknown'
  return (
    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${STATUS_STYLE[key] || STATUS_STYLE.unknown}`}>
      {key}
    </span>
  )
}

function AddSubscriberRow({ onCancel, onCreate }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', plan: '' })

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(e) {
    e.preventDefault()
    const name = form.name.trim()
    const phone = normalizePhone(form.phone)
    if (!name || phone.length < 7) return

    onCreate({
      id: `local-sub-${Date.now()}`,
      name,
      phone,
      email: 'pending@email.com',
      accountNumber: `ACT-NEW-${String(Date.now()).slice(-4)}`,
      address: form.address.trim() ? { street: form.address.trim(), city: '', state: '', zip: '' } : null,
      accountStatus: 'pending',
      plan: form.plan.trim() || 'Pending plan assignment',
      networks: [],
    })
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-[1fr_150px_1.5fr_180px_auto] gap-2 p-3 border-b border-noc-border bg-noc-info/5">
      <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Name" className="h-9 rounded-lg border border-noc-border bg-noc-surface px-3 text-sm text-noc-fg placeholder:text-noc-muted/60 focus:outline-none focus:border-noc-info" />
      <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Phone" className="h-9 rounded-lg border border-noc-border bg-noc-surface px-3 text-sm text-noc-fg placeholder:text-noc-muted/60 focus:outline-none focus:border-noc-info" />
      <input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Address" className="h-9 rounded-lg border border-noc-border bg-noc-surface px-3 text-sm text-noc-fg placeholder:text-noc-muted/60 focus:outline-none focus:border-noc-info" />
      <input value={form.plan} onChange={(e) => update('plan', e.target.value)} placeholder="Plan" className="h-9 rounded-lg border border-noc-border bg-noc-surface px-3 text-sm text-noc-fg placeholder:text-noc-muted/60 focus:outline-none focus:border-noc-info" />
      <div className="flex gap-2">
        <button type="submit" className="h-9 px-3 rounded-lg bg-noc-info text-white text-xs font-bold hover:bg-noc-info/90 cursor-pointer">Save</button>
        <button type="button" onClick={onCancel} className="h-9 px-3 rounded-lg border border-noc-border text-noc-muted text-xs font-bold hover:text-noc-fg cursor-pointer">Cancel</button>
      </div>
    </form>
  )
}

function SubscriberRow({ subscriber, expanded, onToggle, onOpenNetwork }) {
  return (
    <>
      <tr className="border-b border-noc-border/70 hover:bg-noc-raised/30">
        <td className="px-4 py-3">
          <button type="button" onClick={onToggle} className="flex items-center gap-2 text-left text-noc-fg font-semibold cursor-pointer">
            <ChevronDown size={14} className={`text-noc-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
            <span>{subscriber.name}</span>
          </button>
          <p className="text-[11px] text-noc-muted font-code mt-0.5">{subscriber.accountNumber}</p>
        </td>
        <td className="px-4 py-3 text-sm text-noc-fg whitespace-nowrap">{maskPhone(subscriber.phone)}</td>
        <td className="px-4 py-3 text-sm text-noc-muted max-w-[300px] truncate">{formatAddress(subscriber.address)}</td>
        <td className="px-4 py-3 text-sm text-noc-fg whitespace-nowrap">{subscriber.plan}</td>
        <td className="px-4 py-3 text-sm text-noc-fg whitespace-nowrap">{subscriber.networks.length}</td>
        <td className="px-4 py-3"><StatusBadge value={subscriber.accountStatus} /></td>
      </tr>

      {expanded && (
        <tr className="border-b border-noc-border/70 bg-noc-raised/20">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Subscriber Details</p>
                  <p className="text-noc-muted mt-1">{subscriber.email}</p>
                  <p className="text-noc-muted">{formatAddress(subscriber.address)}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label mb-2">Networks under this subscriber</p>
                {subscriber.networks.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {subscriber.networks.map((network) => (
                      <button
                        key={network.id}
                        type="button"
                        onClick={() => onOpenNetwork(network)}
                        className="flex items-center justify-between gap-3 rounded-lg border border-noc-border bg-noc-surface px-3 py-2 text-left hover:border-noc-info/50 hover:bg-noc-info/10 cursor-pointer"
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <Network size={13} className="text-noc-info shrink-0" />
                            <span className="font-code text-sm text-noc-info truncate">{truncateNetworkId(network.networkId)}</span>
                          </span>
                          <span className="block text-xs text-noc-muted mt-1 truncate">
                            {network.serviceLevel || subscriber.plan} · {network.deviceModel || 'Gateway'} · Last seen {timeAgo(network.lastSeen)}
                          </span>
                        </span>
                        <ArrowRight size={14} className="text-noc-muted shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-noc-border bg-noc-surface px-3 py-2 text-sm text-noc-muted">No network linked yet.</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function SubscriberPage({ onLog, onOpenNetwork }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const [showAddRow, setShowAddRow] = useState(false)
  const [localSubscribers, setLocalSubscribers] = useState([])

  const subscribers = useMemo(() => buildSubscriberRecords(localSubscribers), [localSubscribers])
  const filteredSubscribers = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = normalizePhone(query)
    if (q.length < 2 && digits.length < 2) return subscribers

    return subscribers.filter((subscriber) => (
      subscriber.name.toLowerCase().includes(q) ||
      subscriber.accountNumber.toLowerCase().includes(q) ||
      subscriber.plan.toLowerCase().includes(q) ||
      formatAddress(subscriber.address).toLowerCase().includes(q) ||
      normalizePhone(subscriber.phone).includes(digits)
    ))
  }, [query, subscribers])

  const pageCount = Math.max(1, Math.ceil(filteredSubscribers.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const visibleSubscribers = filteredSubscribers.slice(pageStart, pageStart + PAGE_SIZE)

  function handleQuery(value) {
    setQuery(value)
    setPage(1)
    setExpandedId(null)
  }

  function addSubscriber(subscriber) {
    setLocalSubscribers((current) => [subscriber, ...current])
    setShowAddRow(false)
    setPage(1)
    setExpandedId(subscriber.id)
    onLog?.('SUBSCRIBER_CREATED', { subscriber: subscriber.name, phone: subscriber.phone })
  }

  function openNetwork(network) {
    onLog?.('SUBSCRIBER_NETWORK_OPENED', { subscriber: network.subscriber, networkId: network.networkId })
    onOpenNetwork?.(network)
  }

  function handleExport() {
    exportSpreadsheet(filteredSubscribers)
    onLog?.('SUBSCRIBER_EXPORT', { count: filteredSubscribers.length })
  }

  return (
    <div className="dashboard-tech-bg flex-1 overflow-y-auto scrollbar-dark bg-noc-bg">
      <div className="dashboard-search-band px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-[14px] font-extrabold tracking-[0.08em] uppercase text-noc-label">Subscriber Directory</h2>
            <p className="text-noc-muted/90 text-sm mt-1">Simple subscriber list with linked networks and plans.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowAddRow((current) => !current)} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-noc-info text-white text-xs font-bold hover:bg-noc-info/90 cursor-pointer">
              <Plus size={14} />
              Add
            </button>
            <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-noc-border bg-noc-surface text-noc-fg text-xs font-bold hover:border-noc-info/50 hover:text-noc-info cursor-pointer">
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
      </div>

      <section className="dashboard-ops-band dashboard-ops-band-last space-y-4">
        <div className="dashboard-tech-search border border-noc-border rounded-xl bg-noc-surface overflow-hidden">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 border-b border-noc-border">
            <div className="flex items-center gap-3 h-10 rounded-lg border border-noc-border bg-noc-raised/30 px-3 lg:w-[440px] focus-within:border-noc-info focus-within:ring-1 focus-within:ring-noc-info/25">
              <Search size={15} className="text-noc-muted shrink-0" />
              <input
                value={query}
                onChange={(e) => handleQuery(e.target.value)}
                placeholder="Search name, phone, address, plan…"
                className="flex-1 min-w-0 bg-transparent text-sm text-noc-fg placeholder:text-noc-muted/60 focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => handleQuery('')} className="text-noc-muted hover:text-noc-fg cursor-pointer">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-xs text-noc-muted">
              Showing <span className="font-code text-noc-fg">{visibleSubscribers.length}</span> of{' '}
              <span className="font-code text-noc-fg">{filteredSubscribers.length}</span> subscribers
            </p>
          </div>

          {showAddRow && (
            <AddSubscriberRow
              onCancel={() => setShowAddRow(false)}
              onCreate={addSubscriber}
            />
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-noc-raised/40 border-b border-noc-border">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Name</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Phone</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Address</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Plan</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Networks</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleSubscribers.map((subscriber) => (
                  <SubscriberRow
                    key={subscriber.id}
                    subscriber={subscriber}
                    expanded={expandedId === subscriber.id}
                    onToggle={() => setExpandedId((current) => current === subscriber.id ? null : subscriber.id)}
                    onOpenNetwork={openNetwork}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubscribers.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-noc-fg font-semibold">No subscribers found</p>
              <p className="text-noc-muted text-sm mt-1">Try another name, phone number, address, or plan.</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 p-4 border-t border-noc-border">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-noc-border text-xs font-bold text-noc-fg disabled:opacity-40 disabled:cursor-default hover:border-noc-info/50 cursor-pointer"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <span className="text-xs text-noc-muted">
              Page <span className="font-code text-noc-fg">{safePage}</span> / <span className="font-code text-noc-fg">{pageCount}</span>
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={safePage === pageCount}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-noc-border text-xs font-bold text-noc-fg disabled:opacity-40 disabled:cursor-default hover:border-noc-info/50 cursor-pointer"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
