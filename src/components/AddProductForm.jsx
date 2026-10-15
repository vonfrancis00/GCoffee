import React, { useState } from 'react'
import { Coffee, Plus } from 'lucide-react'
import { apiPost, isConnected } from '../api'
import { inputClass } from '../utils/format'
import Button from '../components/Button'
import Field from '../components/Field'
import { useApp } from '../context/AppContext'

export default function AddProductForm() {
  const {
    products,
    setProducts,
    setNotice,
    category,
    sales,
    setModal,
    setRecipeProduct,
    refreshData,
  } = useApp()
  const [name, setName] = useState(''),
    [cat, setCat] = useState('Coffee')
  async function submit() {
    if (!name.trim()) {
      setNotice({ type: 'error', text: 'Enter a product name.' })
      return
    }
    const p = {
      id: 'P-' + Date.now(),
      name: name.trim(),
      category: cat,
      status: 'Active',
      recipe: [],
    }
    if (isConnected) {
      try {
        await apiPost('saveProduct', p)
        await refreshData()
      } catch (e) {
        setNotice({ type: 'error', text: e.message })
        return
      }
    }
    setProducts((old) => [...old, p])
    setRecipeProduct(p.id)
    setNotice({
      type: 'success',
      text: isConnected
        ? 'Product added.'
        : 'Product added in local preview only. Add its recipe before using it for deduction.',
    })
    setModal(null)
  }
  return (
    <div className="space-y-4">
      <Field label="Product name">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Spanish Latte"
        />
      </Field>
      <Field label="Category">
        <select
          className={inputClass}
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option>Coffee</option>
          <option>Meals</option>
        </select>
      </Field>
      <p className="text-xs text-amber-700">
        New products start with an empty recipe. Configure the recipe before
        recording sales.
      </p>
      <Button onClick={submit}>
        <Plus size={15} /> Create product
      </Button>
    </div>
  )
}
