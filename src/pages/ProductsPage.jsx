import React from 'react'
import { Coffee, Plus, Pencil, Menu, Utensils } from 'lucide-react'
import { apiPost, isConnected } from '../api'
import Button from '../components/Button'
import Card from '../components/Card'
import Tag from '../components/Tag'
import PageHeading from '../components/PageHeading'
import { useApp } from '../context/AppContext'

export default function ProductsPage() {
  const {
    products,
    setProducts,
    setNotice,
    category,
    setModal,
    recipeProduct,
    setRecipeProduct,
    refreshData,
  } = useApp()
  const product = products.find((p) => p.id === recipeProduct) || products[0]
  return (
    <>
      <PageHeading
        eyebrow="Catalog & configuration"
        title="Products & Recipes"
        desc="Manage product status and review per-serving ingredient recipes. Data is loaded from your Google Sheet."
        actions={
          <Button onClick={() => setModal({ type: 'addProduct' })}>
            <Plus size={16} /> Add product
          </Button>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold">Menu catalog</h2>
            <p className="mt-1 text-xs text-slate-500">
              {products.length} products configured
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => setRecipeProduct(p.id)}
                className={`flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50 ${recipeProduct === p.id ? 'bg-neutral-50/60' : ''}`}
              >
                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                  {p.category === 'Coffee' ? (
                    <Coffee size={18} />
                  ) : (
                    <Utensils size={18} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {p.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {p.category} · {p.recipe?.length || 0} ingredients
                  </p>
                </div>
                <Tag color={p.status === 'Inactive' ? 'slate' : 'green'}>
                  {p.status || 'Active'}
                </Tag>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="border-b border-slate-100 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-coffee-600">
              Per-serving recipe
            </p>
            <h2 className="mt-1 text-xl font-extrabold">{product?.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingredient quantities used to calculate daily consumption.
            </p>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Ingredient</th>
                    <th className="px-3 py-3">Qty / serving</th>
                    <th className="px-3 py-3">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {(product?.recipe || []).map((i) => (
                    <tr
                      key={i.materialId}
                      className="border-t border-slate-100"
                    >
                      <td className="px-3 py-3 font-semibold">
                        {i.materialName}
                      </td>
                      <td className="px-3 py-3">{i.quantity}</td>
                      <td className="px-3 py-3 text-slate-500">{i.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={!product}
                onClick={() =>
                  setModal({ type: 'editRecipe', productId: product.id })
                }
              >
                <Pencil size={15} /> Edit recipe
              </Button>
              <Button
                variant="secondary"
                disabled={!product}
                onClick={async () => {
                  if (!window.confirm(`Set ${product.name} inactive?`)) return
                  if (isConnected) {
                    try {
                      await apiPost('saveProduct', {
                        ...product,
                        status: 'Inactive',
                      })
                      await refreshData()
                    } catch (e) {
                      setNotice({ type: 'error', text: e.message })
                      return
                    }
                  }
                  setProducts((old) =>
                    old.map((p) =>
                      p.id === product.id ? { ...p, status: 'Inactive' } : p,
                    ),
                  )
                  setNotice({
                    type: 'success',
                    text: 'Product status updated in this view.',
                  })
                }}
              >
                Deactivate product
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
