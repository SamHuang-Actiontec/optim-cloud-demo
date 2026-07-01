import { useState, useEffect, useCallback } from 'react'
import { X, Search, CheckCircle2, Trash2, MessageSquare, Clock, RefreshCw } from 'lucide-react'
import { loadComments, updateCommentStatus, softDeleteComment } from '../../lib/commentsDb'

const STATUS_TABS = ['all', 'pending', 'resolved', 'deleted']

function formatDate(id) {
  const ts = parseInt(id, 10)
  if (!ts || isNaN(ts)) return '—'
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  const map = {
    pending:  { label: 'Pending',  cls: 'cp-badge-pending' },
    resolved: { label: 'Resolved', cls: 'cp-badge-resolved' },
    deleted:  { label: 'Deleted',  cls: 'cp-badge-deleted' },
  }
  const { label, cls } = map[status] || map.pending
  return <span className={`cp-badge ${cls}`}>{label}</span>
}

export default function CommentsPanel({ open, onClose }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('pending')

  const refresh = useCallback(() => {
    setLoading(true)
    loadComments()
      .then(all => setComments(all))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  async function resolve(id) {
    await updateCommentStatus(id, 'resolved').catch(console.error)
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved', resolved: true } : c))
  }

  async function remove(id) {
    await softDeleteComment(id).catch(console.error)
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'deleted' } : c))
  }

  async function restore(id) {
    await updateCommentStatus(id, 'pending').catch(console.error)
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'pending', resolved: false } : c))
  }

  const q = query.toLowerCase()
  const visible = comments.filter(c => {
    const matchTab = tab === 'all' || c.status === tab
    const matchQ = !q || c.from.toLowerCase().includes(q) || c.comment.toLowerCase().includes(q)
    return matchTab && matchQ
  })

  const counts = {
    all: comments.length,
    pending: comments.filter(c => c.status === 'pending').length,
    resolved: comments.filter(c => c.status === 'resolved').length,
    deleted: comments.filter(c => c.status === 'deleted').length,
  }

  if (!open) return null

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cp-header">
          <div className="cp-header-left">
            <MessageSquare size={15} />
            <span>Comments</span>
            <span className="cp-total-count">{comments.length} total</span>
          </div>
          <div className="cp-header-right">
            <button className="cp-refresh-btn" onClick={refresh} title="Refresh">
              <RefreshCw size={13} className={loading ? 'cp-spin' : ''} />
            </button>
            <button className="cp-close-btn" onClick={onClose}><X size={14} /></button>
          </div>
        </div>

        {/* Search */}
        <div className="cp-search-row">
          <Search size={13} className="cp-search-icon" />
          <input
            className="cp-search"
            placeholder="Search by author or keyword…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="cp-search-clear" onClick={() => setQuery('')}><X size={11} /></button>
          )}
        </div>

        {/* Status tabs */}
        <div className="cp-tabs">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              className={`cp-tab${tab === t ? ' is-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="cp-tab-count">{counts[t]}</span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="cp-list">
          {loading && (
            <div className="cp-empty">
              <RefreshCw size={18} className="cp-spin cp-empty-icon" />
              <p>Loading…</p>
            </div>
          )}
          {!loading && visible.length === 0 && (
            <div className="cp-empty">
              <MessageSquare size={22} className="cp-empty-icon" />
              <p>{query ? 'No results for your search.' : `No ${tab === 'all' ? '' : tab} comments.`}</p>
            </div>
          )}
          {!loading && visible.map(c => (
            <div key={c.id} className={`cp-row cp-row-${c.status}`}>
              <div className="cp-row-avatar">{c.from.charAt(0).toUpperCase()}</div>
              <div className="cp-row-body">
                <div className="cp-row-meta">
                  <span className="cp-row-author">{c.from}</span>
                  <StatusBadge status={c.status} />
                  <span className="cp-row-time"><Clock size={10} />{formatDate(c.id)}</span>
                </div>
                <p className="cp-row-text">{c.comment}</p>
              </div>
              <div className="cp-row-actions">
                {c.status === 'pending' && (
                  <button className="cp-action-btn is-resolve" onClick={() => resolve(c.id)} title="Resolve">
                    <CheckCircle2 size={13} />
                  </button>
                )}
                {c.status === 'deleted' && (
                  <button className="cp-action-btn is-restore" onClick={() => restore(c.id)} title="Restore">
                    <RefreshCw size={13} />
                  </button>
                )}
                {c.status !== 'deleted' && (
                  <button className="cp-action-btn is-delete" onClick={() => remove(c.id)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
