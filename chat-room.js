// Replace with your WebSocket server URL
const WEBSOCKET_URL = 'ws://yourserver.com:port';

let ws;
let username = 'User' + Math.floor(Math.random() * 1000);
let connected = false;

function initChatConnection() {
  ws = new WebSocket(WEBSOCKET_URL);
  ws.onopen = () => {
    connected = true;
    console.log('Connected to chat server.');
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    displayMessage(data);
  };
  ws.onclose = () => {
    console.log('Disconnected from chat server.');
  };
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('messageInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function displayMessage(data) {
  const messagesDiv = document.getElementById('messages');
  const { sender, text, timestamp } = data;
  const msgDiv = document.createElement('div');
  msgDiv.className='message';
  const timeStr = new Date(timestamp).toLocaleTimeString();
  msgDiv.innerHTML = `<span>[${timeStr}] ${sender}:</span> ${text}`;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (text && connected) {
    const message = { sender: username, text: text, timestamp: Date.now() };
    ws.send(JSON.stringify(message));
    input.value='';
  }
}