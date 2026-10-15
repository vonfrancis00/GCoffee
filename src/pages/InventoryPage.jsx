import React from 'react'
import {
  ChartNoAxesCombined,
  Search,
  Plus,
  Pencil,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { money, inputClass } from '../utils/format'
import Button from '../components/Button'
import Card from '../components/Card'
import Tag from '../components/Tag'
import PageHeading from '../components/PageHeading'
import Stat from '../components/Stat'
import { useApp } from '../context/AppContext'

export default function InventoryPage() {
  const {
    inventory,
    category,
    setSelectedId,
    setModal,
    inventorySearch,
    setInventorySearch,
    setAdjustment,
    lowStock,
    totalStockValue,
  } = useApp()
  const list = inventory.filter((m) =>
    (m.name + ' ' + m.category + ' ' + m.id)
      .toLowerCase()
      .includes(inventorySearch.toLowerCase()),
  )
  return (
    <>
      <PageHeading
        eyebrow="Stock control"
        title="Inventory"
        desc="Maintain raw-material balances, units, minimum thresholds and optional unit costs."
        actions={
          <Button
            onClick={() => {
              setAdjustment({})
              setModal({ type: 'stockIn' })
            }}
          >
            <Plus size={16} /> Record stock in
          </Button>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Material types"
          value={inventory.length}
          sub="Raw materials tracked"
          Icon={Package}
        />
        <Stat
          label="Low stock"
          value={lowStock.length}
          sub="At or below minimum"
          Icon={AlertTriangle}
          tone="amber"
        />
        <Stat
          label="Configured stock value"
          value={
            totalStockValue ? `₱${money(totalStockValue)}` : 'Not configured'
          }
          sub="Only when unit costs are entered"
          Icon={ChartNoAxesCombined}
          tone="blue"
        />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">Raw materials</h2>
            <p className="mt-1 text-xs text-slate-500">
              Edit stock and minimum levels without resetting real inventory.
            </p>
          </div>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className={`${inputClass} pl-9 sm:w-64`}
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              placeholder="Find material..."
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Material</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">On hand</th>
                <th className="px-4 py-3">Minimum</th>
                <th className="px-4 py-3">Unit cost (₱)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr
                  key={m.id}
                  className="border-t border-slate-100 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800">{m.name}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {m.id} · {m.unit}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-slate-500">{m.category}</td>
                  <td
                    className={`px-4 py-4 font-bold ${m.stock <= m.minimum ? 'text-amber-700' : 'text-slate-800'}`}
                  >
                    {money(m.stock)}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      {m.unit}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {money(m.minimum)} {m.unit}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {m.unitCost ? money(m.unitCost) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Tag color={m.stock <= m.minimum ? 'amber' : 'green'}>
                      {m.stock <= m.minimum ? 'Low stock' : 'In stock'}
                    </Tag>
                  </td>
                  <td className="px-4 py-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedId(m.id)
                        setModal({ type: 'editMaterial' })
                      }}
                    >
                      <Pencil size={14} /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
