import React from 'react'

export default function PageHeading({ eyebrow, title, desc, actions }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-coffee-600">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-[28px]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
          {desc}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
