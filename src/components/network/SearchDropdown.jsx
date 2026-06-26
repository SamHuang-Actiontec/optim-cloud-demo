import { Clock, Search } from 'lucide-react'
import SearchResultRow from './SearchResultRow'

export default function SearchDropdown({
  recentSearches,
  results,
  isSearching,
  query,
  onSelect,
  keyboardIndex,
}) {
  const hasRecent = recentSearches.length > 0
  const hasResults = results.length > 0
  const showEmpty = query.length >= 2 && !isSearching && !hasResults
  const showRecent = hasRecent && query.trim().length < 2

  return (
    <div
      className="absolute left-0 right-0 top-full mt-1 bg-noc-raised border border-noc-border rounded-lg shadow-2xl z-50 overflow-hidden"
      role="listbox"
      aria-label="Search suggestions"
    >
      {/* Loading state */}
      {isSearching && (
        <div className="flex items-center gap-2 px-4 py-3 text-noc-muted text-sm">
          <div className="w-3 h-3 border border-noc-info border-t-transparent rounded-full animate-spin" />
          Searching…
        </div>
      )}

      {/* Recent searches section */}
      {!isSearching && showRecent && (
        <>
          <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1">
            <Clock size={11} className="text-noc-muted" />
            <span className="text-noc-muted text-2xs font-medium uppercase tracking-wider">Recent Searches</span>
          </div>
          {recentSearches.map((customer, i) => (
            <SearchResultRow
              key={`recent-${customer.id}`}
              customer={customer}
              onClick={onSelect}
              isKeyboardSelected={keyboardIndex === i}
            />
          ))}
        </>
      )}

      {/* Search results section */}
      {!isSearching && hasResults && (
        <>
          <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1">
            <Search size={11} className="text-noc-muted" />
            <span className="text-noc-muted text-2xs font-medium uppercase tracking-wider">
              Search Results
            </span>
            <span className="ml-auto text-noc-muted text-2xs font-code">{results.length} found</span>
          </div>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 pb-1">
            <span className="w-2 shrink-0" />
            <span className="text-noc-muted text-2xs w-36 shrink-0">Serial #</span>
            <span className="text-noc-muted text-2xs flex-1">Subscriber</span>
            <span className="text-noc-muted text-2xs w-32 hidden sm:block">Network ID</span>
            <span className="text-noc-muted text-2xs w-20 hidden md:block">Health</span>
            <span className="text-noc-muted text-2xs w-16 text-right hidden lg:block">Last Seen</span>
          </div>

          {results.slice(0, 8).map((customer, i) => (
            <SearchResultRow
              key={`result-${customer.id}`}
              customer={customer}
              onClick={onSelect}
              isKeyboardSelected={keyboardIndex === (showRecent ? recentSearches.length + i : i)}
            />
          ))}

          {results.length > 8 && (
            <div className="px-4 py-2 border-t border-noc-border">
              <span className="text-noc-info text-xs cursor-pointer hover:underline">
                + {results.length - 8} more results — refine your search
              </span>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="px-4 py-6 text-center">
          <p className="text-noc-muted text-sm">No results for <span className="font-code text-noc-fg">"{query}"</span></p>
          <p className="text-noc-muted text-xs mt-1">Try a different serial number, phone, name, or account #</p>
        </div>
      )}
    </div>
  )
}
