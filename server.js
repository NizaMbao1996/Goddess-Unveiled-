const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sample list of access codes embedded directly into the server
const accessCodes = new Set([
  'A1B2C3',
  'D4E5F6',
  'G7H8I9',
  'J0K1L2',
  'M3N4O5',
  'P6Q7R8',
  'S9T0U1',
  'V2W3X4',
  'Y5Z6A7',
  'B8C9D0',
  // Add more codes as needed
]);

// Serve the subscription page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Subscribe</title>
      </head>
      <body>
        <h1>Subscribe to Access</h1>
        <form id="subscribeForm">
          <input type="text" id="code" placeholder="Enter your access code" required />
          <button type="submit">Subscribe</button>
        </form>
        <div id="result"></div>

        <script>
          document.getElementById('subscribeForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const code = document.getElementById('code').value.trim();

            fetch('/validate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ code: code })
            })
            .then(res => res.json())
            .then(data => {
              const resultDiv = document.getElementById('result');
              if (data.valid) {
                resultDiv.innerHTML = '<p style="color:green;">Access granted! Welcome.</p>';
                // You can redirect or show protected content here
              } else {
                resultDiv.innerHTML = '<p style="color:red;">Invalid access code. Please try again.</p>';
              }
            })
            .catch(err => {
              console.error('Error:', err);
            });
          });
        </script>
      </body>
    </html>
  `);
});

// Endpoint to validate access code
app.post('/validate', (req, res) => {
  const userCode = req.body.code.trim().toUpperCase();

  if (accessCodes.has(userCode)) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});