import React from 'react'
import { money } from '../utils/format'
import Tag from '../components/Tag'
import { useApp } from '../context/AppContext'

export default function TransactionTable({ rows }) {
  const { transactions, businessDate } = useApp()
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Material</th>
            <th className="px-4 py-3">Transaction</th>
            <th className="px-4 py-3">Quantity</th>
            <th className="px-4 py-3">Before → After</th>
            <th className="px-4 py-3">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={t.id || i} className="border-t border-slate-100">
              <td className="px-4 py-3 text-slate-500">
                {t.businessDate || t.date || '—'}
              </td>
              <td className="px-4 py-3 font-semibold">
                {t.materialName || t.name || '—'}
              </td>
              <td className="px-4 py-3">
                <Tag color={t.type === 'DAILY_CONSUMPTION' ? 'blue' : 'slate'}>
                  {t.type || '—'}
                </Tag>
              </td>
              <td className="px-4 py-3 font-semibold">
                {money(t.quantity)} {t.unit || ''}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {t.stockBefore == null
                  ? '—'
                  : `${money(t.stockBefore)} → ${money(t.stockAfter)}`}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {t.remarks || '—'}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan="6" className="p-10 text-center text-slate-400">
                No transactions match the current selection.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
