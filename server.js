const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 8000;

// Define the time ranges for broadcasting updates
const TIME_RANGES = [
  [0, 20], [90, 110], [190, 210], [290, 310],
  [390, 410], [490, 510], [590, 610], [690, 710],
  [790, 810], [890, 910]
];

// Function to check if milliseconds fall within defined ranges
function isInRanges(milliseconds) {
  return TIME_RANGES.some(([start, end]) => milliseconds >= start && milliseconds <= end);
}

// Function to broadcast time updates to subscribed clients
function sendTimeUpdates() {
  let lastSentTime = null;
  
  setInterval(() => {
    const currentTime = new Date();
    const milliseconds = currentTime.getMilliseconds();

    if (isInRanges(milliseconds)) {
      if (!lastSentTime || currentTime - lastSentTime > 50) {
        const truncatedMilliseconds = Math.round(milliseconds / 100);
        const formattedTime = currentTime.toISOString().slice(0, -5) + `.${truncatedMilliseconds}Z`;

        const broadcastMessage = `Current UTC time: ${formattedTime}`;
        io.emit('message', broadcastMessage);  // Send message to all connected clients

        lastSentTime = currentTime;
      }
    }
  }, 1);  // Check every millisecond
}

// Serve the client HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server and the periodic task for sending time updates
server.listen(port, () => {
  console.log(`App listening on port ${port}`);
  sendTimeUpdates();  // Start sending time updates when the server starts
});
