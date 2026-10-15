import React from 'react'
import { inputClass } from '../utils/format'
import Field from '../components/Field'

export default function ModifierEditor({ product, variation, setMod }) {
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Ingredient customizations
        </p>
        <span className="text-[11px] text-slate-400">Per serving</span>
      </div>
      <div className="space-y-2">
        {(product.customizations || []).length > 0 && (
          <Field label="Sheet customization">
            <select
              className={inputClass}
              value=""
              onChange={(e) => {
                const option = product.customizations.find(
                  (c) => c.id === e.target.value,
                )
                if (option)
                  setMod(
                    product.id,
                    variation.key,
                    option.materialId,
                    option.mode,
                    option.requiresExact ? '' : option.quantity,
                  )
              }}
            >
              <option value="">Choose a customization?</option>
              {product.customizations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (
                  {c.requiresExact
                    ? 'Enter exact quantity'
                    : `${c.quantity} ${c.unit}`}
                  )
                </option>
              ))}
            </select>
          </Field>
        )}
        {product.recipe.map((ing) => {
          const mod = variation.mods?.[ing.materialId] || {
            mode: 'Default',
            value: '',
          }
          return (
            <div
              key={ing.materialId}
              className="grid grid-cols-[minmax(0,1fr)_100px_90px] items-center gap-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-700">
                  {ing.materialName}
                </p>
                <p className="text-[10px] text-slate-400">
                  Default {ing.quantity} {ing.unit}
                </p>
              </div>
              <select
                value={mod.mode}
                onChange={(e) =>
                  setMod(
                    product.id,
                    variation.key,
                    ing.materialId,
                    e.target.value,
                    mod.value,
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"
              >
                <option>Default</option>
                <option>Remove</option>
                <option>Less</option>
                <option>Extra</option>
                <option>Exact</option>
              </select>
              {mod.mode !== 'Default' && mod.mode !== 'Remove' ? (
                <input
                  type="number"
                  min="0"
                  step={['pcs', 'slices'].includes(ing.unit) ? 1 : 'any'}
                  value={mod.value}
                  onChange={(e) =>
                    setMod(
                      product.id,
                      variation.key,
                      ing.materialId,
                      mod.mode,
                      e.target.value,
                    )
                  }
                  placeholder={
                    mod.mode === 'Less'
                      ? 'Reduce by'
                      : mod.mode === 'Extra'
                        ? 'Add'
                        : 'Exact qty'
                  }
                  className="min-w-0 rounded-lg border border-slate-200 px-2 py-2 text-xs"
                />
              ) : (
                <span className="text-right text-[10px] text-slate-400">
                  {mod.mode === 'Remove' ? '0 ' + ing.unit : 'No change'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
