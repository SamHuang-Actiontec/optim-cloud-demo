import { useMemo, useState } from 'react'
import { Download, Import, Plus, Search, Upload, X } from 'lucide-react'

const INITIAL_MODELS = [
  {
    id: 'mdl-01',
    model: 'AP-AX3000C',
    category: 'Gateway',
    vendor: 'Actiontec',
    lifecycle: 'Active',
    firmware: '5.4.3',
    total: 860,
    stock: 210,
    deployed: 590,
    online: 548,
    idle: 25,
    faulty: 17,
    rma: 12,
    image: '/model-gateway.svg',
    specs: {
      cpu: 'Dual-core 1.0 GHz',
      memory: '512 MB',
      flash: '256 MB',
      radio: '2.4G / 5G',
      wan: 'Ethernet, PON',
      lan: 'Ethernet, WiFi',
      features: 'VoIP, Smart Steering, DFS',
    },
    config: {
      profile: 'Fiber 1G Profile',
      compatibility: 'GPON, XGS-PON',
      policy: 'Auto-upgrade patch releases',
    },
  },
  {
    id: 'mdl-02',
    model: 'WF-709F',
    category: 'Extender',
    vendor: 'Actiontec',
    lifecycle: 'Active',
    firmware: '5.4.1',
    total: 470,
    stock: 106,
    deployed: 328,
    online: 301,
    idle: 18,
    faulty: 9,
    rma: 6,
    image: '/model-extender.svg',
    specs: {
      cpu: 'Dual-core 800 MHz',
      memory: '256 MB',
      flash: '128 MB',
      radio: '2.4G / 5G',
      wan: 'Ethernet',
      lan: 'Ethernet, WiFi',
      features: 'Mesh backhaul, Band steering',
    },
    config: {
      profile: 'WiFi Mesh Extender',
      compatibility: 'Gateway AP-AX3000C+',
      policy: 'Pinned major train',
    },
  },
  {
    id: 'mdl-03',
    model: 'ONT-BE6500C',
    category: 'ONT',
    vendor: 'Actiontec',
    lifecycle: 'Active',
    firmware: '3.9.8',
    total: 512,
    stock: 62,
    deployed: 425,
    online: 401,
    idle: 10,
    faulty: 14,
    rma: 11,
    image: '/model-ont.svg',
    specs: {
      cpu: 'Quad-core 1.2 GHz',
      memory: '1 GB',
      flash: '512 MB',
      radio: '2.4G / 5G / 6G',
      wan: 'PON',
      lan: 'Ethernet, WiFi',
      features: 'WiFi 6E, QoS, IPTV',
    },
    config: {
      profile: 'Fiber Business Profile',
      compatibility: 'GPON, XGS-PON',
      policy: 'Manual approval on major upgrade',
    },
  },
]

const EMPTY_FORM = {
  model: '',
  category: 'Gateway',
  vendor: '',
  lifecycle: 'Active',
  firmware: '',
  stock: '0',
  deployed: '0',
  online: '0',
  idle: '0',
  faulty: '0',
  rma: '0',
  image: '',
}

