const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Initialize SQLite database
const db = new sqlite3.Database('./subscriptions.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      subscribed INTEGER NOT NULL DEFAULT 0
    )`);
  }
});

// Your PayPal credentials
const PAYPAL_CLIENT_ID = 'ATpsCBlDpSgM89hJ2UEieyCFWzG71HBfchFSlY_7JP1mGnpx5Ek9Gk0UpaHo31Md7wfmA3Li_a1KtvK6';
const PAYPAL_SECRET = 'EPpJ1Y2ymkvp0poTQBJUo4RPK8WQCbQtDLL673zunxU5-gyPKrHHXFOyXz1JaqOXRVna1WuvUJl4xKQd';

async function getAccessToken() {
  const response = await axios.post(
    'https://api.paypal.com/v1/oauth2/token',
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: PAYPAL_CLIENT_ID,
        password: PAYPAL_SECRET,
      },
    }
  );
  return response.data.access_token;
}

app.post('/verify-payment', async (req, res) => {
  const { paymentID, email } = req.body;
  if (!paymentID || !email) {
    return res.status(400).json({ error: 'Missing paymentID or email' });
  }
  try {
    const token = await getAccessToken();
    const response = await axios.get(`https://api.paypal.com/v2/checkout/orders/${paymentID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const order = response.data;
    if (order.status === 'COMPLETED') {
      db.run('INSERT OR REPLACE INTO subscriptions (email, subscribed) VALUES (?, ?)', [email, 1], (err) => {
        if (err) {
          console.error('DB error:', err);
          return res.status(500).json({ error: 'DB error' });
        }
        res.json({ verified: true });
      });
    } else {
      res.json({ verified: false, status: order.status });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error verifying payment' });
  }
});

app.post('/check-subscription', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  db.get('SELECT subscribed FROM subscriptions WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ subscribed: row && row.subscribed === 1 });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});