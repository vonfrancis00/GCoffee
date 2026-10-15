import React from 'react'
import { ClipboardList, Boxes, RefreshCw, CalendarDays } from 'lucide-react'
import { money, businessDateText, inputClass } from '../utils/format'
import Button from '../components/Button'
import Card from '../components/Card'
import Field from '../components/Field'
import PageHeading from '../components/PageHeading'
import Stat from '../components/Stat'
import { useApp } from '../context/AppContext'

export default function ReportsPage() {
  const {
    closings,
    transactions,
    loading,
    businessDate,
    sales,
    reportDate,
    setReportDate,
    refreshData,
  } = useApp()

  const usageTypes = ['DAILY_CONSUMPTION', 'ORDER_DEDUCTION', 'ORDER_REVERSAL']
  const relevant = transactions.filter(
    (t) =>
      usageTypes.includes(t.type) &&
      (!reportDate ||
        businessDateText(t.businessDate || t.date) === reportDate),
  )
  const days = new Map()
  relevant.forEach((t) => {
    const date = businessDateText(t.businessDate || t.date)
    if (!days.has(date)) days.set(date, new Map())
    const key = JSON.stringify([
      t.materialID ?? t.materialId ?? t.materialName ?? t.name,
      t.unit || '',
    ])
    const materials = days.get(date)
    if (!materials.has(key))
      materials.set(key, {
        name: t.materialName || t.name || 'Unknown material',
        unit: t.unit || '',
        consumed: 0,
        restored: 0,
        rows: [],
      })
    const material = materials.get(key)
    material.rows.push(t)
    if (t.type === 'ORDER_REVERSAL')
      material.restored += Math.abs(Number(t.quantity) || 0)
    else material.consumed += Math.abs(Number(t.quantity) || 0)
  })
  const distinctMaterials = new Set(
    relevant.map((t) =>
      String(t.materialID ?? t.materialId ?? t.materialName ?? t.name),
    ),
  )
  return (
    <>
      <PageHeading
        eyebrow="Insights"
        title="Daily Consumption Reports"
        desc="Daily ingredient usage from recorded sales, grouped by business date and material."
        actions={
          <>
            <Button variant="secondary" onClick={refreshData}>
              <RefreshCw size={15} /> Refresh
            </Button>
            <Button variant="secondary" onClick={() => setReportDate('')}>
              <CalendarDays size={15} /> All days
            </Button>
          </>
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Finalized closings"
          value={
            closings.filter(
              (c) =>
                (!reportDate ||
                  businessDateText(c.businessDate) === reportDate) &&
                c.status === 'Finalized',
            ).length
          }
          sub="Excludes drafts and reversed closings"
          Icon={ClipboardList}
        />
        <Stat
          label="Materials in report"
          value={distinctMaterials.size}
          sub="Distinct materials with recorded movements"
          Icon={Boxes}
          tone="blue"
        />
        <Stat
          label="Days with activity"
          value={days.size}
          sub={`${relevant.length} consumption and reversal transactions`}
          Icon={CalendarDays}
          tone="amber"
        />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-bold">Daily consumption</h2>
            <p className="mt-1 text-xs text-slate-500">
              Net usage = consumed - restored. Stock receipts and manual
              adjustments are excluded.
            </p>
          </div>
          <Field label="Business date">
            <input
              type="date"
              className={inputClass}
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </Field>
        </div>
        {[...days.entries()]
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([date, materials]) => (
            <section
              key={date}
              className="border-b border-slate-100 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-3 bg-coffee-50 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <CalendarDays size={16} />
                  {date}
                </h3>
                <span className="text-xs text-slate-500">
                  {materials.size} material / unit groups
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="p-4">Material</th>
                      <th className="p-4">Consumed</th>
                      <th className="p-4">Restored</th>
                      <th className="p-4">Net usage</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...materials.entries()]
                      .sort((a, b) => a[1].name.localeCompare(b[1].name))
                      .map(([key, m]) => (
                        <React.Fragment key={key}>
                          <tr className="border-t border-slate-100">
                            <td className="p-4 font-semibold">{m.name}</td>
                            <td className="p-4">
                              {money(m.consumed)} {m.unit}
                            </td>
                            <td className="p-4 text-slate-500">
                              {money(m.restored)} {m.unit}
                            </td>
                            <td className="p-4 font-semibold">
                              {money(m.consumed - m.restored)} {m.unit}
                            </td>
                            <td className="p-4">
                              <details className="consumption-details">
                                <summary className="cursor-pointer whitespace-nowrap text-xs font-semibold text-coffee-700">
                                  See transactions ({m.rows.length})
                                </summary>
                                <div className="mt-3 min-w-[320px] space-y-2">
                                  {m.rows.map((t, i) => (
                                    <div
                                      key={t.id || i}
                                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
                                    >
                                      <p className="font-semibold">
                                        {t.type} &middot; {money(t.quantity)}{' '}
                                        {t.unit}
                                      </p>
                                      <p className="mt-1 text-slate-500">
                                        Stock: {money(t.stockBefore)} &rarr;{' '}
                                        {money(t.stockAfter)}
                                      </p>
                                      <p className="mt-1 text-slate-500">
                                        {t.remarks || 'N/A'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        {!days.size && (
          <div className="p-10 text-center text-sm text-slate-500">
            {loading
              ? 'Loading daily consumption...'
              : 'No recorded consumption for this selection. Choose another date or select All days.'}
          </div>
        )}
      </Card>
    </>
  )
}
