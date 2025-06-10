// Assume this script runs on the chat room page

// Set of valid access codes (for demonstration, include your full list here)
const validAccessCodes = new Set([
  'A1B2C3',
  'D4E5F6',
  'G7H8I9',
  'J0K1L2',
  'M3N4O5',
  // Add all your codes here
]);

// Function to check if user has paid (simulate with a flag or check session storage)
function hasPaid() {
  // Example: check session storage or a cookie
  return sessionStorage.getItem('paymentStatus') === 'paid';
}

// Function to prompt for access code
function promptAccessCode() {
  const userCode = prompt('Please enter your access code:');
  if (userCode) {
    validateAccessCode(userCode.trim().toUpperCase());
  } else {
    alert('Access code is required to enter the chat room.');
  }
}

// Function to validate access code
function validateAccessCode(code) {
  if (validAccessCodes.has(code)) {
    // Access granted, initialize chat
    sessionStorage.setItem('accessGranted', 'true');
    loadChat();
  } else {
    alert('Invalid access code. Please try again.');
    promptAccessCode(); // Retry
  }
}

// Function to load chat interface
function loadChat() {
  document.body.innerHTML = `
    <h2>Welcome to the Chat Room</h2>
    <div id="chatBox" style="border:1px solid #ccc; height:300px; overflow-y:auto; padding:10px;">
      <!-- Chat messages will appear here -->
    </div>
    <input type="text" id="messageInput" placeholder="Type your message..." style="width:80%;"/>
    <button id="sendBtn">Send</button>
  `;

  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

// Function to send a message
function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  if (message) {
    const chatBox = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.textContent = 'You: ' + message;
    chatBox.appendChild(msgDiv);
    input.value = '';

    // TODO: Send message to server or broadcast to chat participants
  }
}

// Initialize on page load
window.onload = function() {
  if (!hasPaid()) {
    alert('Please complete your payment before accessing the chat room.');
    // Redirect to payment page or show payment instructions
    window.location.href = '/payment'; // Replace with your payment URL
    return;
  }

  // Check if access has already been granted
  if (sessionStorage.getItem('accessGranted') === 'true') {
    loadChat();
  } else {
    // Prompt for access code
    promptAccessCode();
  }
};