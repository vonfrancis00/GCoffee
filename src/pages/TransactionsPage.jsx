import React from 'react'
import { ChevronDown, RefreshCw, X, Package } from 'lucide-react'
import { inputClass } from '../utils/format'
import Button from '../components/Button'
import Card from '../components/Card'
import Field from '../components/Field'
import PageHeading from '../components/PageHeading'
import TransactionTable from '../components/TransactionTable'
import { useApp } from '../context/AppContext'

export default function TransactionsPage() {
  const {
    inventory,
    transactions,
    category,
    transactionCategory,
    setTransactionCategory,
    refreshData,
  } = useApp()

  const materialKey = (t) => {
    const id = t.materialID ?? t.materialId
    return id != null && String(id) !== ''
      ? `id:${id}`
      : `name:${String(t.materialName || t.name || '')
          .trim()
          .toLowerCase()}`
  }
  const materials = new Map(
    inventory.map((m) => [
      `id:${m.id}`,
      { name: m.name, category: String(m.category || '').trim() || 'Other' },
    ]),
  )
  transactions.forEach((t) => {
    const key = materialKey(t)
    if (!materials.has(key)) {
      const matches = inventory.filter(
        (m) =>
          String(m.name).trim().toLowerCase() ===
          String(t.materialName || t.name || '')
            .trim()
            .toLowerCase(),
      )
      materials.set(key, {
        name:
          t.materialName ||
          t.name ||
          t.materialID ||
          t.materialId ||
          'Unknown material',
        category:
          matches.length === 1
            ? String(matches[0].category || '').trim() || 'Other'
            : 'Other',
      })
    }
  })
  const categories = [
    ...new Set([...materials.values()].map((m) => m.category)),
  ].sort((a, b) => a.localeCompare(b))
  const filtered = transactions.filter(
    (t) =>
      !transactionCategory ||
      materials.get(materialKey(t))?.category === transactionCategory,
  )
  const grouped = new Map()
  filtered.forEach((t) => {
    const key = materialKey(t)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(t)
  })
  return (
    <>
      <PageHeading
        eyebrow="Audit trail"
        title="Inventory Transactions"
        desc="Auditable history of stock receipts, daily consumption, reversals, adjustments and wastage."
        actions={
          <Button variant="secondary" onClick={refreshData}>
            <RefreshCw size={15} /> Refresh
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-bold">Inventory movement ledger</h2>
            <p className="mt-1 text-xs text-slate-500">
              {grouped.size} materials &middot; Showing {filtered.length} of{' '}
              {transactions.length} transactions
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Filter by category">
              <select
                className={`${inputClass} sm:max-w-[320px]`}
                value={transactionCategory}
                onChange={(e) => setTransactionCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {transactionCategory &&
                  !categories.includes(transactionCategory) && (
                    <option value={transactionCategory}>
                      {transactionCategory} (unavailable)
                    </option>
                  )}
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            {transactionCategory && (
              <Button
                variant="secondary"
                onClick={() => setTransactionCategory('')}
              >
                <X size={14} /> Clear filters
              </Button>
            )}
          </div>
        </div>
        <div className="material-ledger">
          {[...grouped.entries()].map(([key, rows]) => {
            const material = materials.get(key)
            return (
              <details key={key} className="material-ledger-group">
                <summary className="material-ledger-summary">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-xl bg-coffee-50 p-2.5 text-coffee-700">
                      <Package size={19} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">
                        {material?.name || 'Unknown material'}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {material?.category || 'Other'}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="text-xs text-slate-500">
                      {rows.length} transaction{rows.length === 1 ? '' : 's'}
                    </span>
                    <span className="ledger-toggle">
                      <span className="ledger-more">See more</span>
                      <span className="ledger-less">See less</span>
                      <ChevronDown size={16} />
                    </span>
                  </div>
                </summary>
                <div className="border-t border-slate-100 bg-slate-50/40">
                  <TransactionTable rows={rows} />
                </div>
              </details>
            )
          })}
          {!grouped.size && (
            <p className="p-10 text-center text-sm text-slate-400">
              No transactions match the current selection.
            </p>
          )}
        </div>
      </Card>
    </>
  )
}
