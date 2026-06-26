import { useRef, useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useSearch } from '../../hooks/useSearch'
import SearchDropdown from './SearchDropdown'

export default function SearchPanel({ recentSearches, onSelectCustomer, onLog }) {
  const { query, results, isSearching, setQuery, clearSearch } = useSearch()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [keyboardIndex, setKeyboardIndex] = useState(-1)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setKeyboardIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleFocus() {
    if (recentSearches.length > 0 || query.length >= 2) {
      setDropdownOpen(true)
    }
  }

  function handleQueryChange(value) {
    setQuery(value)
    const normalizedValue = value.trim()
    setDropdownOpen(normalizedValue.length >= 2 || (normalizedValue.length === 0 && recentSearches.length > 0))
    setKeyboardIndex(-1)
  }

  function handleKeyDown(e) {
    const showAutocompleteResults = query.trim().length >= 2
    const allRows = showAutocompleteResults
      ? results
      : [
        ...recentSearches,
        ...results.filter((r) => !recentSearches.find((rc) => rc.id === r.id)),
      ]

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setKeyboardIndex((i) => Math.min(i + 1, allRows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setKeyboardIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && keyboardIndex >= 0 && allRows[keyboardIndex]) {
      e.preventDefault()
      handleSelect(allRows[keyboardIndex])
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
      setKeyboardIndex(-1)
      inputRef.current?.blur()
    }
  }

  function handleSelect(customer) {
    onLog?.('CUSTOMER_SELECTED', { serial: customer.serial, subscriber: customer.subscriber })
    setDropdownOpen(false)
    setKeyboardIndex(-1)
    clearSearch()
    onSelectCustomer(customer)
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-[12px] font-extrabold tracking-[0.08em] uppercase text-noc-label">Customer Lookup</h3>
        <p className="text-noc-muted text-sm mt-1">Search by name, serial number, phone, or account number</p>
      </div>

      <div ref={containerRef} className="relative">
        <label htmlFor="customer-search" className="sr-only">Search customers</label>

        <div className={`
          dashboard-tech-search flex items-center gap-3 bg-noc-surface border rounded-xl px-4 h-11
          transition-all duration-150
          ${dropdownOpen ? 'border-noc-info ring-1 ring-noc-info/30' : 'border-noc-border hover:border-noc-muted'}
        `}>
          {isSearching ? (
            <div className="w-4 h-4 border border-noc-info border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <Search size={16} className="text-noc-muted shrink-0" />
          )}

          <input
            id="customer-search"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, serial, phone, or account…"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-noc-fg placeholder:text-noc-muted/60 focus:outline-none text-sm"
            aria-autocomplete="list"
            aria-expanded={dropdownOpen}
            aria-controls="search-dropdown"
          />

          {query
            ? (
              <button
                onClick={() => { clearSearch(); setDropdownOpen(false); inputRef.current?.focus() }}
                className="text-noc-muted hover:text-noc-fg transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )
            : <span className="text-noc-muted text-xs hidden sm:block shrink-0">Network / Customer Lookup</span>}
        </div>

        {dropdownOpen && (
          <SearchDropdown
            recentSearches={recentSearches}
            results={results}
            isSearching={isSearching}
            query={query}
            onSelect={handleSelect}
            keyboardIndex={keyboardIndex}
          />
        )}
      </div>

      <p className="text-noc-muted text-xs">
        Press <kbd className="font-code bg-noc-raised border border-noc-border px-1 py-0.5 rounded text-2xs">↑ ↓</kbd> to navigate,{' '}
        <kbd className="font-code bg-noc-raised border border-noc-border px-1 py-0.5 rounded text-2xs">Enter</kbd> to select,{' '}
        <kbd className="font-code bg-noc-raised border border-noc-border px-1 py-0.5 rounded text-2xs">Esc</kbd> to close
      </p>
    </div>
  )
}
