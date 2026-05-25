const clients = new Set()

export function subscribe(res) {
  clients.add(res)
  return () => clients.delete(res)
}

export function broadcast(type, data = {}) {
  if (clients.size === 0) return
  const payload = JSON.stringify({ type, ...data, ts: Date.now() })
  for (const res of clients) {
    try { res.write(`data: ${payload}\n\n`) }
    catch { clients.delete(res) }
  }
}
