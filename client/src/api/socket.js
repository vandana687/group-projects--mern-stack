import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (!socket) {
    socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinProject = (projectId) => {
  if (socket) {
    socket.emit('join_project', projectId);
  }
};

export const leaveProject = (projectId) => {
  if (socket) {
    socket.emit('leave_project', projectId);
  }
};

export const emitTaskCreated = (projectId, task) => {
  if (socket) {
    socket.emit('task_created', { projectId, task });
  }
};

export const emitTaskUpdated = (projectId, task, changes) => {
  if (socket) {
    socket.emit('task_updated', { projectId, task, changes });
  }
};

export const emitTaskMoved = (projectId, taskId, fromStatus, toStatus, newOrder) => {
  if (socket) {
    socket.emit('task_moved', { projectId, taskId, fromStatus, toStatus, newOrder });
  }
};

export const emitTaskDeleted = (projectId, taskId) => {
  if (socket) {
    socket.emit('task_deleted', { projectId, taskId });
  }
};

export const emitCommentAdded = (projectId, taskId, comment) => {
  if (socket) {
    socket.emit('comment_added', { projectId, taskId, comment });
  }
};

export const emitFileUploaded = (projectId, taskId, file) => {
  if (socket) {
    socket.emit('file_uploaded', { projectId, taskId, file });
  }
};

export const emitTypingStart = (projectId, taskId) => {
  if (socket) {
    socket.emit('typing_start', { projectId, taskId });
  }
};

export const emitTypingStop = (projectId, taskId) => {
  if (socket) {
    socket.emit('typing_stop', { projectId, taskId });
  }
};

export const emitSprintUpdated = (projectId, sprint, action) => {
  if (socket) {
    socket.emit('sprint_updated', { projectId, sprint, action });
  }
};

export const emitTimerStarted = (projectId, taskId, timeLog) => {
  if (socket) {
    socket.emit('timer_started', { projectId, taskId, timeLog });
  }
};

export const emitTimerStopped = (projectId, taskId, timeLog) => {
  if (socket) {
    socket.emit('timer_stopped', { projectId, taskId, timeLog });
  }
};
