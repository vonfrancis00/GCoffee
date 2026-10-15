import React from 'react'

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}) {
  const styles = {
    primary: 'bg-coffee-800 text-white hover:bg-coffee-900 shadow-sm',
    secondary:
      'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    subtle: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
    success: 'bg-neutral-700 text-white hover:bg-neutral-800',
  }
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
