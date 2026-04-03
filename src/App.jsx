import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const API = 'https://fintrackr-api.onrender.com'

const Icon = ({ type }) => {
  const icons = {
    dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>,
    transactions: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 16l-4-4 4-4v3h14v2H7v3zm10-6l4 4-4 4v-3H3v-2h14V10z"/></svg>,
    budgets: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>,
    charts: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.5l6-6 4 4L22 6.92 20.59 5.5l-7.09 8-4-4L2 17l1.5 1.5z"/></svg>,
    income: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>,
    expense: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6h-6z"/></svg>,
    delete: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
    alert: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>,
    menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>,
    close: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
  }
  return icons[type] || null
}

const COLORS = ['#4f46e5', '#f472b6', '#06b6d4', '#10b981', '#f59e0b']

export default function App() {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, balance: 0 })
  const [monthlyData, setMonthlyData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [budgets, setBudgets] = useState([])
  const [budgetForm, setBudgetForm] = useState({ category: '', limit: '' })
  const [activePage, setActivePage] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [form, setForm] = useState({ type: 'expense', amount: '', category: '', description: '', date: '' })

  useEffect(() => {
    fetchAll()
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchAll = async () => {
    const [t, s, m, a, b] = await Promise.all([
      axios.get(`${API}/api/transactions`),
      axios.get(`${API}/api/summary`),
      axios.get(`${API}/api/summary/monthly`),
      axios.get(`${API}/api/alerts`),
      axios.get(`${API}/api/budgets`)
    ])
    setTransactions(t.data)
    setSummary(s.data)
    setMonthlyData(m.data)
    setAlerts(a.data)
    setBudgets(b.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await axios.post(`${API}/api/transactions`, form)
    fetchAll()
    setForm({ type: 'expense', amount: '', category: '', description: '', date: '' })
  }

  const handleDelete = async (id) => {
    await axios.delete(`${API}/api/transactions/${id}`)
    fetchAll()
  }

  const handleBudget = async (e) => {
    e.preventDefault()
    await axios.post(`${API}/api/budgets`, budgetForm)
    setBudgetForm({ category: '', limit: '' })
    fetchAll()
  }

  const handleDeleteBudget = async (id) => {
    await axios.delete(`${API}/api/budgets/${id}`)
    fetchAll()
  }

  const navigate = (page) => {
    setActivePage(page)
    setMenuOpen(false)
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.category.toLowerCase().includes(search.toLowerCase()) || 
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    const matchesFilter = filter === 'all' || t.type === filter
    return matchesSearch && matchesFilter
  })
  
  const pieData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find(a => a.name === t.category)
      if (existing) existing.value += t.amount
      else acc.push({ name: t.category, value: t.amount })
      return acc
    }, [])

  const s = {
    app: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif", background: darkMode ? '#0f1117' : '#f1f5f9' },
    
    // Desktop sidebar
    sidebar: { width: '220px', background: '#13151e', display: isMobile ? 'none' : 'flex', flexDirection: 'column', padding: '0', position: 'fixed', height: '100vh', borderRight: '1px solid #1e2130', zIndex: 100 },
    
    // Mobile top navbar
    mobileNav: { display: isMobile ? 'flex' : 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: '#13151e', borderBottom: '1px solid #1e2130', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 200 },
    
    // Mobile slide-out menu
    mobileMenu: { display: isMobile ? 'block' : 'none', position: 'fixed', top: '56px', left: 0, right: 0, bottom: 0, background: '#13151e', zIndex: 150, padding: '20px 16px', transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease' },

    sidebarTop: { padding: '28px 24px 24px', borderBottom: '1px solid #1e2130' },
    logo: { color: 'white', fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '10px' },
    logoIcon: { width: '32px', height: '32px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    balanceCard: { margin: '20px 16px', background: 'linear-gradient(135deg, #1e2130, #252838)', borderRadius: '14px', padding: '18px' },
    navSection: { padding: '16px 12px', flex: 1 },
    navLabel: { fontSize: '10px', color: '#4b5563', letterSpacing: '1px', fontWeight: '600', padding: '0 12px', marginBottom: '8px', textTransform: 'uppercase' },
    
    main: { marginLeft: isMobile ? '0' : '220px', flex: 1, padding: isMobile ? '72px 16px 100px' : '32px', background: '#0f1117', minHeight: '100vh' },
    
    pageTitle: { fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#f1f5f9', marginBottom: '6px' },
    pageSubtitle: { fontSize: '13px', color: '#6b7280', marginBottom: '20px' },
    
    grid3: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' },
    grid2: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' },
    
    card: { background: '#13151e', borderRadius: '14px', padding: isMobile ? '16px' : '22px', border: '1px solid #1e2130' },
    cardLabel: { fontSize: '11px', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' },
    cardValue: { fontSize: isMobile ? '22px' : '26px', fontWeight: '700', color: '#f1f5f9' },
    input: { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #1e2130', fontSize: '13px', background: '#0f1117', color: '#f1f5f9', boxSizing: 'border-box', outline: 'none' },
    select: { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #1e2130', fontSize: '13px', background: '#0f1117', color: '#f1f5f9', cursor: 'pointer', outline: 'none' },
    btnPrimary: { padding: '11px 22px', background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
    btnDanger: { background: 'none', border: '1px solid #1e2130', color: '#6b7280', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    txRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1e2130' },
    txIcon: { width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#f1f5f9', marginBottom: '20px', marginTop: 0 },
    pill: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
    emptyState: { textAlign: 'center', color: '#4b5563', padding: '40px', fontSize: '13px' },

    // Mobile bottom nav
    bottomNav: { display: isMobile ? 'flex' : 'none', position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: '#13151e', borderTop: '1px solid #1e2130', alignItems: 'center', justifyContent: 'space-around', zIndex: 200 },
  }

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', icon: 'transactions', label: 'Transactions' },
    { id: 'budgets', icon: 'budgets', label: 'Budgets' },
    { id: 'charts', icon: 'charts', label: 'Charts' },
  ]

  const NavItems = () => navItems.map(item => (
    <div key={item.id} onClick={() => navigate(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', marginBottom: '2px', background: activePage === item.id ? '#1e2130' : 'transparent', color: activePage === item.id ? '#f1f5f9' : '#6b7280', fontWeight: activePage === item.id ? '600' : '400', fontSize: '13px' }}>
      <Icon type={item.icon} />
      {item.label}
      {item.id === 'budgets' && alerts.length > 0 && (
        <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', borderRadius: '99px', fontSize: '10px', fontWeight: '700', padding: '1px 6px' }}>{alerts.length}</span>
      )}
    </div>
  ))

  return (
    <div style={s.app}>

      {/* Mobile Top Navbar */}
      <div style={s.mobileNav}>
        <div style={s.logo}>
          <div style={s.logoIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
          </div>
          FinTrackr
        </div>
        <div style={{ color: '#f1f5f9', cursor: 'pointer' }} onClick={() => setMenuOpen(!menuOpen)}>
          <Icon type={menuOpen ? 'close' : 'menu'} />
        </div>
      </div>

      {/* Mobile Slide Menu */}
      <div style={s.mobileMenu}>
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 12px' }}>Menu</div>
        <NavItems />
        <div style={{ ...s.balanceCard, margin: '20px 0 0' }}>
          <div style={{ fontSize: '10px', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Current Balance</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9' }}>${summary.balance}</div>
          <div style={{ fontSize: '11px', color: summary.balance >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
            {summary.balance >= 0 ? '↑ On track' : '↓ Over budget'}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.logo}>
            <div style={s.logoIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
            </div>
            FinTrackr
          </div>
        </div>
        <div style={s.balanceCard}>
          <div style={{ fontSize: '10px', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Current Balance</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9' }}>${summary.balance}</div>
          <div style={{ fontSize: '11px', color: summary.balance >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
            {summary.balance >= 0 ? '↑ On track' : '↓ Over budget'}
          </div>
        </div>
        <div style={s.navSection}>
          <div style={s.navLabel}>Menu</div>
          <NavItems />
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #1e2130' }}>
          <div style={{ fontSize: '11px', color: '#374151' }}>FinTrackr v1.0</div>
          <div style={{ fontSize: '11px', color: '#374151' }}>by Khushi Shah</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={s.main}>

        {/* Dashboard */}
        {activePage === 'dashboard' && (
          <div>
            <div style={s.pageTitle}>Dashboard</div>
            <div style={s.pageSubtitle}>Your financial overview at a glance</div>
            <div style={s.grid3}>
              {[
                { label: 'Total Income', value: `$${summary.total_income}`, color: '#10b981', icon: 'income', bg: '#10b98120' },
                { label: 'Total Expenses', value: `$${summary.total_expenses}`, color: '#ef4444', icon: 'expense', bg: '#ef444420' },
                { label: 'Net Balance', value: `$${summary.balance}`, color: summary.balance >= 0 ? '#4f46e5' : '#ef4444', icon: 'dashboard', bg: '#4f46e520' },
              ].map((card, i) => (
                <div key={i} style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={s.cardLabel}>{card.label}</div>
                      <div style={{ ...s.cardValue, color: card.color }}>{card.value}</div>
                    </div>
                    <div style={{ background: card.bg, borderRadius: '10px', padding: '10px', color: card.color }}>
                      <Icon type={card.icon} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={s.grid2}>
              <div style={s.card}>
                <div style={s.sectionTitle}>Monthly Activity</div>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: '8px', color: '#f1f5f9' }} />
                      <Bar dataKey="income" fill="#4f46e5" name="Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#f472b6" name="Expenses" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={s.emptyState}>Add transactions to see chart</div>}
              </div>
              <div style={s.card}>
                <div style={s.sectionTitle}>Spending by Category</div>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: '8px', color: '#f1f5f9' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={s.emptyState}>Add expenses to see breakdown</div>}
              </div>
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Recent Transactions</div>
              {transactions.slice(0, 6).map(t => (
                <div key={t.id} style={s.txRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ ...s.txIcon, background: t.type === 'income' ? '#10b98120' : '#ef444420', color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                      <Icon type={t.type === 'income' ? 'income' : 'expense'} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#f1f5f9' }}>{t.category}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{t.description || 'No description'} · {t.date}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                    {t.type === 'income' ? '+' : '-'}${t.amount}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && <div style={s.emptyState}>No transactions yet</div>}
            </div>
          </div>
        )}

        {/* Transactions */}
        {activePage === 'transactions' && (
          <div>
            <div style={s.pageTitle}>Transactions</div>
            <div style={s.pageSubtitle}>Manage your income and expenses</div>
            <div style={{ ...s.card, marginBottom: '20px' }}>
              <div style={s.sectionTitle}>Add New Transaction</div>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={s.select}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <input type="number" placeholder="Amount ($)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} style={s.input} required />
                  <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={s.input} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto', gap: '10px' }}>
                  <input type="text" placeholder="Description (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={s.input} />
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={s.input} required />
                  <button type="submit" style={{ ...s.btnPrimary, width: isMobile ? '100%' : 'auto' }}>Add</button>
                </div>
              </form>
            </div>
            <div style={s.card}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexDirection: isMobile ? 'column' : 'row' }}>
    <input
      type="text"
      placeholder="Search by category or description..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      style={{ ...s.input, flex: 1 }}
    />
    <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...s.select, width: isMobile ? '100%' : '160px' }}>
      <option value="all">All</option>
      <option value="income">Income only</option>
      <option value="expense">Expenses only</option>
    </select>
  </div>
              <div style={s.sectionTitle}>All Transactions</div>
              {filteredTransactions.length === 0 ? <div style={s.emptyState}>No transactions found</div> : filteredTransactions.map(t => (
                <div key={t.id} style={s.txRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ ...s.txIcon, background: t.type === 'income' ? '#10b98120' : '#ef444420', color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                      <Icon type={t.type === 'income' ? 'income' : 'expense'} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#f1f5f9' }}>{t.category}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{t.description || 'No description'} · {t.date}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                      {t.type === 'income' ? '+' : '-'}${t.amount}
                    </span>
                    <button onClick={() => handleDelete(t.id)} style={s.btnDanger}><Icon type="delete" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budgets */}
        {activePage === 'budgets' && (
          <div>
            <div style={s.pageTitle}>Budgets</div>
            <div style={s.pageSubtitle}>Set and track your monthly spending limits</div>
            {alerts.map((alert, i) => (
              <div key={i} style={{ background: '#ef444415', border: '1px solid #ef444430', borderLeft: '3px solid #ef4444', borderRadius: '10px', padding: '14px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#ef4444' }}><Icon type="alert" /></span>
                <div>
                  <div style={{ fontWeight: '600', color: '#fca5a5', fontSize: '13px' }}>Over budget in {alert.category}</div>
                  <div style={{ color: '#ef4444', fontSize: '12px' }}>Spent ${alert.spent} of ${alert.limit} — over by ${alert.over_by}</div>
                </div>
              </div>
            ))}
            <div style={{ ...s.card, marginBottom: '20px' }}>
              <div style={s.sectionTitle}>Set Budget Limit</div>
              <form onSubmit={handleBudget} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
                <input type="text" placeholder="Category (e.g. Food)" value={budgetForm.category} onChange={e => setBudgetForm({...budgetForm, category: e.target.value})} style={s.input} required />
                <input type="number" placeholder="Monthly limit ($)" value={budgetForm.limit} onChange={e => setBudgetForm({...budgetForm, limit: e.target.value})} style={s.input} required />
                <button type="submit" style={{ ...s.btnPrimary, width: isMobile ? '100%' : 'auto' }}>Set Limit</button>
              </form>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
              {budgets.map((b, i) => {
                const spent = transactions.filter(t => t.category === b.category && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                const pct = Math.min((spent / b.monthly_limit) * 100, 100)
                const over = spent > b.monthly_limit
                return (
                  <div key={i} style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '14px' }}>{b.category}</div>
                      <span style={{ ...s.pill, background: over ? '#ef444420' : '#10b98120', color: over ? '#ef4444' : '#10b981' }}>{over ? 'Over' : 'OK'}</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: over ? '#ef4444' : '#f1f5f9', marginBottom: '10px' }}>
                      ${spent.toFixed(2)} <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>/ ${b.monthly_limit}</span>
                    </div>
                    <div style={{ background: '#1e2130', borderRadius: '99px', height: '5px', marginBottom: '8px' }}>
                      <div style={{ background: over ? '#ef4444' : '#4f46e5', width: `${pct}%`, height: '5px', borderRadius: '99px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{pct.toFixed(0)}% used</div>
                      <button onClick={() => handleDeleteBudget(b.id)} style={s.btnDanger}><Icon type="delete" /></button>
                    </div>
                  </div>
                )
              })}
              {budgets.length === 0 && <div style={{ gridColumn: 'span 3', ...s.emptyState }}>No budgets set yet</div>}
            </div>
          </div>
        )}

        {/* Charts */}
        {activePage === 'charts' && (
          <div>
            <div style={s.pageTitle}>Charts</div>
            <div style={s.pageSubtitle}>Visual breakdown of your finances</div>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={s.card}>
                <div style={s.sectionTitle}>Monthly Income vs Expenses</div>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: '8px', color: '#f1f5f9' }} />
                      <Bar dataKey="income" fill="#4f46e5" name="Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#f472b6" name="Expenses" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={s.emptyState}>Add transactions to see chart</div>}
              </div>
              <div style={s.card}>
                <div style={s.sectionTitle}>Income & Expense Trend</div>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyData}>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: '8px', color: '#f1f5f9' }} />
                      <Line type="monotone" dataKey="income" stroke="#4f46e5" strokeWidth={2} dot={{ fill: '#4f46e5', r: 4 }} name="Income" />
                      <Line type="monotone" dataKey="expenses" stroke="#f472b6" strokeWidth={2} dot={{ fill: '#f472b6', r: 4 }} name="Expenses" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div style={s.emptyState}>Add transactions to see trend</div>}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Mobile Bottom Nav */}
      <div style={s.bottomNav}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => navigate(item.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activePage === item.id ? '#4f46e5' : '#6b7280', fontSize: '10px', fontWeight: activePage === item.id ? '600' : '400', padding: '8px 16px', borderRadius: '10px', position: 'relative' }}>
            <Icon type={item.icon} />
            {item.label}
            {item.id === 'budgets' && alerts.length > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '8px', background: '#ef4444', color: 'white', borderRadius: '99px', fontSize: '9px', fontWeight: '700', padding: '1px 5px' }}>{alerts.length}</span>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}