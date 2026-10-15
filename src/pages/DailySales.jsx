import React from 'react'
import {
  Coffee,
  Boxes,
  Settings,
  Search,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Utensils,
  History,
  Save,
  SlidersHorizontal,
} from 'lucide-react'
import { isConnected } from '../api'
import { money, today, inputClass } from '../utils/format'
import Button from '../components/Button'
import Card from '../components/Card'
import Tag from '../components/Tag'
import Field from '../components/Field'
import ModifierEditor from '../components/ModifierEditor'
import PageHeading from '../components/PageHeading'
import StatusTag from '../components/StatusTag'
import { useApp } from '../context/AppContext'

export default function DailySales() {
  const {
    inventory,
    products,
    closings,
    loading,
    businessDate,
    setBusinessDate,
    search,
    setSearch,
    category,
    setCategory,
    sales,
    setSales,
    selectedId,
    setSelectedId,
    setModal,
    activeProducts,
    visibleProducts,
    addVariation,
    removeVariation,
    updateVariation,
    setMod,
    saleItems,
    computed,
    saveDraft,
    finalize,
  } = useApp()
  return (
    <>
      <PageHeading
        eyebrow="End-of-day workflow"
        title="Daily Sales & Inventory Deduction"
        desc="Record products sold after service, customize each variation, and inspect the material deduction before finalizing."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              setSales({})
              setBusinessDate(today())
            }}
          >
            New closing
          </Button>
        }
      />
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <Field label="Business date">
            <input
              type="date"
              value={businessDate}
              onChange={(e) => setBusinessDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current entry
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {saleItems.length} variation row(s) · {computed.totalCups} total
              units
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setModal({ type: 'history' })}
            >
              <History size={15} /> Previous closings
            </Button>
            <Button onClick={saveDraft} disabled={!saleItems.length}>
              <Save size={15} /> Save draft
            </Button>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="rounded-xl bg-neutral-50 p-3 text-neutral-700">
            <Boxes size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Estimated materials</p>
            <p className="text-xl font-extrabold text-slate-900">
              {computed.totals.filter((t) => t.required > 0).length}
            </p>
            <p className="text-xs text-slate-400">ingredient types</p>
          </div>
        </Card>
      </div>
      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(400px,.8fr)]">
        <div>
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-bold text-slate-900">Products sold</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Add one or more independent variations per product.
                  </p>
                </div>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className={`${inputClass} pl-9 sm:w-56`}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {['All', ...new Set(activeProducts.map((p) => p.category))].map(
                  (c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition ${category === c ? 'bg-coffee-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {c}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {visibleProducts.map((p) => (
                <div key={p.id} className="p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-xl p-3 ${p.category === 'Coffee' ? 'bg-amber-50 text-amber-800' : 'bg-neutral-50 text-neutral-800'}`}
                      >
                        {p.category === 'Coffee' ? (
                          <Coffee size={19} />
                        ) : (
                          <Utensils size={19} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {p.recipe.length} ingredients · {p.category}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" onClick={() => addVariation(p)}>
                      <Plus size={15} /> Add variation
                    </Button>
                  </div>
                  {(sales[p.id] || []).map((v, idx) => (
                    <div
                      key={v.key}
                      className="mt-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_100px_auto]">
                        <Field label={`Variation ${idx + 1}`}>
                          <input
                            value={v.name}
                            onChange={(e) =>
                              updateVariation(
                                p.id,
                                v.key,
                                'name',
                                e.target.value,
                              )
                            }
                            placeholder="Regular, no sugar, extra milk..."
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Quantity sold">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={v.quantity}
                            onChange={(e) =>
                              updateVariation(
                                p.id,
                                v.key,
                                'quantity',
                                e.target.value,
                              )
                            }
                            className={inputClass}
                          />
                        </Field>
                        <div className="flex items-end gap-1">
                          <Button
                            variant="secondary"
                            className="px-3"
                            onClick={() =>
                              setSelectedId(selectedId === v.key ? null : v.key)
                            }
                          >
                            <SlidersHorizontal size={15} />
                            {selectedId === v.key ? 'Hide' : 'Customize'}
                          </Button>
                          <Button
                            variant="danger"
                            className="px-3"
                            onClick={() => removeVariation(p.id, v.key)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                      {selectedId === v.key && (
                        <ModifierEditor
                          product={p}
                          variation={v}
                          setMod={setMod}
                        />
                      )}
                    </div>
                  ))}
                  {!(sales[p.id] || []).length && (
                    <p className="mt-3 text-xs text-slate-400">
                      No sales variation recorded.
                    </p>
                  )}
                </div>
              ))}
              {!visibleProducts.length && (
                <p className="p-8 text-center text-sm text-slate-400">
                  {loading
                    ? 'Loading products from Google Sheets?'
                    : isConnected
                      ? 'No matching products in Google Sheets.'
                      : 'Connect Google Sheets in Settings to load products.'}
                </p>
              )}
            </div>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div>
                <h2 className="font-bold text-slate-900">Deduction preview</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Aggregated from all variation rows
                </p>
              </div>
              <Tag
                color={
                  computed.totals.some((t) => t.shortage > 0) ? 'red' : 'green'
                }
              >
                {computed.totals.some((t) => t.shortage > 0)
                  ? 'Shortage detected'
                  : 'Stock check'}
              </Tag>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Units
                </p>
                <p className="mt-1 text-xl font-extrabold">
                  {computed.totalCups}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Materials
                </p>
                <p className="mt-1 text-xl font-extrabold">
                  {computed.totals.filter((t) => t.required > 0).length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Shortages
                </p>
                <p
                  className={`mt-1 text-xl font-extrabold ${computed.totals.some((t) => t.shortage > 0) ? 'text-rose-600' : ''}`}
                >
                  {computed.totals.filter((t) => t.shortage > 0).length}
                </p>
              </div>
            </div>
            <div className="max-h-[410px] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-3 py-3 text-right">Use</th>
                    <th className="px-3 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {computed.totals
                    .filter((t) => t.required > 0)
                    .map((t) => (
                      <tr key={t.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-700">
                            {t.name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {t.unit}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">
                          {money(t.required)}
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-bold ${t.shortage > 0 ? 'text-rose-600' : 'text-neutral-700'}`}
                        >
                          {money(t.remaining)}
                          {t.shortage > 0 && (
                            <p className="text-[10px] font-medium">
                              Short {money(t.shortage)}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  {!computed.totals.some((t) => t.required > 0) && (
                    <tr>
                      <td
                        colSpan="3"
                        className="p-8 text-center text-slate-400"
                      >
                        Add sales to calculate ingredient use.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 p-4">
              <div className="mb-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                <p>
                  Recipes and stock are loaded from Google Sheets. Confirm
                  quantities before finalization. Drafts do not deduct
                  inventory.
                </p>
              </div>
              <Button
                variant="secondary"
                className="mb-2 w-full"
                onClick={() => setModal({ type: 'preview' })}
              >
                <Eye size={16} /> Review all variations
              </Button>
              <Button
                variant="success"
                className="w-full"
                onClick={finalize}
                disabled={
                  !saleItems.length ||
                  computed.totals.some((t) => t.shortage > 0)
                }
              >
                <CheckCircle2 size={16} /> Finalize & deduct inventory
              </Button>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="mb-3 font-bold text-slate-900">
              Previous closing records
            </h3>
            {closings.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 border-t border-slate-100 py-3 first:border-0"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {c.businessDate}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {c.totalProductsSold || 0} units · {c.id}
                  </p>
                </div>
                <StatusTag status={c.status} />
              </div>
            ))}
            <button
              onClick={() => setModal({ type: 'history' })}
              className="mt-2 text-xs font-bold text-coffee-700 hover:underline"
            >
              View all closing records →
            </button>
          </Card>
        </div>
      </div>
    </>
  )
}
