from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, get_db

app = Flask(__name__)
CORS(app)

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
        data['category'],
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)

