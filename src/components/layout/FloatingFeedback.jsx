import { useState, useRef, useCallback, useEffect } from 'react'
import { MessageSquarePlus, X, CheckCircle2, Trash2, GripVertical, MessageSquare, LayoutList } from 'lucide-react'
import { loadComments, saveComment, updateCommentStatus, updateCommentPosition, softDeleteComment } from '../../lib/commentsDb'
import CommentsPanel from './CommentsPanel'

function DraggablePin({ pin, onMove, onMoveEnd, onResolve, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const offset = useRef({ x: 0, y: 0 })
  const didDrag = useRef(false)
  const cardRef = useRef(null)

  useEffect(() => {
    if (!expanded) return
    function handleOutside(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) setExpanded(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [expanded])

  const startDrag = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    didDrag.current = false
    offset.current = { x: e.clientX - pin.x, y: e.clientY - pin.y }

    const onMouseMove = (ev) => {
      didDrag.current = true
      onMove(pin.id, ev.clientX - offset.current.x, ev.clientY - offset.current.y)
    }
    const onMouseUp = (ev) => {
      setDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      if (didDrag.current) {
        const nx = ev.clientX - offset.current.x
        const ny = ev.clientY - offset.current.y
        onMoveEnd(pin.id, nx, ny)
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [pin, onMove, onMoveEnd])

  function handleChipClick(e) {
    e.stopPropagation()
    if (didDrag.current) { didDrag.current = false; return }
    setExpanded(o => !o)
  }

  const preview = pin.comment.length > 38 ? pin.comment.slice(0, 38) + '…' : pin.comment

  return (
    <div
      className={`fb-pin${dragging ? ' is-dragging' : ''}${pin.resolved ? ' is-resolved' : ''}`}
      style={{ left: pin.x, top: pin.y }}
      ref={cardRef}
    >
      {/* Draggable chip */}
      <div
        className="fb-pin-chip"
        onMouseDown={startDrag}
        onClick={handleChipClick}
      >
        <span className="fb-pin-chip-grip"><GripVertical size={11} /></span>
        <span className="fb-pin-chip-icon">
          {pin.resolved ? <CheckCircle2 size={13} /> : <MessageSquare size={13} />}
        </span>
        <span className="fb-pin-chip-author">{pin.from}</span>
        <span className="fb-pin-chip-preview">{preview}</span>
        <button
          className="fb-pin-chip-close"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onRemove(pin.id) }}
        >
          <X size={10} />
        </button>
      </div>

      {/* Expanded detail card */}
      {expanded && (
        <div
          className="fb-pin-card"
          style={pin.y < 180 ? { bottom: 'auto', top: 46 } : {}}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="fb-pin-card-header">
            <span className="fb-pin-card-avatar">{pin.from.charAt(0).toUpperCase()}</span>
            <strong>{pin.from}</strong>
            <span className={`fb-pin-status-badge fb-pin-status-${pin.status || 'pending'}`}>
              {pin.status || 'pending'}
            </span>
            <button className="fb-pin-card-close" onClick={() => setExpanded(false)}><X size={12} /></button>
          </div>
          <p>{pin.comment}</p>
          <div className="fb-pin-actions">
            {!pin.resolved && (
              <button
                className="fb-pin-action-btn is-resolve"
                onClick={e => { e.stopPropagation(); onResolve(pin.id) }}
              >
                <CheckCircle2 size={11} /> Resolve
              </button>
            )}
            <button
              className="fb-pin-action-btn is-delete"
              onClick={e => { e.stopPropagation(); onRemove(pin.id); setExpanded(false) }}
            >
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FloatingFeedback({ pageKey = 'app' }) {
  const [open, setOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [comment, setComment] = useState('')
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)

  // Only pins created on this exact page are shown as chips on-screen.
  // Pins without a page field (legacy data) are intentionally hidden everywhere.
  // The admin panel still shows ALL comments regardless of page.
  const visiblePins = pins.filter(p => p.page === pageKey)
  const pendingCount = pins.filter(p => p.status === 'pending' || (!p.status && !p.resolved)).length

  // Load persisted comments on mount
  useEffect(() => {
    loadComments()
      .then(setPins)
      .catch(err => console.error('Failed to load comments:', err))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    const text = comment.trim()
    if (!text) return
    const newPin = {
      id: String(Date.now()),
      from: from.trim() || 'Viewer',
      comment: text,
      status: 'pending',
      resolved: false,
      page: pageKey,
      x: Math.max(80, window.innerWidth / 2 - 100),
      y: 120 + (visiblePins.length % 6) * 70,
    }
    const saved = await saveComment(newPin).catch(() => newPin)
    setPins(prev => [...prev, saved])
    setFrom('')
    setComment('')
    setOpen(false)
  }

  // Update local state immediately on drag; persist only when drag ends
  const movePin = useCallback((id, x, y) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, x, y } : p))
  }, [])

  const movePinEnd = useCallback((id, x, y) => {
    updateCommentPosition(id, x, y).catch(console.error)
  }, [])

  const resolvePin = useCallback((id) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, resolved: true, status: 'resolved' } : p))
    updateCommentStatus(id, 'resolved').catch(console.error)
  }, [])

  const removePin = useCallback((id) => {
    setPins(prev => prev.filter(p => p.id !== id))
    softDeleteComment(id).catch(console.error)
  }, [])

  return (
    <>
      <CommentsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      {!loading && visiblePins.map(pin => (
        <DraggablePin
          key={pin.id}
          pin={pin}
          onMove={movePin}
          onMoveEnd={movePinEnd}
          onResolve={resolvePin}
          onRemove={removePin}
        />
      ))}

      {open && (
        <div className="fb-panel">
          <div className="fb-panel-header">
            <span>Leave a comment</span>
            <button className="fb-panel-close" onClick={() => setOpen(false)}><X size={13} /></button>
          </div>
          <input
            className="fb-field"
            placeholder="Your name"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
          <textarea
            className="fb-field fb-textarea"
            placeholder="Write your comment…"
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save() }}
          />
          <p className="fb-hint">After saving, drag the comment chip to the relevant spot.</p>
          <div className="fb-panel-actions">
            <button className="fb-btn fb-cancel" onClick={() => setOpen(false)}>Cancel</button>
            <button className="fb-btn fb-save" onClick={save} disabled={!comment.trim()}>
              Save &amp; place
            </button>
          </div>
        </div>
      )}

      {/* Comments admin button */}
      <button
        className={`fb-comments-fab${panelOpen ? ' is-active' : ''}`}
        onClick={() => { setPanelOpen(o => !o); setOpen(false) }}
        title="View all comments"
      >
        <LayoutList size={15} />
        {pendingCount > 0 && (
          <span className="fb-comments-fab-badge">{pendingCount}</span>
        )}
      </button>

      {/* New comment FAB */}
      <button
        className={`fb-fab${open ? ' is-active' : ''}`}
        onClick={() => { setOpen(o => !o); setPanelOpen(false) }}
        title={open ? 'Close' : 'Leave feedback'}
      >
        {open ? <X size={18} /> : <MessageSquarePlus size={18} />}
      </button>
    </>
  )
}
