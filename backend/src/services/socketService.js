const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');
const LiveClass = require('../models/LiveClass');

function initializeSocket(io) {
  // Middleware: authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket] User connected: ${socket.user.name} (${userId})`);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // ─── Live Class Events ───

    // Join a live class room
    socket.on('room:join', async ({ roomId }) => {
      try {
        const liveClass = await LiveClass.findOne({ roomId, status: 'live' });
        if (!liveClass) {
          socket.emit('error', { message: 'Live class not found or not active' });
          return;
        }

        socket.join(`room:${roomId}`);
        socket.currentRoom = roomId;

        // Broadcast to room that someone joined
        socket.to(`room:${roomId}`).emit('room:user-joined', {
          userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
          role: socket.user.role,
        });

        console.log(`[Socket] ${socket.user.name} joined room ${roomId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave a live class room
    socket.on('room:leave', ({ roomId }) => {
      socket.leave(`room:${roomId}`);
      socket.currentRoom = null;

      socket.to(`room:${roomId}`).emit('room:user-left', {
        userId,
        name: socket.user.name,
      });

      console.log(`[Socket] ${socket.user.name} left room ${roomId}`);
    });

    // Chat message in live class
    socket.on('chat:send', async ({ roomId, message }) => {
      if (!message || !message.trim()) return;

      const chatMsg = {
        user: userId,
        userName: socket.user.name,
        avatar: socket.user.avatar,
        message: message.trim(),
        timestamp: new Date(),
        role: socket.user.role,
      };

      // Broadcast to room
      io.to(`room:${roomId}`).emit('chat:message', chatMsg);

      // Persist to DB (fire-and-forget)
      LiveClass.findOneAndUpdate(
        { roomId },
        {
          $push: {
            chatMessages: {
              user: userId,
              userName: socket.user.name,
              message: message.trim(),
              timestamp: new Date(),
            },
          },
        }
      ).catch(err => console.error('[Socket] Chat save error:', err.message));
    });

    // Raise hand (learner feature)
    socket.on('room:raise-hand', ({ roomId }) => {
      io.to(`room:${roomId}`).emit('room:hand-raised', {
        userId,
        name: socket.user.name,
      });
    });

    // Lower hand
    socket.on('room:lower-hand', ({ roomId }) => {
      io.to(`room:${roomId}`).emit('room:hand-lowered', {
        userId,
        name: socket.user.name,
      });
    });

    // Educator: toggle chat
    socket.on('room:toggle-chat', async ({ roomId, enabled }) => {
      if (socket.user.role !== 'educator' && socket.user.role !== 'admin') return;

      await LiveClass.findOneAndUpdate({ roomId }, { chatEnabled: enabled });
      io.to(`room:${roomId}`).emit('room:chat-toggled', { enabled });
    });

    // ─── Typing indicator ───
    socket.on('chat:typing', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('chat:typing', {
        userId,
        name: socket.user.name,
      });
    });

    // ─── Disconnect ───
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user.name}`);

      // If was in a room, notify
      if (socket.currentRoom) {
        socket.to(`room:${socket.currentRoom}`).emit('room:user-left', {
          userId,
          name: socket.user.name,
        });
      }
    });
  });

  console.log('[Socket.io] Initialized successfully');
}

module.exports = initializeSocket;
