import { useState } from 'react'
import { Copy, Send, Trash2, X } from 'lucide-react'

const MOCK_DEVICES = {
  'JG1245100025': {
    model: 'AP-AX3000C',
    config: {
      'network.wan.type': 'fiber',
      'network.wan.vlan': '100',
      'network.internet.profile': 'Fiber 1G',
      'wifi.ssid': 'Guest-Network',
      'wifi.password': 'SecurePass123!',
      'wifi.band': '5GHz',
      'services.voip': 'enabled',
      'services.iptv': 'disabled',
      'firewall.enabled': 'true',
      'firewall.level': 'medium',
      'qos.enabled': 'true',
      'qos.priority': 'video',
      'dhcp.enabled': 'true',
      'dhcp.range': '192.168.1.100-192.168.1.200',
    },
  },
  'JG1250100088': {
    model: 'WF-709F',
    config: {
      'mesh.backhaul': 'enabled',
      'mesh.channel': '149',
      'mesh.tx_power': '30',
      'wifi.band': '2.4GHz',
      'wifi.channel': '6',
      'network.gateway_ip': '192.168.1.1',
      'update.firmware': '5.4.1',
      'update.auto_check': 'enabled',
    },
  },
  'JG1250200086': {
    model: 'ONT-BE6500C',
    config: {
      'optical.wavelength': '1490/1310/1550',
      'optical.rx_power': '-20',
      'services.iptv': 'enabled',
      'services.voip': 'enabled',
      'services.internet': 'enabled',
      'network.multicast': 'enabled',
      'qos.enabled': 'true',
      'qos.video_priority': '90',
      'security.snmp': 'disabled',
      'security.ssh': 'enabled',
    },
  },
}

function formatJson(obj) {
  return JSON.stringify(obj, null, 2)
}

