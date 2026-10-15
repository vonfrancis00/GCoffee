import React from 'react'

export default function Tag({ children, color = 'slate' }) {
  const c = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
    blue: 'bg-blue-50 text-blue-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${c[color] || c.slate}`}
    >
      {children}
    </span>
  )
}
