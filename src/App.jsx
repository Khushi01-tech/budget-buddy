import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:5000'

function App() {
  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: ''
  })

  // Fetch all transactions when page loads
  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    const response = await axios.get(`${API}/api/transactions`)
    setTransactions(response.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await axios.post(`${API}/api/transactions`, form)
    fetchTransactions() // refresh the list
    setForm({ type: 'expense', amount: '', category: '', description: '', date: '' })
  }

  const handleDelete = async (id) => {
    await axios.delete(`${API}/api/transactions/${id}`)
    fetchTransactions()
}

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>💰 Budget Buddy</h1>

      {/* Add Transaction Form */}
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Add Transaction</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <select
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value})}
              style={{ padding: '8px', marginRight: '10px' }}
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
              style={{ padding: '8px', marginRight: '10px' }}
              required
            />
            <input
              type="text"
              placeholder="Category (e.g. Food)"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
              style={{ padding: '8px', marginRight: '10px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              style={{ padding: '8px', marginRight: '10px' }}
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              style={{ padding: '8px' }}
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
          <p>No transactions yet. Add one above!</p>
        ) : (
          transactions.map(t => (
            <div key={t.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px',
              marginBottom: '8px',
              background: t.type === 'income' ? '#e8f5e9' : '#ffebee',
              borderRadius: '4px'
            }}>
              <span>{t.category} — {t.description}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  <span style={{ fontWeight: 'bold', color: t.type === 'income' ? 'green' : 'red' }}>
    {t.type === 'income' ? '+' : '-'}${t.amount}
  </span>
  <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '16px' }}>
    ✕
  </button>
</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App