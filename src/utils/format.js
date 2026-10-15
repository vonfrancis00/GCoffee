export const money = (n) =>
  new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 }).format(
    Number(n) || 0,
  )
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
export const businessDateText = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? value
    : value && !Number.isNaN(new Date(value).getTime())
      ? new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(value))
      : String(value || 'N/A')
export const parseSaved = (value, fallback) => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : (value ?? fallback)
  } catch {
    return fallback
  }
}
export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-neutral-600 focus:ring-4 focus:ring-neutral-50'
