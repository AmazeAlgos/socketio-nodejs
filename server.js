const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 8000;

const TIME_RANGES = [
  [0, 20], [90, 110], [190, 210], [290, 310], 
  [390, 410], [490, 510], [590, 610], [690, 710], 
  [790, 810], [890, 910]
];

class ConnectionManager {
  constructor() {
    this.subscriptions = [];
  }

  handleSubscription(socket, message) {
    if (message.action === 'subscribe' && message.channel === 'time_updates') {
      if (!this.subscriptions.includes(socket)) {
        this.subscriptions.push(socket);
        socket.emit('message', 'Subscribed to time_updates');
      }
    }
  }

  disconnect(socket) {
    this.subscriptions = this.subscriptions.filter(sub => sub !== socket);
  }
}

const manager = new ConnectionManager();

function isInRanges(milliseconds) {
  return TIME_RANGES.some(([start, end]) => milliseconds >= start && milliseconds <= end);
}

function sendTimeUpdates() {
  let lastSentTime = null;

  setInterval(() => {
    const currentTime = new Date();
    const milliseconds = currentTime.getMilliseconds();

    if (isInRanges(milliseconds)) {
      if (!lastSentTime || currentTime - lastSentTime > 50) {
        const truncatedMilliseconds = Math.round(milliseconds / 100);
        const formattedTime = currentTime.toISOString().replace(/\.\d+Z$/, `.${truncatedMilliseconds}Z`);
        const broadcastMessage = `Current UTC time: ${formattedTime}`;

        // Emit time updates to subscribed clients
        manager.subscriptions.forEach(socket => {
          socket.emit('message', broadcastMessage);
        });

        lastSentTime = currentTime;
      }
    }
  }, 1); // Check every 1 ms
}

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('message', (msg) => {
    const message = JSON.parse(msg);
    manager.handleSubscription(socket, message);
  });

  socket.on('disconnect', () => {
    manager.disconnect(socket);
    console.log('Client disconnected');
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
  console.log(`App listening on port ${port}`);
  sendTimeUpdates(); // Start the periodic task when server starts
});
