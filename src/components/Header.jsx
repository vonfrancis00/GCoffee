import React from 'react'
import { Coffee, Bell, RefreshCw, Menu } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Header() {
  const { setPage, setMobileOpen, loading, refreshData, lowStock } = useApp()
  return (
    <header className="app-header sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button
          className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
        <img
          src="/logo.png"
          alt="G Coffee logo"
          className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1"
        />
        <div>
          <div className="font-extrabold tracking-tight text-coffee-900">
            G Coffee
          </div>
          <div className="text-xs text-slate-500">
            Daily Closing & Inventory
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-700">
            Shop Administrator
          </p>
          <p className="text-xs text-slate-400">Inventory operations</p>
        </div>
        <button
          onClick={refreshData}
          aria-label="Refresh data"
          title="Refresh data"
          className={`rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={17} />
        </button>
        <button
          onClick={() => setPage('Inventory')}
          aria-label="View stock alerts"
          className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600"
        >
          <Bell size={17} />
          {lowStock.length > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500" />
          )}
        </button>
        <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-900 sm:flex">
          GA
        </div>
      </div>
    </header>
  )
}
