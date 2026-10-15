const endpoint = import.meta.env.VITE_GOOGLE_SCRIPT_URL || ''
export const isConnected = Boolean(endpoint && endpoint.includes('/exec'))
export async function apiGet(action, params = {}) {
  if (!isConnected)
    throw new Error(
      'Google Apps Script URL is not configured. Using local preview mode.',
    )
  const url = new URL(endpoint)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) =>
    url.searchParams.set(k, typeof v === 'string' ? v : JSON.stringify(v)),
  )
  const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const data = await res.json()
  if (data.success === false) throw new Error(data.error || 'Request failed')
  return data
}
export async function apiPost(action, payload = {}) {
  if (!isConnected)
    throw new Error(
      'Google Apps Script URL is not configured. Using local preview mode.',
    )
  const res = await fetch(endpoint, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const data = await res.json()
  if (data.success === false) throw new Error(data.error || 'Request failed')
  return data
}
