import React, { useEffect, useRef } from 'react'
import {
  Coffee,
  Eye,
  CheckCircle2,
  RotateCcw,
  X,
  Mail,
  ArrowUpRight,
} from 'lucide-react'
import { money, businessDateText } from '../utils/format'
import Button from '../components/Button'
import Tag from '../components/Tag'
import ClosingReport from '../components/ClosingReport'
import StatusTag from '../components/StatusTag'
import StockInForm from '../components/StockInForm'
import EditMaterialForm from '../components/EditMaterialForm'
import RecipeForm from '../components/RecipeForm'
import AddProductForm from '../components/AddProductForm'
import { useApp } from '../context/AppContext'

export default function Modal() {
  const {
    inventory,
    products,
    closings,
    businessDate,
    sales,
    modal,
    setModal,
    saleItems,
    computed,
    finalize,
    reverseClosing,
    viewClosing,
  } = useApp()
  const dialogRef = useRef(null)
  const isOpen = Boolean(modal)
  useEffect(() => {
    if (!isOpen) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = dialogRef.current
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length > 0)
    ;(focusable()[0] || dialog).focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setModal(null)
      }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (!first) {
        event.preventDefault()
        dialog.focus()
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [isOpen, setModal])
  if (!modal) return null
  const close = () => setModal(null)
  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="workspace-modal-title"
        data-contact-dialog={modal.type === 'contact' ? '' : undefined}
        className={`modal-panel flex w-full flex-col overflow-hidden bg-white ${modal.type === 'contact' ? 'contact-modal' : 'max-w-3xl'}`}
      >
        <div className="modal-header flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            {modal.type === 'contact' && (
              <div className="contact-eyebrow">
                <Coffee size={15} /> G COFFEE SUPPORT
              </div>
            )}
            <h2
              id="workspace-modal-title"
              className="font-extrabold text-slate-900"
            >
              {modal.type === 'contact'
                ? 'Contact Us'
                : modal.type === 'report'
                  ? 'Closing report'
                  : modal.type === 'history'
                    ? 'Previous closing records'
                    : modal.type === 'preview'
                      ? 'Review daily sales'
                      : modal.type === 'stockIn'
                        ? 'Record stock receipt'
                        : modal.type === 'editMaterial'
                          ? 'Edit inventory material'
                          : modal.type === 'editRecipe'
                            ? 'Edit recipe'
                            : 'Add product'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {modal.type === 'contact'
                ? 'A little help, whenever you need it.'
                : modal.type === 'report'
                  ? 'Saved sales and inventory movement details.'
                  : modal.type === 'preview'
                    ? `Business date: ${businessDate}`
                    : 'Review details before applying changes.'}
            </p>
          </div>
          <button
            aria-label="Close dialog"
            onClick={close}
            className="modal-dismiss rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>
        <div className="modal-body min-h-0 overflow-y-auto p-5">
          {modal.type === 'contact' && (
            <div className="contact-content">
              <p className="contact-intro">
                Questions about sales, inventory, or your workspace? Get in
                touch with your administrator.
              </p>
              <div className="contact-card">
                <div className="contact-person">
                  <div className="contact-avatar" aria-hidden="true">
                    VL
                  </div>
                  <div>
                    <p className="contact-name">Von Francis A. La Victoria</p>
                    <p className="contact-role">Workspace Administrator</p>
                  </div>
                </div>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=vonacenas17%40gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-email"
                >
                  <Mail size={18} aria-hidden="true" />
                  <span>
                    <span className="contact-email-label">EMAIL ADDRESS</span>
                    <span className="break-all">vonacenas17@gmail.com</span>
                  </span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </div>
              <a
                className="contact-action"
                href="https://mail.google.com/mail/?view=cm&fs=1&to=vonacenas17%40gmail.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail size={17} aria-hidden="true" /> Send an email{' '}
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <p className="contact-hint">Opens Gmail in a new tab.</p>
            </div>
          )}
          {modal.type === 'history' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Units</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {closings.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="p-3 whitespace-nowrap">
                        {businessDateText(c.businessDate)}
                      </td>
                      <td className="p-3 font-semibold">{c.id}</td>
                      <td className="p-3">{c.totalProductsSold || 0}</td>
                      <td className="p-3">
                        <StatusTag status={c.status} />
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => viewClosing(c)}
                          >
                            <Eye size={14} /> View report
                          </Button>
                          {c.status === 'Finalized' && (
                            <Button
                              variant="danger"
                              onClick={() => {
                                close()
                                reverseClosing(c)
                              }}
                            >
                              <RotateCcw size={14} /> Reverse
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!closings.length && (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-8 text-center text-slate-400"
                      >
                        No closing records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {modal.type === 'report' && <ClosingReport />}
          {modal.type === 'preview' && (
            <>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Variation rows</p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {computed.rows.length}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Units sold</p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {computed.totalCups}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Shortages</p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {computed.totals.filter((t) => t.shortage > 0).length}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {computed.rows.map((r, i) => (
                  <div
                    key={r.variation.key}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{r.product.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {r.variation.name} · {r.variation.quantity} serving(s)
                        </p>
                      </div>
                      <Tag>{i + 1}</Tag>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {r.finalIngredients.map((ing) => (
                        <div
                          key={ing.materialId}
                          className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs"
                        >
                          <span className="text-slate-600">
                            {ing.materialName}
                          </span>
                          <span className="font-bold">
                            {money(ing.quantity)} {ing.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {modal.type === 'stockIn' && <StockInForm />}
          {modal.type === 'editMaterial' && <EditMaterialForm />}
          {modal.type === 'editRecipe' && (
            <RecipeForm
              product={products.find((p) => p.id === modal.productId)}
            />
          )}
          {modal.type === 'addProduct' && <AddProductForm />}
        </div>
        <div className="modal-footer flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
          <Button variant="secondary" onClick={close}>
            Close
          </Button>
          {modal.type === 'report' && (
            <Button
              variant="secondary"
              onClick={() => setModal({ type: 'history' })}
            >
              Back to records
            </Button>
          )}
          {modal.type === 'preview' && (
            <Button
              onClick={() => {
                close()
                finalize()
              }}
              disabled={
                !saleItems.length || computed.totals.some((t) => t.shortage > 0)
              }
            >
              <CheckCircle2 size={15} /> Finalize closing
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
