import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { apiPost, isConnected } from '../api'
import { today, inputClass } from '../utils/format'
import Button from '../components/Button'
import Field from '../components/Field'
import { useApp } from '../context/AppContext'

export default function StockInForm() {
  const {
    inventory,
    setInventory,
    setTransactions,
    setNotice,
    businessDate,
    setModal,
    refreshData,
  } = useApp()
  const [id, setId] = useState(inventory[0]?.id || ''),
    [qty, setQty] = useState(''),
    [remarks, setRemarks] = useState('Stock receipt')
  const material = inventory.find((m) => m.id === id)
  async function submit() {
    const amount = Number(qty)
    if (!material || !Number.isFinite(amount) || amount <= 0) {
      setNotice({
        type: 'error',
        text: 'Enter a valid positive stock quantity.',
      })
      return
    }
    if (isConnected) {
      try {
        await apiPost('addInventoryStock', {
          materialId: id,
          quantity: amount,
          remarks,
        })
        await refreshData()
      } catch (e) {
        setNotice({ type: 'error', text: e.message })
        return
      }
    } else
      setInventory((old) =>
        old.map((m) => (m.id === id ? { ...m, stock: m.stock + amount } : m)),
      )
    setTransactions((old) => [
      {
        id: 'LOCAL-' + Date.now(),
        date: new Date().toISOString(),
        businessDate: today(),
        materialId: id,
        materialName: material.name,
        type: 'STOCK_IN',
        quantity: amount,
        unit: material.unit,
        stockBefore: material.stock,
        stockAfter: material.stock + amount,
        remarks,
      },
      ...old,
    ])
    setNotice({
      type: 'success',
      text: isConnected
        ? 'Stock receipt recorded.'
        : 'Stock updated in local preview only.',
    })
    setModal(null)
  }
  return (
    <div className="space-y-4">
      <Field label="Raw material">
        <select
          className={inputClass}
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          {inventory.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.stock} {m.unit})
            </option>
          ))}
        </select>
      </Field>
      <Field label={`Quantity received (${material?.unit || ''})`}>
        <input
          type="number"
          min="0.001"
          step="any"
          className={inputClass}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Enter received quantity"
        />
      </Field>
      <Field label="Remarks">
        <input
          className={inputClass}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </Field>
      <Button onClick={submit}>
        <Plus size={15} /> Record receipt
      </Button>
    </div>
  )
}
