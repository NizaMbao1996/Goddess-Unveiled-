const express = require('express');
const session = require('express-session');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = 3000;

// Store all access codes in the source code
const accessCodes = new Set([
  'A1B2C3', 'D4E5F6', 'G7H8I9', 'J0K1L2', 'M3N4O5', 'P6Q7R8', 'S9T0U1', 'V2W3X4', 'Y5Z6A7', 'B8C9D0',
  'E1F2G3', 'H4I5J6', 'K7L8M9', 'N0O1P2', 'Q3R4S5', 'T6U7V8', 'W9X0Y1', 'Z2A3B4', 'C5D6E7', 'F8G9H0',
  'I1J2K3', 'L4M5N6', 'O7P8Q9', 'R0S1T2', 'U3V4W5', 'X6Y7Z8', 'A9B0C1', 'D2E3F4', 'G5H6I7', 'J8K9L0',
  'M1N2O3', 'P4Q5R6', 'S7T8U9', 'V0W1X2', 'Y3Z4A5', 'B6C7D8', 'E9F0G1', 'H2I3J4', 'K5L6M7', 'N8O9P0',
  'Q1R2S3', 'T4U5V6', 'W7X8Y9', 'Z0A1B2', 'C3D4E5', 'F6G7H8', 'I9J0K1', 'L2M3N4', 'O5P6Q7', 'R8S9T0',
  'U1V2W3', 'X4Y5Z6', 'A7B8C9', 'D0E1F2', 'G3H4I5', 'J6K7L8', 'M9N0O1', 'P2Q3R4', 'S5T6U7', 'V8W9X0',
  'Y1Z2A3', 'B4C5D6', 'E7F8G9', 'H0I1J2', 'K3L4M5', 'N6O7P8', 'Q9R0S1', 'T2U3V4', 'W5X6Y7', 'Z8A9B0',
  'C1D2E3', 'F4G5H6', 'I7J8K9', 'L0M1N2', 'O3P4Q5', 'R6S7T8', 'U9V0W1', 'X2Y3Z4', 'A5B6C7', 'D8E9F0',
  'G1H2I3', 'J4K5L6', 'M7N8O9', 'P0Q1R2', 'S3T4U5', 'V6W7X8', 'Y9Z0A1', 'B2C3D4', 'E5F6G7', 'H8I9J0',
  'K1L2M3', 'N4O5P6', 'Q7R8S9', 'T0U1V2', 'W3X4Y5', 'Z6A7B8', 'C9D0E1', 'F2G3H4', 'I5J6K7', 'L8M9N0',
  'O1P2Q3', 'R4S5T6', 'U7V8W9', 'X0Y1Z2', 'A3B4C5', 'D6E7F8', 'G9H0I1', 'J2K3L4', 'M5N6O7', 'P8Q9R0',
  'S1T2U3', 'V4W5X6', 'Y7Z8A9', 'B0C1D2', 'E3F4G5', 'H6I7J8', 'K9L0M1', 'N2O3P4', 'Q5R6S7', 'T8U9V0',
  'W1X2Y3', 'Z4A5B6', 'C7D8E9', 'F0G1H2', 'I3J4K5', 'L6M7N8', 'O9P0Q1', 'R2S3T4', 'U5V6W7', 'X8Y9Z0'
]);

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true if using HTTPS
}));

// Serve static files if needed
// app.use(express.static('public'));

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.session.isVerified) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Main page
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to the Site</h1>
    <p><a href="/login">Access Chat & Gallery (Login)</a></p>
  `);
});

// Login page
app.get('/login', (req, res) => {
  res.send(`
    <h2>Enter Access Code</h2>
    <form method="POST" action="/verify-code">
      <input type="text" name="code" placeholder="Access Code" required />
      <button type="submit">Verify</button>
    </form>
  `);
});

// Verify access code
app.post('/verify-code', (req, res) => {
  const code = req.body.code ? req.body.code.trim().toUpperCase() : '';
  if (accessCodes.has(code)) {
    req.session.isVerified = true;
    res.redirect('/dashboard');
  } else {
    res.send(`
      <p>Invalid access code. <a href="/login">Try again</a></p>
    `);
  }
});

// Dashboard
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.send(`
    <h2>Welcome to the Protected Area</h2>
    <p><a href="/chat">Go to Chat Room</a></p>
    <p><a href="/gallery">Go to Gallery</a></p>
    <p><a href="/logout">Logout</a></p>
  `);
});

// Chat Room with Socket.IO
app.get('/chat', ensureAuthenticated, (req, res) => {
  res.send(`
    <h2>Chat Room</h2>
    <div id="chatBox" style="border:1px solid #ccc; height:300px; overflow-y:auto; padding:10px;"></div>
    <input type="text" id="messageInput" placeholder="Type your message..." style="width:80%;" />
    <button id="sendBtn">Send</button>
    <script src="/socket.io/socket.io.js"></script>
    <script>
      const socket = io();
      const chatBox = document.getElementById('chatBox');
      const messageInput = document.getElementById('messageInput');
      const sendBtn = document.getElementById('sendBtn');

      socket.on('chat message', function(msg){
        const msgDiv = document.createElement('div');
        msgDiv.textContent = msg;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
      });

      document.getElementById('sendBtn').addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
          socket.emit('chat message', message);
          messageInput.value = '';
        }
      });

      document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          document.getElementById('sendBtn').click();
        }
      });
    </script>
    <p><a href="/dashboard">Back to Dashboard</a></p>
  `);
});

// Gallery page
app.get('/gallery', ensureAuthenticated, (req, res) => {
  res.send(`
    <h2>Gallery Page</h2>
    <p>Gallery content goes here.</p>
    <p><a href="/dashboard">Back to Dashboard</a></p>
  `);
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Socket.IO connection
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});