import React, { useState } from 'react'
import { Trash2, Save } from 'lucide-react'
import { apiPost, isConnected } from '../api'
import { inputClass } from '../utils/format'
import Button from '../components/Button'
import Field from '../components/Field'
import { useApp } from '../context/AppContext'

export default function RecipeForm({ product }) {
  const { inventory, setProducts, setNotice, setModal, refreshData } = useApp()
  const [rows, setRows] = useState(
    (product?.recipe || []).map((x) => ({ ...x })),
  )
  if (!product) return <p>Product not found.</p>
  async function submit() {
    const next = {
      ...product,
      recipe: rows.map((r) => ({ ...r, quantity: Number(r.quantity) })),
    }
    if (
      rows.some(
        (r) => !Number.isFinite(Number(r.quantity)) || Number(r.quantity) < 0,
      )
    ) {
      setNotice({
        type: 'error',
        text: 'Recipe quantities must be valid and nonnegative.',
      })
      return
    }
    if (isConnected) {
      try {
        await apiPost('saveRecipe', {
          productId: product.id,
          recipe: next.recipe,
        })
        await refreshData()
      } catch (e) {
        setNotice({ type: 'error', text: e.message })
        return
      }
    }
    setProducts((old) => old.map((p) => (p.id === product.id ? next : p)))
    setNotice({
      type: 'success',
      text: isConnected
        ? 'Recipe saved.'
        : 'Recipe updated in local preview only.',
    })
    setModal(null)
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Edit per-serving quantities. Ingredient IDs and units are fixed here to
        avoid accidental unit mismatches.
      </p>
      {rows.map((r, i) => (
        <div
          key={r.materialId}
          className="grid grid-cols-[minmax(0,1fr)_100px_40px] items-center gap-2"
        >
          <p className="text-sm font-semibold">
            {r.materialName}
            <span className="ml-2 text-xs font-normal text-slate-400">
              {r.unit}
            </span>
          </p>
          <input
            type="number"
            min="0"
            step="any"
            className={inputClass}
            value={r.quantity}
            onChange={(e) =>
              setRows((old) =>
                old.map((x, j) =>
                  j === i ? { ...x, quantity: e.target.value } : x,
                ),
              )
            }
          />
          <button
            onClick={() => setRows((old) => old.filter((x, j) => j !== i))}
            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <Field label="Add ingredient">
        <select
          className={inputClass}
          value=""
          onChange={(e) => {
            const m = inventory.find((x) => x.id === e.target.value)
            if (m && !rows.some((r) => r.materialId === m.id))
              setRows((old) => [
                ...old,
                {
                  materialId: m.id,
                  materialName: m.name,
                  quantity: 0,
                  unit: m.unit,
                },
              ])
          }}
        >
          <option value="">Choose material…</option>
          {inventory.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.unit})
            </option>
          ))}
        </select>
      </Field>
      <Button onClick={submit}>
        <Save size={15} /> Save recipe
      </Button>
    </div>
  )
}
