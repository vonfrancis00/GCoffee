import React from 'react'
import { Coffee, X, Leaf, Mail } from 'lucide-react'
import { isConnected } from '../api'
import { nav } from '../config/navigation'
import { useApp } from '../context/AppContext'

export default function Sidebar() {
  const {
    page,
    setPage,
    mobileOpen,
    setMobileOpen,
    inventory,
    sales,
    setModal,
  } = useApp()
  return (
    <aside
      className={`app-sidebar ${mobileOpen ? 'fixed inset-0 z-40 flex' : 'hidden'} lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[258px] lg:shrink-0 lg:flex-col lg:border-r lg:border-white/10 lg:bg-coffee-900`}
    >
      <div className="flex h-full w-[270px] flex-col bg-coffee-900 px-4 py-5 text-white lg:w-full">
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="G Coffee logo"
              className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-1"
            />
            <div>
              <p className="text-lg font-extrabold">G Coffee</p>
              <p className="text-xs text-neutral-100/60">
                Operations workspace
              </p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X />
          </button>
        </div>
        {nav.map((group) => (
          <div className="mb-6" key={group.group}>
            <p className="mb-2 px-3 text-[10px] font-bold tracking-[.2em] text-neutral-100/45">
              {group.group}
            </p>
            {group.items.map(([name, Icon]) => (
              <button
                key={name}
                onClick={() => {
                  setPage(name)
                  setMobileOpen(false)
                }}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${page === name ? 'bg-white text-coffee-900 shadow-md' : 'text-neutral-50/75 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon size={18} />
                <span className="flex-1">{name}</span>
                {page === name && (
                  <span className="h-1.5 w-1.5 rounded-full bg-black" />
                )}
              </button>
            ))}
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setModal({ type: 'contact' })
            setMobileOpen(false)
          }}
          className="mb-4 flex items-center gap-2 self-start rounded-lg px-3 py-2 text-xs text-neutral-100/60 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-haspopup="dialog"
        >
          <Mail size={15} />
          Contact Us
        </button>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-white">
            <Leaf size={17} />
            <span className="text-xs font-bold">CLOSE WITH CONFIDENCE</span>
          </div>
          <p className="text-xs leading-5 text-neutral-50/60">
            Record actual daily sales. Review ingredient use before inventory is
            deducted.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-neutral-100/50">
            <span
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-neutral-400' : 'bg-amber-400'}`}
            />
            {isConnected ? 'Google Sheets configured' : 'Local preview mode'}
          </div>
        </div>
      </div>
      {mobileOpen && (
        <button
          className="flex-1 bg-black/50 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </aside>
  )
}
