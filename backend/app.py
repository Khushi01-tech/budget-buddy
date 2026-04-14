from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, get_db

app = Flask(__name__)
CORS(app, origins=["https://myfintrackr.netlify.app", "https://khushi01-tech.github.io"])

init_db()

@app.route('/')
def home():
    return {"message": "Budget Buddy API is running!"}

# ADD a transaction
@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()  # get data sent from React
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO transactions (type, amount, category, description, date)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data['type'],
        data['amount'],
        data['category'].strip().title(),
        data.get('description', ''),
        data['date']
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Transaction added!"}), 201

# GET all transactions
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM transactions ORDER BY date DESC')
    transactions = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(t) for t in transactions])

# DELETE a transaction
@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM transactions WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Transaction deleted!"})

# GET summary (total income, expenses, balance)
@app.route('/api/summary', methods=['GET'])
def get_summary():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='income'")
    total_income = cursor.fetchone()[0]
    
    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='expense'")
    total_expenses = cursor.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "balance": round(total_income - total_expenses, 2)
    })

# GET monthly breakdown for chart
@app.route('/api/summary/monthly', methods=['GET'])
def get_monthly():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            strftime('%Y-%m', date) as month,
            type,
            ROUND(SUM(amount), 2) as total
        FROM transactions
        GROUP BY month, type
        ORDER BY month
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    # Organize by month
    monthly = {}
    for row in rows:
        month = row['month']
        if month not in monthly:
            monthly[month] = {'month': month, 'income': 0, 'expenses': 0}
        if row['type'] == 'income':
            monthly[month]['income'] = row['total']
        else:
            monthly[month]['expenses'] = row['total']
    
    return jsonify(list(monthly.values()))

# GET spending alerts
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    conn = get_db()
    cursor = conn.cursor()
    
    # Get current month spending by category
    cursor.execute('''
        SELECT category, ROUND(SUM(amount), 2) as spent
        FROM transactions
        WHERE type = 'expense'
        AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
        GROUP BY category
    ''')
    spending = cursor.fetchall()
    
    # Get budget limits
    cursor.execute('''
        SELECT category, monthly_limit 
        FROM budgets 
        WHERE month = strftime('%Y-%m', 'now')
    ''')
    budgets = {row['category']: row['monthly_limit'] for row in cursor.fetchall()}
    
    conn.close()
    
    alerts = []
    for row in spending:
        category = row['category']
        spent = row['spent']
        if category in budgets:
            limit = budgets[category]
            if spent > limit:
                alerts.append({
                    "category": category,
                    "spent": spent,
                    "limit": limit,
                    "over_by": round(spent - limit, 2)
                })
    
    return jsonify(alerts)

# GET and SET budgets
@app.route('/api/budgets', methods=['GET', 'POST'])
def handle_budgets():
    if request.method == 'POST':
        data = request.get_json()
        category = data['category'].strip().title()
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO budgets (category, monthly_limit, month)
            VALUES (?, ?, strftime('%Y-%m', 'now'))
        ''', (category, data['limit']))
        conn.commit()
        conn.close()
        return jsonify({"message": "Budget set!"})
    
    else:  # GET
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM budgets ORDER BY category')
        budgets = cursor.fetchall()
        conn.close()
        return jsonify([dict(b) for b in budgets])
    
    # DELETE a budget
@app.route('/api/budgets/<int:id>', methods=['DELETE'])
def delete_budget(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM budgets WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Budget deleted!"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