function StatCard({ label, value, tone = 'text-noc-fg' }) {
  return (
    <div className="rounded-lg border border-noc-border bg-noc-surface px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-noc-label">{label}</p>
      <p className={`text-lg font-bold font-code mt-1 ${tone}`}>{value}</p>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-3 text-sm">
      <span className="text-noc-muted">{label}</span>
      <span className="text-noc-fg">{value}</span>
    </div>
  )
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export default function InventoryManagementPage({ onLog }) {
  const [models, setModels] = useState(INITIAL_MODELS)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(INITIAL_MODELS[0].id)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return models
    return models.filter((m) =>
      `${m.model} ${m.category} ${m.vendor} ${m.lifecycle} ${m.firmware}`.toLowerCase().includes(q),
    )
  }, [models, query])

  const selectedModel = filteredModels.find((m) => m.id === selectedId) || filteredModels[0] || null

  const overview = useMemo(
    () =>
      models.reduce(
        (acc, model) => ({
          total: acc.total + model.total,
          stock: acc.stock + model.stock,
          deployed: acc.deployed + model.deployed,
          online: acc.online + model.online,
          idle: acc.idle + model.idle,
          faulty: acc.faulty + model.faulty,
          rma: acc.rma + model.rma,
        }),
        { total: 0, stock: 0, deployed: 0, online: 0, idle: 0, faulty: 0, rma: 0 },
      ),
    [models],
  )

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleNewModelImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateForm('image', String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  function handleSelectedModelImage(event) {
    const file = event.target.files?.[0]
    if (!file || !selectedModel) return
    const reader = new FileReader()
    reader.onload = () => {
      const image = String(reader.result || '')
      setModels((current) =>
        current.map((m) => (m.id === selectedModel.id ? { ...m, image } : m)),
      )
      onLog?.('INVENTORY_MODEL_IMAGE_UPDATED', { model: selectedModel.model })
    }
    reader.readAsDataURL(file)
  }

  function createModel(event) {
    event.preventDefault()
    const name = form.model.trim()
    const vendor = form.vendor.trim()
    if (!name || !vendor) return

    const stock = toNumber(form.stock)
    const deployed = toNumber(form.deployed)
    const online = toNumber(form.online)
    const idle = toNumber(form.idle)
    const faulty = toNumber(form.faulty)
    const rma = toNumber(form.rma)

    const newModel = {
      id: `mdl-${Date.now()}`,
      model: name,
      category: form.category,
      vendor,
      lifecycle: form.lifecycle,
      firmware: form.firmware.trim() || 'N/A',
      total: stock + deployed,
      stock,
      deployed,
      online,
      idle,
      faulty,
      rma,
      image: form.image || '/model-gateway.svg',
      specs: {
        cpu: 'Not set',
        memory: 'Not set',
        flash: 'Not set',
        radio: 'Not set',
        wan: 'Not set',
        lan: 'Not set',
        features: 'Not set',
      },
      config: {
        profile: 'Not set',
        compatibility: 'Not set',
        policy: 'Not set',
      },
    }

    setModels((current) => [newModel, ...current])
    setSelectedId(newModel.id)
    setShowCreate(false)
    setForm(EMPTY_FORM)
    onLog?.('INVENTORY_MODEL_CREATED', { model: newModel.model })
  }

  return (
    <div className="dashboard-tech-bg flex-1 overflow-y-auto scrollbar-dark bg-noc-bg">
      <div className="dashboard-search-band px-6 py-4 border-b border-noc-border">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-[14px] font-extrabold tracking-[0.08em] uppercase text-noc-label">Inventory Management</h2>
            <p className="text-noc-muted/90 text-sm mt-1">Overview metrics, concise searchable model list, and real model image upload.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-noc-border bg-noc-surface text-xs font-bold text-noc-fg hover:border-noc-info/50 cursor-pointer">
              <Import size={13} />
              Import
            </button>
            <button type="button" className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-noc-border bg-noc-surface text-xs font-bold text-noc-fg hover:border-noc-info/50 cursor-pointer">
              <Download size={13} />
              Export
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-noc-info text-white text-xs font-bold hover:bg-noc-info/90 cursor-pointer"
            >
              <Plus size={13} />
              Add Model
            </button>
          </div>
        </div>
      </div>

      <section className="dashboard-ops-band dashboard-ops-band-last space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <StatCard label="Total Units" value={overview.total} />
          <StatCard label="In Stock" value={overview.stock} tone="text-noc-info" />
          <StatCard label="Deployed" value={overview.deployed} tone="text-noc-accent" />
          <StatCard label="Online" value={overview.online} tone="text-noc-accent" />
          <StatCard label="Idle" value={overview.idle} tone="text-noc-warning" />
          <StatCard label="Faulty" value={overview.faulty} tone="text-noc-danger" />
          <StatCard label="RMA" value={overview.rma} tone="text-noc-danger" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-4">
          <section className="rounded-xl border border-noc-border bg-noc-surface overflow-hidden">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-4 py-3 border-b border-noc-border">
              <div className="flex items-center gap-2 h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-2 lg:w-[360px] focus-within:border-noc-info">
                <Search size={14} className="text-noc-muted shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search model, vendor, firmware…"
                  className="flex-1 min-w-0 bg-transparent text-sm text-noc-fg placeholder:text-noc-muted/60 focus:outline-none"
                />
              </div>
              <p className="text-xs text-noc-muted">
                Showing <span className="font-code text-noc-fg">{filteredModels.length}</span> models
              </p>
            </div>

            <div className="overflow-auto max-h-[620px]">
              <table className="w-full min-w-[780px] text-left">
                <thead className="bg-noc-raised/40 border-b border-noc-border">
                  <tr>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Model</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Category</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Vendor</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Stock</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Deployed</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Idle</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Lifecycle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((model) => (
                    <tr
                      key={model.id}
                      onClick={() => setSelectedId(model.id)}
                      className={`border-b border-noc-border/60 cursor-pointer ${selectedModel?.id === model.id ? 'bg-noc-info/10' : 'hover:bg-noc-raised/25'}`}
                    >
                      <td className="px-4 py-2.5 text-sm text-noc-fg font-semibold">{model.model}</td>
                      <td className="px-4 py-2.5 text-sm text-noc-muted">{model.category}</td>
                      <td className="px-4 py-2.5 text-sm text-noc-muted">{model.vendor}</td>
                      <td className="px-4 py-2.5 text-sm text-noc-info font-code">{model.stock}</td>
                      <td className="px-4 py-2.5 text-sm text-noc-accent font-code">{model.deployed}</td>
                      <td className="px-4 py-2.5 text-sm text-noc-warning font-code">{model.idle}</td>
                      <td className="px-4 py-2.5 text-sm text-noc-fg">{model.lifecycle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredModels.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-noc-fg font-semibold">No models found</p>
                  <p className="text-noc-muted text-sm mt-1">Try a different search keyword.</p>
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-xl border border-noc-border bg-noc-surface p-4">
            {!selectedModel ? (
              <p className="text-sm text-noc-muted">Select a model to see details.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 items-start">
                  <div className="h-24 w-24 rounded-xl border border-noc-border bg-noc-raised/30 flex items-center justify-center overflow-hidden">
                    <img src={selectedModel.image} alt={`${selectedModel.model} picture`} className="h-20 w-20 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-noc-fg">{selectedModel.model}</h3>
                    <p className="text-xs text-noc-muted mt-0.5">{selectedModel.category} · {selectedModel.vendor}</p>
                    <label className="inline-flex items-center gap-1.5 h-8 px-2 rounded-md border border-noc-border text-xs font-bold text-noc-fg hover:border-noc-info/60 cursor-pointer mt-2">
                      <Upload size={12} />
                      Upload picture
                      <input type="file" accept="image/*" onChange={handleSelectedModelImage} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-noc-border bg-noc-raised/15 p-3 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Model spec</p>
                  <InfoRow label="CPU" value={selectedModel.specs.cpu} />
                  <InfoRow label="Memory" value={selectedModel.specs.memory} />
                  <InfoRow label="Flash" value={selectedModel.specs.flash} />
                  <InfoRow label="Radio" value={selectedModel.specs.radio} />
                  <InfoRow label="WAN" value={selectedModel.specs.wan} />
                  <InfoRow label="LAN" value={selectedModel.specs.lan} />
                  <InfoRow label="Features" value={selectedModel.specs.features} />
                </div>

                <div className="rounded-lg border border-noc-border bg-noc-raised/15 p-3 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Configuration policy</p>
                  <InfoRow label="Firmware" value={selectedModel.firmware} />
                  <InfoRow label="Provision profile" value={selectedModel.config.profile} />
                  <InfoRow label="Compatibility" value={selectedModel.config.compatibility} />
                  <InfoRow label="Policy" value={selectedModel.config.policy} />
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl border border-noc-border bg-noc-surface">
            <div className="flex items-center justify-between px-4 py-3 border-b border-noc-border">
              <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-noc-label">Create model</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="h-8 w-8 inline-flex items-center justify-center rounded-md text-noc-muted hover:text-noc-fg cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={createModel} className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={form.model} onChange={(e) => updateForm('model', e.target.value)} placeholder="Model number" className="h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info" />
                <input value={form.vendor} onChange={(e) => updateForm('vendor', e.target.value)} placeholder="Vendor" className="h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info" />
                <select value={form.category} onChange={(e) => updateForm('category', e.target.value)} className="h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info">
                  <option>Gateway</option>
                  <option>Extender</option>
                  <option>Mesh</option>
                  <option>ONT</option>
                </select>
                <input value={form.firmware} onChange={(e) => updateForm('firmware', e.target.value)} placeholder="Firmware (e.g. 5.4.3)" className="h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info" />
                <input value={form.stock} onChange={(e) => updateForm('stock', e.target.value)} placeholder="In stock" className="h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info" />
                <input value={form.deployed} onChange={(e) => updateForm('deployed', e.target.value)} placeholder="Deployed" className="h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info" />
                <input value={form.online} onChange={(e) => updateForm('online', e.target.value)} placeholder="Online" className="h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info" />
                <input value={form.idle} onChange={(e) => updateForm('idle', e.target.value)} placeholder="Idle" className="h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info" />
                <input value={form.faulty} onChange={(e) => updateForm('faulty', e.target.value)} placeholder="Faulty" className="h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info" />
                <input value={form.rma} onChange={(e) => updateForm('rma', e.target.value)} placeholder="RMA" className="h-9 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg focus:outline-none focus:border-noc-info" />
              </div>
              <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-noc-border text-xs font-bold text-noc-fg hover:border-noc-info/60 cursor-pointer">
                <Upload size={12} />
                Upload real model picture
                <input type="file" accept="image/*" onChange={handleNewModelImage} className="hidden" />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="h-9 px-3 rounded-lg border border-noc-border text-xs font-bold text-noc-fg hover:border-noc-info/50 cursor-pointer">Cancel</button>
                <button type="submit" className="h-9 px-3 rounded-lg bg-noc-info text-white text-xs font-bold hover:bg-noc-info/90 cursor-pointer">Create model</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
