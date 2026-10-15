import React from 'react'
import { Settings, AlertTriangle, RefreshCw } from 'lucide-react'
import { isConnected } from '../api'
import Button from '../components/Button'
import Card from '../components/Card'
import Tag from '../components/Tag'
import PageHeading from '../components/PageHeading'
import { useApp } from '../context/AppContext'

export default function SettingsPage() {
  const { inventory, refreshData } = useApp()
  return (
    <>
      <PageHeading
        eyebrow="Configuration"
        title="Settings"
        desc="Connection status and operating guidance for the Google Sheets backend."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-neutral-50 p-3 text-neutral-700">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="font-bold">Backend connection</h2>
              <p className="text-xs text-slate-500">
                Google Apps Script web app
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">Connection mode</span>
              <Tag color={isConnected ? 'green' : 'amber'}>
                {isConnected ? 'Configured' : 'Local preview'}
              </Tag>
            </div>
            <p className="mt-3 break-all text-xs leading-5 text-slate-500">
              {isConnected
                ? 'Apps Script URL is configured in VITE_GOOGLE_SCRIPT_URL.'
                : 'No Apps Script URL detected. Create a .env file from .env.example and add your deployed /exec URL.'}
            </p>
          </div>
          <Button className="mt-4" variant="secondary" onClick={refreshData}>
            <RefreshCw size={15} /> Test / refresh data
          </Button>
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="font-bold">Data integrity notes</h2>
              <p className="text-xs text-slate-500">
                Read before production use
              </p>
            </div>
          </div>
          <ul className="space-y-3 text-sm leading-6 text-slate-600">
            <li>
              • Use Apps Script server-side permission checks; hiding admin
              buttons in React is not authorization.
            </li>
            <li>
              • Finalization must recalculate recipes and stock on the server,
              enforce idempotency, and record transaction snapshots.
            </li>
            <li>
              • Current Stock in Google Sheets holds live inventory balances.
            </li>
            <li>
              • Reversals must restore original snapshots once and preserve the
              audit trail.
            </li>
            <li>
              • Review recipe quantities in Google Sheets before finalization.
            </li>
          </ul>
        </Card>
      </div>
    </>
  )
}
