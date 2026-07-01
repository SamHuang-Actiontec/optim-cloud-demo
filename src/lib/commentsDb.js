// Comments persistence layer.
// Localhost: uses localStorage (no setup needed).
// Production: set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY env vars to switch to Supabase.
//
// Supabase table SQL (run once in Supabase SQL Editor):
//
//   create table feedback_comments (
//     id text primary key,
//     from_name text not null default 'Viewer',
//     comment text not null,
//     status text not null default 'pending'
//       check (status in ('pending', 'resolved', 'deleted')),
//     x_pos float not null default 0,
//     y_pos float not null default 0,
//     page_url text,
//     created_at timestamptz default now()
//   );
//   alter table feedback_comments enable row level security;
//   create policy "anon all" on feedback_comments for all to anon
//     using (true) with check (true);

const STORAGE_KEY = 'optim_feedback_comments'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

// ── localStorage helpers ────────────────────────────────────────────────────
function lsLoad() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function lsSave(pins) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pins))
}

// ── Supabase REST helpers ───────────────────────────────────────────────────
async function sbFetch(method, qs = '', body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback_comments${qs}`, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(method === 'POST' ? { 'Prefer': 'return=representation' } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  })
  if (!res.ok) throw new Error(`Supabase ${method} failed: ${res.status}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

function rowToPin(r) {
  return {
    id: r.id,
    from: r.from_name,
    comment: r.comment,
    status: r.status,
    resolved: r.status === 'resolved',
    x: r.x_pos,
    y: r.y_pos,
    page: r.page_url || null,
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function loadComments() {
  if (USE_SUPABASE) {
    const rows = await sbFetch('GET', '?status=neq.deleted&order=created_at.desc')
    return (rows || []).map(rowToPin)
  }
  return lsLoad().filter(p => p.status !== 'deleted')
}

export async function saveComment(pin) {
  if (USE_SUPABASE) {
    const rows = await sbFetch('POST', '', {
      id: pin.id,
      from_name: pin.from,
      comment: pin.comment,
      status: 'pending',
      x_pos: pin.x,
      y_pos: pin.y,
      page_url: pin.page || 'app',
    })
    return rowToPin(rows[0])
  }
  const all = lsLoad()
  all.push({ ...pin, status: 'pending', resolved: false, page: pin.page || 'app' })
  lsSave(all)
  return pin
}

export async function updateCommentStatus(id, status) {
  if (USE_SUPABASE) {
    await sbFetch('PATCH', `?id=eq.${id}`, { status })
    return
  }
  const all = lsLoad()
  const idx = all.findIndex(p => p.id === id)
  if (idx !== -1) { all[idx] = { ...all[idx], status, resolved: status === 'resolved' }; lsSave(all) }
}

export async function updateCommentPosition(id, x, y) {
  if (USE_SUPABASE) {
    await sbFetch('PATCH', `?id=eq.${id}`, { x_pos: x, y_pos: y })
    return
  }
  const all = lsLoad()
  const idx = all.findIndex(p => p.id === id)
  if (idx !== -1) { all[idx] = { ...all[idx], x, y }; lsSave(all) }
}

export async function softDeleteComment(id) {
  return updateCommentStatus(id, 'deleted')
}
