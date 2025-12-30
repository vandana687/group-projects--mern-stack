const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Store active socket connections
const activeConnections = new Map(); // userId -> Set of socket IDs
const projectRooms = new Map(); // projectId -> Set of socket IDs

const socketHandler = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.id})`);

    // Track active connection
    if (!activeConnections.has(socket.userId)) {
      activeConnections.set(socket.userId, new Set());
    }
    activeConnections.get(socket.userId).add(socket.id);

    // Join project room
    socket.on('join_project', (projectId) => {
      socket.join(`project:${projectId}`);
      
      // Track project room membership
      if (!projectRooms.has(projectId)) {
        projectRooms.set(projectId, new Set());
      }
      projectRooms.get(projectId).add(socket.id);

      console.log(`👥 ${socket.user.name} joined project: ${projectId}`);
      
      // Notify others in the project
      socket.to(`project:${projectId}`).emit('user_joined', {
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date()
      });
    });

    // Leave project room
    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`);
      
      if (projectRooms.has(projectId)) {
        projectRooms.get(projectId).delete(socket.id);
      }

      console.log(`👋 ${socket.user.name} left project: ${projectId}`);
      
      socket.to(`project:${projectId}`).emit('user_left', {
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date()
      });
    });

    // Task created
    socket.on('task_created', (data) => {
      socket.to(`project:${data.projectId}`).emit('task_created', {
        task: data.task,
        user: {
          id: socket.userId,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // Task updated
    socket.on('task_updated', (data) => {
      socket.to(`project:${data.projectId}`).emit('task_updated', {
        task: data.task,
        changes: data.changes,
        user: {
          id: socket.userId,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // Task moved (drag and drop)
    socket.on('task_moved', (data) => {
      socket.to(`project:${data.projectId}`).emit('task_moved', {
        taskId: data.taskId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        newOrder: data.newOrder,
        user: {
          id: socket.userId,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // Task deleted
    socket.on('task_deleted', (data) => {
      socket.to(`project:${data.projectId}`).emit('task_deleted', {
        taskId: data.taskId,
        user: {
          id: socket.userId,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // Comment added
    socket.on('comment_added', (data) => {
      socket.to(`project:${data.projectId}`).emit('comment_added', {
        comment: data.comment,
        taskId: data.taskId,
        user: {
          id: socket.userId,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // File uploaded
    socket.on('file_uploaded', (data) => {
      socket.to(`project:${data.projectId}`).emit('file_uploaded', {
        file: data.file,
        taskId: data.taskId,
        user: {
          id: socket.userId,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // User typing indicator
    socket.on('typing_start', (data) => {
      socket.to(`project:${data.projectId}`).emit('typing_start', {
        taskId: data.taskId,
        user: {
          id: socket.userId,
          name: socket.user.name
        }
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`project:${data.projectId}`).emit('typing_stop', {
        taskId: data.taskId,
        userId: socket.userId
      });
    });

    // Sprint created/updated
    socket.on('sprint_updated', (data) => {
      socket.to(`project:${data.projectId}`).emit('sprint_updated', {
        sprint: data.sprint,
        action: data.action,
        user: {
          id: socket.userId,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // Time tracking
    socket.on('timer_started', (data) => {
      socket.to(`project:${data.projectId}`).emit('timer_started', {
        taskId: data.taskId,
        timeLog: data.timeLog,
        user: {
          id: socket.userId,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    socket.on('timer_stopped', (data) => {
      socket.to(`project:${data.projectId}`).emit('timer_stopped', {
        taskId: data.taskId,
        timeLog: data.timeLog,
        user: {
          id: socket.userId,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name} (${socket.id})`);

      // Clean up active connections
      if (activeConnections.has(socket.userId)) {
        activeConnections.get(socket.userId).delete(socket.id);
        if (activeConnections.get(socket.userId).size === 0) {
          activeConnections.delete(socket.userId);
        }
      }

      // Clean up project rooms
      projectRooms.forEach((sockets, projectId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          socket.to(`project:${projectId}`).emit('user_left', {
            userId: socket.userId,
            userName: socket.user.name,
            timestamp: new Date()
          });
        }
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Helper function to emit to specific project
  io.emitToProject = (projectId, event, data) => {
    io.to(`project:${projectId}`).emit(event, data);
  };

  // Helper function to get active users in a project
  io.getProjectUsers = (projectId) => {
    const room = io.sockets.adapter.rooms.get(`project:${projectId}`);
    return room ? Array.from(room) : [];
  };

  console.log('🔌 Socket.IO handler initialized');
};

module.exports = socketHandler;
