const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { PORT, FRONTEND_URL } = require('./src/config/env');
const initializeSocket = require('./src/services/socketService');

connectDB().then(() => {
  // Create HTTP server from Express app
  const server = http.createServer(app);

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Make io available to Express routes via req.app.get('io')
  app.set('io', io);

  // Initialize socket event handlers
  initializeSocket(io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.io ready for connections`);
  });
});