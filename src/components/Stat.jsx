import React from 'react'
import Card from '../components/Card'

export default function Stat({ label, value, sub, Icon, tone = 'green' }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{sub}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  )
}