function parseJson(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

function RequestResponse({ request, response, onClose }) {
  return (
    <div className="rounded-xl border border-noc-border bg-noc-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-noc-fg">Request / Response</h4>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-noc-muted hover:text-noc-fg cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label mb-2">Request</p>
          <div className="rounded-lg border border-noc-border bg-noc-raised/20 p-2 max-h-40 overflow-auto font-code text-xs text-noc-muted">
            <pre>{formatJson(request)}</pre>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label mb-2">Response (Status: {response.status})</p>
          <div className={`rounded-lg border ${response.status === 'success' ? 'border-noc-accent/30 bg-noc-accent/10' : 'border-noc-danger/30 bg-noc-danger/10'} p-2 max-h-40 overflow-auto font-code text-xs ${response.status === 'success' ? 'text-noc-accent' : 'text-noc-danger'}`}>
            <pre>{formatJson(response.payload)}</pre>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(formatJson(response.payload))}
            className="inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-noc-border text-xs font-bold text-noc-fg hover:border-noc-info/50 cursor-pointer"
          >
            <Copy size={12} />
            Copy response
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DataElementPage({ onLog }) {
  const [serial, setSerial] = useState('JG1245100025')
  const [requestPayload, setRequestPayload] = useState('')
  const [history, setHistory] = useState([])
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)

  const device = MOCK_DEVICES[serial]
  const selectedRequest = selectedHistoryId ? history.find((h) => h.id === selectedHistoryId) : null

  function handleSearch(e) {
    e.preventDefault()
    if (!device) {
      onLog?.('DATA_ELEMENT_SEARCH_FAILED', { serial })
      return
    }
    setRequestPayload('')
    setSelectedHistoryId(null)
    onLog?.('DATA_ELEMENT_DEVICE_FOUND', { serial, model: device.model })
  }

  function sendRequest() {
    if (!device || !requestPayload.trim()) return

    const payload = parseJson(requestPayload)
    if (!payload) {
      alert('Invalid JSON')
      return
    }

    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      message: `Configuration updated for ${device.model}`,
      payload: {
        result: 'Configuration applied successfully',
        device_serial: serial,
        device_model: device.model,
        updated_fields: Object.keys(payload).length,
        appliedAt: new Date().toLocaleTimeString(),
      },
    }

    const request = {
      id: `req-${Date.now()}`,
      timestamp: new Date().toISOString(),
      serial,
      model: device.model,
      request: payload,
      response,
    }

    setHistory((current) => [request, ...current])
    setSelectedHistoryId(request.id)
    setRequestPayload('')
    onLog?.('DATA_ELEMENT_REQUEST_SENT', { serial, fields: Object.keys(payload).length })
  }

  return (
    <div className="dashboard-tech-bg flex-1 overflow-y-auto scrollbar-dark bg-noc-bg">
      <div className="dashboard-search-band px-6 py-4 border-b border-noc-border">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-[14px] font-extrabold tracking-[0.08em] uppercase text-noc-label">Data Element</h2>
            <p className="text-noc-muted/90 text-sm mt-1">Query and update device configuration by serial number. Works like Postman for equipment config.</p>
          </div>
        </div>
      </div>

      <section className="dashboard-ops-band dashboard-ops-band-last space-y-4">
        <form onSubmit={handleSearch} className="rounded-xl border border-noc-border bg-noc-surface overflow-hidden">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center p-4 border-b border-noc-border">
            <input
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              placeholder="Device serial number (e.g., JG1245100025)"
              className="flex-1 h-10 rounded-lg border border-noc-border bg-noc-raised/20 px-3 text-sm text-noc-fg placeholder:text-noc-muted/60 focus:outline-none focus:border-noc-info"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-noc-info text-white text-xs font-bold hover:bg-noc-info/90 cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {!device ? (
          <div className="rounded-xl border border-noc-border bg-noc-surface p-8 text-center">
            <p className="text-noc-fg font-semibold">Device not found</p>
            <p className="text-noc-muted text-sm mt-1">Try: JG1245100025, JG1250100088, or JG1250200086</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
            <section className="rounded-xl border border-noc-border bg-noc-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-noc-border bg-noc-raised/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-noc-fg">{device.model}</p>
                    <p className="text-xs text-noc-muted mt-0.5">Serial: {serial}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestPayload(formatJson(device.config))
                      onLog?.('DATA_ELEMENT_CONFIG_LOADED', { serial })
                    }}
                    className="inline-flex items-center gap-1.5 h-8 px-2 rounded-lg border border-noc-border text-xs font-bold text-noc-fg hover:border-noc-info/50 cursor-pointer"
                  >
                    Load config
                  </button>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">Request Payload (JSON)</p>
                    {requestPayload && (
                      <button
                        type="button"
                        onClick={() => setRequestPayload('')}
                        className="inline-flex items-center gap-1 h-6 px-1.5 rounded-md text-[10px] font-bold text-noc-muted hover:text-noc-fg cursor-pointer"
                      >
                        <Trash2 size={11} />
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    value={requestPayload}
                    onChange={(e) => setRequestPayload(e.target.value)}
                    placeholder={'{\n  "wifi.ssid": "New-SSID",\n  "wifi.password": "NewPass123"\n}'}
                    className="w-full h-80 rounded-lg border border-noc-border bg-noc-raised/20 p-3 font-code text-sm text-noc-fg placeholder:text-noc-muted/60 focus:outline-none focus:border-noc-info"
                  />
                </div>

                <button
                  type="button"
                  onClick={sendRequest}
                  disabled={!requestPayload.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-noc-info text-white text-xs font-bold hover:bg-noc-info/90 disabled:opacity-40 disabled:cursor-default cursor-pointer"
                >
                  <Send size={13} />
                  Send to device
                </button>
              </div>
            </section>

            <aside className="rounded-xl border border-noc-border bg-noc-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-noc-border">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-noc-label">History</p>
              </div>

              <div className="max-h-[600px] overflow-auto">
                {history.length === 0 ? (
                  <div className="p-3 text-center">
                    <p className="text-xs text-noc-muted">No requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedHistoryId(item.id)}
                        className={`w-full text-left px-3 py-2.5 border-b border-noc-border/60 text-xs hover:bg-noc-raised/20 transition-colors cursor-pointer ${
                          selectedHistoryId === item.id ? 'bg-noc-info/10' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-noc-fg truncate">{item.model}</span>
                          <span className={`h-2 w-2 rounded-full shrink-0 ${item.response.status === 'success' ? 'bg-noc-accent' : 'bg-noc-danger'}`} />
                        </div>
                        <p className="text-noc-muted mt-0.5 truncate">{item.timestamp.split('T')[1].slice(0, 8)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {selectedRequest && (
          <RequestResponse
            request={selectedRequest.request}
            response={selectedRequest.response}
            onClose={() => setSelectedHistoryId(null)}
          />
        )}
      </section>
    </div>
  )
}
