import React from 'react'
import { Coffee, Settings, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { isConnected } from './api'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import DailySales from './pages/DailySales'
import InventoryPage from './pages/InventoryPage'
import ProductsPage from './pages/ProductsPage'
import ReportsPage from './pages/ReportsPage'
import TransactionsPage from './pages/TransactionsPage'
import SettingsPage from './pages/SettingsPage'
import Modal from './components/Modal'
import { useApp } from './context/AppContext'

import { AppProvider } from './context/AppContext'

function AppLayout() {
  const { page, notice, setNotice, sales, lastRefresh } = useApp()
  const renderPage = () =>
    ({
      Dashboard: <Dashboard />,
      'Daily Sales & Inventory Deduction': <DailySales />,
      Inventory: <InventoryPage />,
      'Products & Recipes': <ProductsPage />,
      'Daily Consumption Reports': <ReportsPage />,
      'Inventory Transactions': <TransactionsPage />,
      Settings: <SettingsPage />,
    })[page] || <Dashboard />
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <div className="connection-bar mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span
                className={`h-2 w-2 rounded-full ${isConnected ? 'bg-neutral-500' : 'bg-amber-500'}`}
              />
              {isConnected
                ? 'Connected configuration · Google Apps Script'
                : 'Preview mode · configure .env to connect Google Sheets'}
            </div>
            <div className="text-slate-400">
              Last refreshed{' '}
              {lastRefresh.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          {renderPage()}
        </main>
        <footer className="mx-auto flex max-w-[1600px] flex-col justify-between gap-2 px-4 pb-6 text-xs text-slate-400 sm:flex-row sm:px-8">
          <span>
            © {new Date().getFullYear()} G Coffee · Daily Closing System
          </span>
          <span>Daily sales records · Recipe-based stock control</span>
        </footer>
      </div>
      {notice && (
        <div
          className={`fixed bottom-4 right-4 z-[70] flex max-w-[min(92vw,480px)] items-start gap-3 rounded-2xl border p-4 shadow-xl ${notice.type === 'error' ? 'border-rose-200 bg-white text-rose-800' : 'border-neutral-200 bg-white text-neutral-800'}`}
        >
          <div className="mt-0.5">
            {notice.type === 'error' ? (
              <AlertTriangle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
          </div>
          <p className="text-sm leading-5">{notice.text}</p>
          <button
            onClick={() => setNotice(null)}
            className="ml-1 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <Modal />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  )
}
