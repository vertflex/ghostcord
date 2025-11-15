const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let users = {};
let messages = [];

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.emit('users', Object.values(users));
  socket.emit('messages', messages.slice(-50));

  socket.on('join', (name) => {
    users[socket.id] = { id: socket.id, name, online: true };
    io.emit('users', Object.values(users));
    io.emit('status', `${name} joined the chat`);
  });

  socket.on('message', (text) => {
    const user = users[socket.id];
    if (user) {
      const msg = {
        name: user.name,
        text,
        time: new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
      };
      messages.push(msg);
      if (messages.length > 100) messages.shift();
      io.emit('message', msg);
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      delete users[socket.id];
      io.emit('users', Object.values(users));
      io.emit('status', `${user.name} left the chat`);
    }
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`GHOSTCORD IS LIVE!`);
  console.log(`Open in browser: http://localhost:${PORT}`);
  console.log(`Share with friends: http://192.168.1.250:${PORT}`);
});