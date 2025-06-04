// Import required modules
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Initialize Express app
const app = express();
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON request bodies

const PORT = 3001; // Server port

// Initialize SQLite database
const db = new sqlite3.Database('./subscriptions.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    // Create subscriptions table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      subscribed INTEGER NOT NULL DEFAULT 0
    )`);
  }
});

// PayPal credentials
const PAYPAL_CLIENT_ID = 'ATpsCBlDpSgM89hJ2UEieyCFWzG71HBfchFSlY_7JP1mGnpx5Ek9Gk0UpaHo31Md7wfmA3Li_a1KtvK6';
const PAYPAL_SECRET = 'EPpJ1Y2ymkvp0poTQBJUo4RPK8WQCbQtDLL673zunxU5-gyPKrHHXFOyXz1JaqOXRVna1WuvUJl4xKQd';

// Function to get PayPal access token
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

// Route to verify PayPal payment
app.post('/verify-payment', async (req, res) => {
  const { paymentID, email } = req.body;

  // Validate request data
  if (!paymentID || !email) {
    return res.status(400).json({ error: 'Missing paymentID or email' });
  }

  try {
    // Obtain PayPal access token
    const token = await getAccessToken();

    // Retrieve order details from PayPal
    const response = await axios.get(`https://api.paypal.com/v2/checkout/orders/${paymentID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const order = response.data;

    // Check if payment is completed
    if (order.status === 'COMPLETED') {
      // Store subscription in database
      db.run(
        'INSERT OR REPLACE INTO subscriptions (email, subscribed) VALUES (?, ?)',
        [email, 1],
        (err) => {
          if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ error: 'DB error' });
          }
          res.json({ verified: true });
        }
      );
    } else {
      res.json({ verified: false, status: order.status });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error verifying payment' });
  }
});

// Route to check subscription status
app.post('/check-subscription', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  // Retrieve subscription status from database
  db.get('SELECT subscribed FROM subscriptions WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    // Respond with subscription status (true/false)
    res.json({ subscribed: row && row.subscribed === 1 });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});