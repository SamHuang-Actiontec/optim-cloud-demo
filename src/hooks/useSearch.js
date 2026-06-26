import { useState, useCallback, useRef } from 'react'
import { mockCustomers } from '../data/mockCustomers'

const DEMO_IDS = ['cust-001', 'cust-002', 'cust-011']

function healthStatus(customer) {
  if (customer.healthStatus) return customer.healthStatus
  if (customer.status === 'online') return 'healthy'
  if (customer.status === 'offline') return 'critical'
  return customer.status || 'unknown'
}

function searchCustomers(query) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim().toLowerCase()

  if (['demo', 'demos', 'operator demo', 'health demo'].includes(q)) {
    return DEMO_IDS
      .map((id) => mockCustomers.find((customer) => customer.id === id))
      .filter(Boolean)
  }

  return mockCustomers.filter((c) =>
    c.serial.toLowerCase().includes(q) ||
    (c.subscriber && c.subscriber.toLowerCase().includes(q)) ||
    (c.accountNumber && c.accountNumber.toLowerCase().includes(q)) ||
    (c.phone && c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))) ||
    healthStatus(c).includes(q)
  )
}

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef(null)

  const handleQueryChange = useCallback((value) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value || value.trim().length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceRef.current = setTimeout(() => {
      setResults(searchCustomers(value))
      setIsSearching(false)
    }, 200)
  }, [])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setIsSearching(false)
  }, [])

  return {
    query,
    results,
    isSearching,
    setQuery: handleQueryChange,
    clearSearch,
  }
}
