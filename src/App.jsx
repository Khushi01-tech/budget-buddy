import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const API = 'http://127.0.0.1:5000'

function App() {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, balance: 0 })
  const [monthlyData, setMonthlyData] = useState([])
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: ''
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const [t, s, m] = await Promise.all([
      axios.get(`${API}/api/transactions`),
      axios.get(`${API}/api/summary`),
      axios.get(`${API}/api/summary/monthly`)
    ])
    setTransactions(t.data)
    setSummary(s.data)
    setMonthlyData(m.data)
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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>💰 Budget Buddy</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Total Income</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'green' }}>${summary.total_income}</div>
        </div>
        <div style={{ background: '#ffebee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Total Expenses</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'red' }}>${summary.total_expenses}</div>
        </div>
        <div style={{ background: summary.balance >= 0 ? '#e3f2fd' : '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Balance</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: summary.balance >= 0 ? '#1565c0' : 'orange' }}>${summary.balance}</div>
        </div>
      </div>

      {/* Bar Chart */}
      {monthlyData.length > 0 && (
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
          <h2 style={{ marginTop: 0 }}>Monthly Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#4CAF50" name="Income" />
              <Bar dataKey="expenses" fill="#f44336" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Transaction Form */}
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0 }}>Add Transaction</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <select
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value})}
              style={{ padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              style={{ padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
            <input
              type="text"
              placeholder="Category (e.g. Food)"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
              style={{ padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              style={{ padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Add Transaction
          </button>
        </form>
      </div>

      {/* Transaction List */}
      <div>
        <h2>Transactions</h2>
        {transactions.length === 0 ? (
          <p style={{ color: '#999' }}>No transactions yet. Add one above!</p>
        ) : (
          transactions.map(t => (
            <div key={t.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              marginBottom: '8px',
              background: t.type === 'income' ? '#e8f5e9' : '#ffebee',
              borderRadius: '6px'
            }}>
              <div>
                <span style={{ fontWeight: '500' }}>{t.category}</span>
                {t.description && <span style={{ color: '#666', marginLeft: '8px' }}>— {t.description}</span>}
                <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>{t.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 'bold', color: t.type === 'income' ? 'green' : 'red' }}>
                  {t.type === 'income' ? '+' : '-'}${t.amount}
                </span>
                <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '16px' }}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App