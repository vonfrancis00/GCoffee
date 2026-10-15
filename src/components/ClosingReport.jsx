import React from 'react'
import { Coffee } from 'lucide-react'
import { money, businessDateText, parseSaved } from '../utils/format'
import Button from '../components/Button'
import Tag from '../components/Tag'
import StatusTag from '../components/StatusTag'
import TransactionTable from '../components/TransactionTable'
import { useApp } from '../context/AppContext'

export default function ClosingReport() {
  const {
    inventory,
    loading,
    businessDate,
    sales,
    selectedClosing,
    viewClosing,
  } = useApp()

  const report = selectedClosing
  if (!report || report.loading)
    return (
      <p role="status" className="py-10 text-center text-slate-500">
        Loading closing report?
      </p>
    )
  if (report.error)
    return (
      <div
        role="alert"
        className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
      >
        <p>{report.error}</p>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => viewClosing(report.record)}
        >
          Retry
        </Button>
      </div>
    )
  const { record, items, movements } = report
  const stamp = (v) =>
    v ? new Date(v).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : 'N/A'
  return (
    <article className="closing-report space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-coffee-600">
          G Coffee &middot; Daily sales report
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold">
            {businessDateText(record.BusinessDate || record.businessDate)}
          </h3>
          <StatusTag status={record.Status || record.status} />
        </div>
        <p className="mt-2 break-all text-xs text-slate-500">
          Reference: {record.id || record.DailySalesID}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Units sold</p>
          <strong className="text-2xl">
            {money(record.TotalProductsSold ?? record.totalProductsSold)}
          </strong>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Created - Manila time</p>
          <p className="mt-2 text-xs">
            {stamp(record.CreatedAt || record.createdAt)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Finalized - Manila time</p>
          <p className="mt-2 text-xs">
            {stamp(record.FinalizedAt || record.finalizedAt)}
          </p>
        </div>
      </div>
      <section>
        <h3 className="mb-3 font-bold">Products & variations</h3>
        <div className="space-y-3">
          {items.map((item, index) => {
            const ingredients = parseSaved(
              item.FinalIngredientsJSON || item.finalIngredients,
              [],
            )
            const mods = parseSaved(
              item.CustomizationsJSON || item.customizations,
              {},
            )
            return (
              <div
                key={item.ItemID || index}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {item.ProductName || item.productName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.VariationName || item.variationName || 'Regular'}
                    </p>
                  </div>
                  <Tag>
                    {money(item.QuantitySold ?? item.quantitySold)} units
                  </Tag>
                </div>
                {Array.isArray(ingredients) && ingredients.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-500">
                      Saved ingredients per serving
                    </p>
                    {ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{ing.materialName || ing.materialId}</span>
                        <span>
                          {money(ing.quantity)} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    No ingredient snapshot was saved for this item. See recorded
                    inventory movements below.
                  </p>
                )}
                {mods &&
                  typeof mods === 'object' &&
                  Object.entries(mods)
                    .filter(([, m]) => m && m.mode !== 'Default')
                    .map(([id, m]) => (
                      <p key={id} className="mt-2 text-xs text-slate-500">
                        {inventory.find((x) => String(x.id) === id)?.name || id}
                        : {m.mode}
                        {m.mode === 'Remove' ? '' : ` (${m.value ?? 'N/A'})`}
                      </p>
                    ))}
              </div>
            )
          })}
          {!items.length && (
            <p className="text-sm text-slate-500">
              No saved sales items are available for this record.
            </p>
          )}
        </div>
      </section>
      <section>
        <h3 className="mb-1 font-bold">Recorded inventory movements</h3>
        <p className="mb-3 text-xs text-slate-500">
          Original deductions and corrections linked to this closing.
        </p>
        {movements.length ? (
          <TransactionTable
            rows={movements.map((t) => ({
              ...t,
              businessDate: businessDateText(
                record.BusinessDate || record.businessDate,
              ),
            }))}
          />
        ) : (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            No inventory movements recorded for this closing.
          </p>
        )}
      </section>
      <div className="border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold text-slate-500">Remarks</p>
        <p className="mt-1 text-sm">
          {record.Remarks || record.remarks || 'N/A'}
        </p>
      </div>
    </article>
  )
}
