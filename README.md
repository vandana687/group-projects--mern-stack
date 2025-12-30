# Real-Time Project Management System

A full-stack MERN (MongoDB, Express, React, Node.js) project management application with real-time collaboration features using WebSockets.

## 🚀 Features

### ✅ Implemented Features

**Backend (Complete):**
- ✅ JWT-based authentication & authorization
- ✅ Role-based access control (Admin, Project Manager, Team Member)
- ✅ Project creation & team management
- ✅ Customizable workflow stages
- ✅ Task management (CRUD operations)
- ✅ Sprint planning & management
- ✅ Burndown chart analytics
- ✅ Time tracking system
- ✅ Comment threads
- ✅ File uploads
- ✅ Activity feed
- ✅ Real-time WebSocket communication
- ✅ Database models for all entities
- ✅ API routes for all features

**Frontend (In Progress):**
- ✅ Redux store setup (auth, projects, tasks)
- ✅ Socket.IO client configuration
- ✅ API client with axios
- ⏳ Login & Register pages (need to be completed)
- ⏳ Dashboard
- ⏳ Project Board with drag-and-drop
- ⏳ Task details modal
- ⏳ Sprint view
- ⏳ Analytics charts

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🛠️ Installation

### 1. Clone or navigate to the project directory

```bash
cd "/home/vandana/Desktop/mern stack - project website"
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` file:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/project-management
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

### 5. Start MongoDB

Make sure MongoDB is running on your system:
```bash
# If using local MongoDB
sudo systemctl start mongodb
# or
mongod
```

## 🚀 Running the Application

### Development Mode (Both servers)

```bash
# From project root
npm run dev:full
```

This runs both backend (port 5000) and frontend (port 3000) concurrently.

### Individual Servers

**Backend only:**
```bash
npm run dev
```

**Frontend only:**
```bash
cd client
npm start
```

## 📁 Project Structure

```
mern-stack-project-website/
├── server/
│   ├── models/           # Mongoose models
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── Sprint.js
│   │   ├── Comment.js
│   │   ├── TimeLog.js
│   │   └── Activity.js
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── sprints.js
│   │   ├── comments.js
│   │   ├── timeLogs.js
│   │   ├── activity.js
│   │   ├── upload.js
│   │   └── users.js
│   ├── middleware/       # Custom middleware
│   │   ├── auth.js
│   │   └── permissions.js
│   ├── socket/           # WebSocket handlers
│   │   └── socketHandler.js
│   └── server.js         # Express server setup
├── client/
│   ├── src/
│   │   ├── api/          # API utilities
│   │   │   ├── axios.js
│   │   │   └── socket.js
│   │   ├── store/        # Redux store
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── projectSlice.js
│   │   │   │   └── taskSlice.js
│   │   │   └── store.js
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update profile

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:userId` - Remove member
- `PUT /api/projects/:id/workflow` - Update workflow

### Tasks
- `GET /api/tasks/project/:projectId` - Get project tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/move` - Move task (drag & drop)
- `DELETE /api/tasks/:id` - Delete task

### Sprints
- `GET /api/sprints/project/:projectId` - Get project sprints
- `POST /api/sprints` - Create sprint
- `GET /api/sprints/:id` - Get sprint details
- `PUT /api/sprints/:id` - Update sprint
- `GET /api/sprints/:id/burndown` - Get burndown chart
- `DELETE /api/sprints/:id` - Delete sprint

### Time Tracking
- `POST /api/time-logs/start` - Start timer
- `PUT /api/time-logs/:id/stop` - Stop timer
- `POST /api/time-logs/manual` - Add manual entry
- `GET /api/time-logs/task/:taskId` - Get task time logs
- `GET /api/time-logs/user/current` - Get running timer

### Comments & Activity
- `POST /api/comments` - Add comment
- `GET /api/comments/task/:taskId` - Get task comments
- `GET /api/activity/project/:projectId` - Get project activity

## 🔄 Real-Time Events (WebSocket)

The application uses Socket.IO for real-time updates:

- `join_project` - Join project room
- `task_created` - New task created
- `task_updated` - Task updated
- `task_moved` - Task moved across columns
- `task_deleted` - Task deleted
- `comment_added` - New comment
- `file_uploaded` - File attached
- `timer_started` - Timer started
- `timer_stopped` - Timer stopped
- `sprint_updated` - Sprint modified

## 🎨 Tech Stack

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- Socket.IO
- JWT Authentication
- Bcrypt
- Multer (file uploads)

**Frontend:**
- React 18+
- Redux Toolkit
- React Router v6
- Socket.IO Client
- Axios
- React Toastify
- @hello-pangea/dnd (drag & drop)
- Recharts (analytics)
- date-fns

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- WebSocket authentication
- Protected API routes
- Input validation
- CORS configuration

## 📊 System Requirements Met

✅ User authentication & authorization
✅ Role-based permissions
✅ Project & team management
✅ Customizable workflows
✅ Task management with drag-and-drop
✅ Real-time collaboration
✅ Sprint planning
✅ Burndown charts
✅ Time tracking
✅ Comments & discussions
✅ File attachments
✅ Activity logging
✅ Concurrent user handling
✅ Data consistency

## 🚧 TODO - Complete Frontend

To finish the project, you need to create/complete:

1. **Pages:**
   - Register.js (partially created)
   - Dashboard.js (partially created)
   - ProjectBoard.js with drag-and-drop
   - SprintView.js

2. **Components:**
   - TaskCard.js
   - TaskModal.js
   - CreateTaskForm.js
   - CommentSection.js
   - TimeTracker.js
   - BurndownChart.js
   - ActivityFeed.js

3. **Styling:**
   - Complete App.css
   - Component-specific styles

## 📝 License

MIT

## 👤 Author

Your Name

---

**Note:** This is a comprehensive project management system demonstrating advanced full-stack development, real-time features, and agile methodologies.
