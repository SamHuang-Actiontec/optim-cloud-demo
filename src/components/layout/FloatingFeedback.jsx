import { useState, useRef, useCallback, useEffect } from 'react'
import { MessageSquarePlus, X, CheckCircle2, Trash2, GripVertical, MessageSquare } from 'lucide-react'

function DraggablePin({ pin, onMove, onResolve, onRemove }) {
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
    const onMouseUp = () => {
      setDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [pin, onMove])

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
            {pin.resolved && <span className="fb-pin-resolved-label">Resolved</span>}
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

export default function FloatingFeedback() {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [comment, setComment] = useState('')
  const [pins, setPins] = useState([])

  function save() {
    const text = comment.trim()
    if (!text) return
    setPins(prev => [...prev, {
      id: Date.now(),
      from: from.trim() || 'Viewer',
      comment: text,
      resolved: false,
      x: Math.max(80, window.innerWidth / 2 - 100),
      y: 120 + (prev.length % 6) * 70,
    }])
    setFrom('')
    setComment('')
    setOpen(false)
  }

  const movePin = useCallback((id, x, y) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, x, y } : p))
  }, [])

  const resolvePin = useCallback((id) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, resolved: true } : p))
  }, [])

  const removePin = useCallback((id) => {
    setPins(prev => prev.filter(p => p.id !== id))
  }, [])

  return (
    <>
      {pins.map(pin => (
        <DraggablePin
          key={pin.id}
          pin={pin}
          onMove={movePin}
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

      <button
        className={`fb-fab${open ? ' is-active' : ''}`}
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close' : 'Leave feedback'}
      >
        {open ? <X size={18} /> : <MessageSquarePlus size={18} />}
      </button>
    </>
  )
}
