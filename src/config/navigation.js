import {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  BookOpen,
  ChartNoAxesCombined,
  Settings,
  History,
} from 'lucide-react'

export const nav = [
  {
    group: 'WORKSPACE',
    items: [
      ['Dashboard', LayoutDashboard],
      ['Daily Sales & Inventory Deduction', ClipboardList],
      ['Inventory', Boxes],
      ['Products & Recipes', BookOpen],
    ],
  },
  {
    group: 'INSIGHTS',
    items: [
      ['Daily Consumption Reports', ChartNoAxesCombined],
      ['Inventory Transactions', History],
    ],
  },
  { group: 'SYSTEM', items: [['Settings', Settings]] },
]
