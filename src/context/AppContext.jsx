import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiGet, apiPost, isConnected } from '../api'
import { money, today, businessDateText } from '../utils/format'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  const [page, setPage] = useState('Dashboard'),
    [mobileOpen, setMobileOpen] = useState(false),
    [inventory, setInventory] = useState([]),
    [products, setProducts] = useState([]),
    [closings, setClosings] = useState([]),
    [transactions, setTransactions] = useState([]),
    [loading, setLoading] = useState(false),
    [notice, setNotice] = useState(null)
  const [businessDate, setBusinessDate] = useState(today()),
    [search, setSearch] = useState(''),
    [category, setCategory] = useState('All'),
    [sales, setSales] = useState({}),
    [selectedId, setSelectedId] = useState(null),
    [modal, setModal] = useState(null),
    [selectedClosing, setSelectedClosing] = useState(null)
  const [draftName, setDraftName] = useState(''),
    [recipeProduct, setRecipeProduct] = useState(''),
    [inventorySearch, setInventorySearch] = useState('')
  const [modifier, setModifier] = useState({}),
    [exact, setExact] = useState({}),
    [adjustment, setAdjustment] = useState({})
  const [transactionCategory, setTransactionCategory] = useState('')
  const [reportDate, setReportDate] = useState(today()),
    [lastRefresh, setLastRefresh] = useState(new Date())
  useEffect(() => {
    if (!isConnected) return
    refreshData()
  }, [])
  useEffect(() => {
    if (modal?.type !== 'contact') return
    const trigger = document.activeElement
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setModal(null)
      if (e.key === 'Tab') {
        e.preventDefault()
        const controls = Array.from(
          document.querySelectorAll(
            '[data-contact-dialog] button, [data-contact-dialog] a[href]',
          ),
        )
        const current = controls.indexOf(document.activeElement)
        const next =
          controls[
            (current + (e.shiftKey ? -1 : 1) + controls.length) %
              controls.length
          ]
        next?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (trigger?.isConnected) trigger.focus()
    }
  }, [modal?.type])
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 4200)
    return () => clearTimeout(t)
  }, [notice])
  async function refreshData() {
    if (!isConnected) {
      setLastRefresh(new Date())
      return
    }
    setLoading(true)
    try {
      const [i, p, d, t] = await Promise.all([
        apiGet('getInventory'),
        apiGet('getProducts'),
        apiGet('getDailySales'),
        apiGet('getInventoryTransactions'),
      ])
      if (i.data) setInventory(i.data.map(normalizeMaterial))
      if (p.data) setProducts(p.data.map(normalizeProduct))
      if (d.data)
        setClosings(
          d.data.map((r) => ({
            ...r,
            id: r.id || r.DailySalesID,
            businessDate: businessDateText(r.businessDate || r.BusinessDate),
            status: r.status || r.Status,
            totalProductsSold: r.totalProductsSold ?? r.TotalProductsSold,
          })),
        )
      if (t.data)
        setTransactions(
          t.data
            .map((r) =>
              Object.fromEntries(
                Object.entries(r).map(([k, v]) => [
                  k[0].toLowerCase() + k.slice(1),
                  v,
                ]),
              ),
            )
            .map((r) => ({
              ...r,
              id: r.id || r.transactionID,
              businessDate: businessDateText(r.businessDate || r.date),
            })),
        )
      setLastRefresh(new Date())
      setNotice({ type: 'success', text: 'Data refreshed from Google Sheets.' })
    } catch (e) {
      setNotice({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }
  function normalizeMaterial(m) {
    return {
      id: m.id || m.ID,
      name: m.name || m.Name,
      category: m.category || m.Category || 'Other',
      unit: m.unit || m.Unit || 'g',
      stock: Number(m.stock ?? m.Stock) || 0,
      minimum: Number(m.minimum ?? m.Minimum) || 0,
      unitCost: Number(m.unitCost ?? m.UnitCost) || 0,
      status: m.status || m.Status || 'Active',
    }
  }
  function normalizeProduct(p) {
    return {
      ...p,
      id: p.id || p.productId || p.ProductID,
      name: p.name || p.productName || p.ProductName,
      status: p.status || p.Status || 'Active',
      category: p.category || p.Category || 'Coffee',
      recipe: p.recipe || p.ingredients || [],
    }
  }
  const activeProducts = products.filter((p) => p.status !== 'Inactive')
  const visibleProducts = activeProducts.filter(
    (p) =>
      (category === 'All' || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  )
  function addVariation(p) {
    setSales((old) => ({
      ...old,
      [p.id]: [
        ...(old[p.id] || []),
        {
          key: crypto.randomUUID?.() || String(Date.now() + Math.random()),
          name: 'Regular',
          quantity: 1,
          mods: {},
        },
      ],
    }))
  }
  function removeVariation(pid, key) {
    setSales((old) => ({
      ...old,
      [pid]: (old[pid] || []).filter((v) => v.key !== key),
    }))
  }
  function updateVariation(pid, key, field, value) {
    setSales((old) => ({
      ...old,
      [pid]: (old[pid] || []).map((v) =>
        v.key === key ? { ...v, [field]: value } : v,
      ),
    }))
  }
  function setMod(pid, key, materialId, mode, value) {
    setSales((old) => ({
      ...old,
      [pid]: (old[pid] || []).map((v) => {
        if (v.key !== key) return v
        return { ...v, mods: { ...v.mods, [materialId]: { mode, value } } }
      }),
    }))
  }
  const saleItems = useMemo(
    () =>
      products.flatMap((p) =>
        (sales[p.id] || [])
          .filter((v) => Number(v.quantity) > 0)
          .map((v) => ({ product: p, variation: v })),
      ),
    [products, sales],
  )
  const computed = useMemo(() => {
    const totals = {}
    const rows = saleItems.map(({ product, variation }) => {
      const finalIngredients = (product.recipe || []).map((ing) => {
        const change = variation.mods?.[ing.materialId] || { mode: 'Default' }
        let q = Number(ing.quantity) || 0
        if (change.mode === 'Remove') q = 0
        if (change.mode === 'Less')
          q = Math.max(0, q - (Number(change.value) || 0))
        if (change.mode === 'Extra') q = q + (Number(change.value) || 0)
        if (change.mode === 'Exact') q = Number(change.value) || 0
        const material = inventory.find((m) => m.id === ing.materialId)
        if (material) {
          if (!totals[material.id])
            totals[material.id] = { ...material, required: 0 }
          totals[material.id].required += q * Number(variation.quantity)
        }
        return { ...ing, quantity: q }
      })
      return { product, variation, finalIngredients }
    })
    return {
      rows,
      totals: Object.values(totals).map((t) => ({
        ...t,
        remaining: t.stock - t.required,
        shortage: Math.max(0, t.required - t.stock),
      })),
      totalCups: saleItems.reduce(
        (s, x) => s + Number(x.variation.quantity),
        0,
      ),
    }
  }, [saleItems, inventory])
  const lowStock = inventory.filter((m) => m.stock <= m.minimum)
  async function saveDraft() {
    if (
      saleItems.some(({ variation }) =>
        Object.values(variation.mods || {}).some(
          (m) =>
            ['Exact', 'Less', 'Extra'].includes(m.mode) &&
            (m.value == null ||
              String(m.value).trim() === '' ||
              !Number.isFinite(Number(m.value)) ||
              Number(m.value) < 0),
        ),
      )
    ) {
      setNotice({
        type: 'error',
        text: 'Enter a valid quantity for each ingredient customization.',
      })
      return
    }
    if (!saleItems.length) {
      setNotice({
        type: 'error',
        text: 'Add at least one product variation before saving.',
      })
      return
    }
    const payload = {
      businessDate,
      status: 'Draft',
      items: computed.rows.map(({ product, variation, finalIngredients }) => ({
        productId: product.id,
        productName: product.name,
        variationName: variation.name,
        quantitySold: Number(variation.quantity),
        customizations: variation.mods,
        finalIngredients,
      })),
    }
    if (isConnected) {
      try {
        const r = await apiPost('saveDailySalesDraft', payload)
        setNotice({
          type: 'success',
          text: r.message || 'Draft saved to Google Sheets.',
        })
        await refreshData()
        return
      } catch (e) {
        setNotice({ type: 'error', text: e.message })
        return
      }
    } else
      setNotice({
        type: 'success',
        text: 'Preview draft saved locally for this session. Configure the Apps Script URL for persistent storage.',
      })
    setClosings((old) => [
      {
        id: 'DS-' + Date.now(),
        businessDate,
        status: 'Draft',
        totalProductsSold: computed.totalCups,
        createdAt: new Date().toISOString(),
        remarks: 'Saved draft',
        items: payload.items,
      },
      ...old.filter(
        (c) => c.businessDate !== businessDate || c.status !== 'Draft',
      ),
    ])
  }
  async function finalize() {
    if (
      saleItems.some(({ variation }) =>
        Object.values(variation.mods || {}).some(
          (m) =>
            ['Exact', 'Less', 'Extra'].includes(m.mode) &&
            (m.value == null ||
              String(m.value).trim() === '' ||
              !Number.isFinite(Number(m.value)) ||
              Number(m.value) < 0),
        ),
      )
    ) {
      setNotice({
        type: 'error',
        text: 'Enter a valid quantity for each ingredient customization.',
      })
      return
    }
    if (!saleItems.length) {
      setNotice({
        type: 'error',
        text: 'Add at least one product variation first.',
      })
      return
    }
    const shortages = computed.totals.filter((t) => t.shortage > 0)
    if (shortages.length) {
      setNotice({
        type: 'error',
        text: `Insufficient stock: ${shortages.map((s) => `${s.name} short ${money(s.shortage)} ${s.unit}`).join(', ')}. Record stock or reconcile before finalizing.`,
      })
      return
    }
    if (
      !window.confirm(
        `Finalize closing for ${businessDate} and deduct ingredients from inventory? This action should only be performed once.`,
      )
    )
      return
    const payload = {
      businessDate,
      submissionId: `CLOSE-${businessDate}-${Date.now()}`,
      items: computed.rows.map(({ product, variation, finalIngredients }) => ({
        productId: product.id,
        productName: product.name,
        variationName: variation.name,
        quantitySold: Number(variation.quantity),
        customizations: variation.mods || {},
        finalIngredients,
      })),
    }
    if (isConnected) {
      try {
        const r = await apiPost('finalizeDailySales', payload)
        setNotice({
          type: 'success',
          text: r.message || 'Daily sales finalized and inventory deducted.',
        })
        setSales({})
        await refreshData()
      } catch (e) {
        setNotice({ type: 'error', text: e.message })
        return
      }
    } else {
      setInventory((old) =>
        old.map((m) => {
          const t = computed.totals.find((x) => x.id === m.id)
          return t ? { ...m, stock: m.stock - t.required } : m
        }),
      )
      setTransactions((old) => [
        ...computed.totals
          .filter((t) => t.required > 0)
          .map((t) => ({
            id: 'TX-' + Date.now() + t.id,
            date: new Date().toISOString(),
            businessDate,
            dailySalesId: payload.submissionId,
            materialId: t.id,
            materialName: t.name,
            type: 'DAILY_CONSUMPTION',
            quantity: -t.required,
            unit: t.unit,
            stockBefore: t.stock,
            stockAfter: t.remaining,
            remarks: 'Local preview only',
          })),
        ...old,
      ])
      setClosings((old) => [
        {
          id: payload.submissionId,
          businessDate,
          status: 'Finalized',
          totalProductsSold: computed.totalCups,
          createdAt: new Date().toISOString(),
          finalizedAt: new Date().toISOString(),
          remarks: 'Local preview only',
          items: payload.items,
        },
        ...old,
      ])
      setSales({})
      setNotice({
        type: 'success',
        text: 'Local preview finalized. No Google Sheets were changed.',
      })
    }
  }
  async function reverseClosing(c) {
    if (
      !window.confirm(
        `Reverse inventory deduction for ${c.id}? This must only be done once by an authorized user.`,
      )
    )
      return
    if (isConnected) {
      try {
        const r = await apiPost('reverseDailySales', {
          dailySalesId: c.id,
          reason: 'Authorized correction',
        })
        setNotice({ type: 'success', text: r.message || 'Closing reversed.' })
        await refreshData()
      } catch (e) {
        setNotice({ type: 'error', text: e.message })
      }
    } else {
      setClosings((old) =>
        old.map((x) => (x.id === c.id ? { ...x, status: 'Reversed' } : x)),
      )
      setNotice({
        type: 'success',
        text: 'Local preview status changed to Reversed; no persistent data changed.',
      })
    }
  }
  async function viewClosing(c) {
    setSelectedClosing({ record: c, items: [], movements: [], loading: true })
    setModal({ type: 'report' })
    try {
      let record = c,
        items = c.items || [],
        movements = transactions.filter(
          (t) => String(t.dailySalesID || t.dailySalesId) === String(c.id),
        )
      if (isConnected) {
        const [details, ledger] = await Promise.all([
          apiGet('getDailySalesDetails', { id: c.id }),
          apiGet('getInventoryTransactions'),
        ])
        if (!details.data?.sales)
          throw new Error(
            'This closing record could not be found. Refresh the records and try again.',
          )
        record = { ...c, ...details.data.sales }
        items = details.data.items || []
        movements = (ledger.data || [])
          .filter(
            (t) => String(t.DailySalesID || t.dailySalesId) === String(c.id),
          )
          .map((t) => ({
            id: t.TransactionID,
            materialName: t.MaterialName,
            type: t.Type,
            quantity: t.Quantity,
            unit: t.Unit,
            stockBefore: t.StockBefore,
            stockAfter: t.StockAfter,
            remarks: t.Remarks,
          }))
      }
      setSelectedClosing({ record, items, movements, loading: false })
    } catch (e) {
      setSelectedClosing({
        record: c,
        items: [],
        movements: [],
        loading: false,
        error: e.message,
      })
    }
  }

  const totalStockValue = inventory.reduce(
    (s, m) => s + (Number(m.stock) || 0) * (Number(m.unitCost) || 0),
    0,
  )

  return (
    <AppContext.Provider
      value={{
        page,
        setPage,
        mobileOpen,
        setMobileOpen,
        inventory,
        setInventory,
        products,
        setProducts,
        closings,
        setClosings,
        transactions,
        setTransactions,
        loading,
        setLoading,
        notice,
        setNotice,
        businessDate,
        setBusinessDate,
        search,
        setSearch,
        category,
        setCategory,
        sales,
        setSales,
        selectedId,
        setSelectedId,
        modal,
        setModal,
        selectedClosing,
        setSelectedClosing,
        draftName,
        setDraftName,
        recipeProduct,
        setRecipeProduct,
        inventorySearch,
        setInventorySearch,
        modifier,
        setModifier,
        exact,
        setExact,
        adjustment,
        setAdjustment,
        transactionCategory,
        setTransactionCategory,
        reportDate,
        setReportDate,
        lastRefresh,
        setLastRefresh,
        refreshData,
        normalizeMaterial,
        normalizeProduct,
        activeProducts,
        visibleProducts,
        addVariation,
        removeVariation,
        updateVariation,
        setMod,
        saleItems,
        computed,
        lowStock,
        saveDraft,
        finalize,
        reverseClosing,
        viewClosing,
        totalStockValue,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
