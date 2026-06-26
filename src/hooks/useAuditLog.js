import { useState, useCallback } from 'react'

const OPERATOR = { id: 'SH', name: 'Sam Huang', role: 'SYSTEM_ADMIN', org: 'Microsoft' }

export function useAuditLog() {
  const [entries, setEntries] = useState([])

  const log = useCallback((action, details = {}) => {
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      operatorId: OPERATOR.id,
      operatorName: OPERATOR.name,
      action,
      ...details,
    }
    setEntries((prev) => [entry, ...prev].slice(0, 200)) // keep last 200
    return entry
  }, [])

  return { log, entries, operator: OPERATOR }
}
