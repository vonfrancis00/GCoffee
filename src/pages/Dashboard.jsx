import React from 'react'
import {
  Coffee,
  ClipboardList,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Leaf,
  Package,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react'
import { money, today } from '../utils/format'
import Button from '../components/Button'
import Card from '../components/Card'
import Tag from '../components/Tag'
import Stat from '../components/Stat'
import StatusTag from '../components/StatusTag'
import { useApp } from '../context/AppContext'

export default function Dashboard() {
  const {
    setPage,
    inventory,
    closings,
    loading,
    businessDate,
    sales,
    setModal,
    lowStock,
    finalize,
  } = useApp()

  const todayRows = closings.filter((c) => c.businessDate === today())
  const drafts = closings.filter((c) => c.status === 'Draft')
  const watch = [...inventory]
    .sort((a, b) => Number(b.stock <= b.minimum) - Number(a.stock <= a.minimum))
    .slice(0, 4)
  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="section-kicker">YOUR WORKSPACE, AT A GLANCE</p>
          <h1>
            Daily overview<span>.</span>
          </h1>
          <p>Keep your stock in balance and every closing accounted for.</p>
        </div>
        <div className="date-chip">
          <CalendarDays size={16} />
          {new Date().toLocaleDateString('en-PH', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>
      <section className="closing-hero">
        <div className="hero-content">
          <span className="hero-label">
            <span /> A BETTER END TO YOUR DAY
          </span>
          <h2>
            Great coffee.
            <br />
            Confident closings.
          </h2>
          <p>
            Record today's sales, review ingredient usage, and close the day
            with everything in order.
          </p>
          <Button onClick={() => setPage('Daily Sales & Inventory Deduction')}>
            Start daily closing <ArrowRight size={16} />
          </Button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="coffee-orbit orbit-one" />
          <div className="coffee-orbit orbit-two" />
          <Coffee size={116} strokeWidth={1} />
          <span className="art-caption">BREW. SERVE. BALANCE.</span>
        </div>
        <div className="hero-note">
          <CheckCircle2 size={16} />
          <span>
            Review before you finalize. Drafts keep your stock unchanged.
          </span>
        </div>
      </section>
      <div className="metrics-grid">
        <Stat
          label="Today's sales units"
          value={todayRows.reduce(
            (s, c) => s + Number(c.totalProductsSold || 0),
            0,
          )}
          sub={`${todayRows.length} closing records today`}
          Icon={Coffee}
        />
        <Stat
          label="Tracked materials"
          value={inventory.length}
          sub="Raw materials in inventory"
          Icon={Boxes}
          tone="blue"
        />
        <Stat
          label="Low stock alerts"
          value={lowStock.length}
          sub={
            lowStock.length
              ? 'Materials need your attention'
              : 'No materials below minimum'
          }
          Icon={AlertTriangle}
          tone={lowStock.length ? 'amber' : 'green'}
        />
        <Stat
          label="Draft closings"
          value={drafts.length}
          sub="Ready for review and finalization"
          Icon={ClipboardList}
          tone="rose"
        />
      </div>
      <div className="dashboard-panels">
        <Card className="activity-panel overflow-hidden">
          <div className="panel-heading">
            <div>
              <h2>Recent closings</h2>
              <p>Your latest end-of-day activity</p>
            </div>
            <button
              className="text-link"
              onClick={() => setModal({ type: 'history' })}
            >
              View all <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">Business date</th>
                  <th className="px-5 py-3">Units sold</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...closings]
                  .sort((a, b) =>
                    String(b.businessDate).localeCompare(
                      String(a.businessDate),
                    ),
                  )
                  .slice(0, 5)
                  .map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {c.businessDate}
                      </td>
                      <td className="px-5 py-4">{c.totalProductsSold || 0}</td>
                      <td className="px-5 py-4">
                        <StatusTag status={c.status} />
                      </td>
                    </tr>
                  ))}
                {!closings.length && (
                  <tr>
                    <td colSpan="3">
                      <div className="closing-empty">
                        <div className="empty-icon">
                          <ClipboardList size={25} />
                        </div>
                        <h3>A fresh start for your day</h3>
                        <p>
                          Your closing records will appear here once you save
                          <br className="hidden sm:block" /> a draft or finalize
                          your daily sales.
                        </p>
                        <button
                          className="text-link"
                          onClick={() =>
                            setPage('Daily Sales & Inventory Deduction')
                          }
                        >
                          Create your first closing <ArrowRight size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="stock-panel">
          <div className="panel-heading">
            <div>
              <h2>Stock overview</h2>
              <p>A quick check on your raw materials</p>
            </div>
            <Tag color={lowStock.length ? 'amber' : 'green'}>
              {lowStock.length} alerts
            </Tag>
          </div>
          <div className="stock-list">
            {watch.map((m) => (
              <div className="stock-row" key={m.id}>
                <div className="material-icon">
                  <Package size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-sm">{m.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {m.stock <= m.minimum
                      ? 'Low stock'
                      : m.minimum > 0
                        ? 'Above minimum'
                        : 'Minimum not set'}
                  </p>
                </div>
                <div className="stock-quantity">
                  {money(m.stock)} <span>{m.unit}</span>
                  <i
                    className={
                      m.stock <= m.minimum ? 'stock-dot low' : 'stock-dot'
                    }
                  />
                </div>
              </div>
            ))}
            {!watch.length && (
              <p className="p-5 text-sm text-slate-500">
                {loading ? 'Loading inventory...' : 'No materials loaded yet.'}
              </p>
            )}
          </div>
          <button className="stock-footer" onClick={() => setPage('Inventory')}>
            Manage inventory <ArrowRight size={16} />
          </button>
        </Card>
      </div>
      <div className="workflow-strip">
        <div className="workflow-title">
          <Leaf size={20} />
          <div>
            <strong>A smooth close, every time</strong>
            <p>From sales to stock in three simple steps.</p>
          </div>
        </div>
        <div className="workflow-steps">
          <span>
            <b>01</b> Record sales
          </span>
          <ArrowRight size={14} />
          <span>
            <b>02</b> Review usage
          </span>
          <ArrowRight size={14} />
          <span>
            <b>03</b> Finalize closing
          </span>
        </div>
      </div>
    </div>
  )
}
