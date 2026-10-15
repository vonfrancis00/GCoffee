import React, { useState } from 'react'
import { Save } from 'lucide-react'
import { apiPost, isConnected } from '../api'
import { inputClass } from '../utils/format'
import Button from '../components/Button'
import Field from '../components/Field'
import { useApp } from '../context/AppContext'

export default function EditMaterialForm() {
  const {
    inventory,
    setInventory,
    setNotice,
    category,
    selectedId,
    setModal,
    refreshData,
  } = useApp()
  const m = inventory.find((x) => x.id === selectedId)
  const [form, setForm] = useState(m || {})
  if (!m) return <p>Material not found.</p>
  async function submit() {
    const payload = {
      ...form,
      stock: Number(form.stock),
      minimum: Number(form.minimum),
      unitCost: Number(form.unitCost),
    }
    if (payload.stock < 0 || payload.minimum < 0 || payload.unitCost < 0) {
      setNotice({ type: 'error', text: 'Values must be zero or greater.' })
      return
    }
    if (isConnected) {
      try {
        await apiPost('saveInventoryMaterial', payload)
        await refreshData()
      } catch (e) {
        setNotice({ type: 'error', text: e.message })
        return
      }
    }
    setInventory((old) => old.map((x) => (x.id === m.id ? payload : x)))
    setNotice({
      type: 'success',
      text: isConnected
        ? 'Material updated.'
        : 'Material updated in local preview only.',
    })
    setModal(null)
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Material name">
        <input
          className={inputClass}
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label="Category">
        <input
          className={inputClass}
          value={form.category || ''}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
      </Field>
      <Field label={`Current stock (${m.unit})`}>
        <input
          type="number"
          min="0"
          className={inputClass}
          value={form.stock ?? 0}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
      </Field>
      <Field label={`Minimum stock (${m.unit})`}>
        <input
          type="number"
          min="0"
          className={inputClass}
          value={form.minimum ?? 0}
          onChange={(e) => setForm({ ...form, minimum: e.target.value })}
        />
      </Field>
      <Field label="Unit cost (optional ₱)">
        <input
          type="number"
          min="0"
          step="any"
          className={inputClass}
          value={form.unitCost ?? 0}
          onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
        />
      </Field>
      <Field label="Status">
        <select
          className={inputClass}
          value={form.status || 'Active'}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Button onClick={submit}>
          <Save size={15} /> Save material
        </Button>
      </div>
    </div>
  )
}
