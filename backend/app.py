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

if __name__ == '__main__':
    app.run(debug=True, port=5000)