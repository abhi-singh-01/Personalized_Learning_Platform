const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { PORT } = require('./src/config/env');
const { isOriginAllowed } = require('./src/config/corsOrigins');
const initializeSocket = require('./src/services/socketService');
const startPayoutCron = require('./src/services/payoutCron');
const startFailedPaymentRetentionCron = require('./src/services/failedPaymentRetentionCron');
const { verifySmtpOnStartup } = require('./src/services/emailOtpService');

connectDB().then(async () => {
  await verifySmtpOnStartup();
  // Create HTTP server from Express app
  const server = http.createServer(app);
  const port = Number(process.env.PORT || PORT || 5000);

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin(origin, callback) {
        callback(null, isOriginAllowed(origin));
      },
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

  startPayoutCron();
  startFailedPaymentRetentionCron();

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Socket.io ready for connections`);
  });
});