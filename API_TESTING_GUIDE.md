# 🧪 API Testing Guide

## Prerequisites
- Backend server running on `http://localhost:5000`
- MongoDB connected
- Use `curl` or Postman

---

## 1️⃣ Authentication Endpoints

### Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "Team Member"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Team Member"
  }
}
```

---

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Save the token for next requests!** You'll need it.

---

## 2️⃣ Project Endpoints

### Create a Project
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "My Awesome Project",
    "description": "A project management system"
  }'
```

**Replace `YOUR_TOKEN_HERE` with the token from login!**

---

### Get All Projects
```bash
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Get Single Project
```bash
curl -X GET http://localhost:5000/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `PROJECT_ID` with the id from create response.

---

### Update Project
```bash
curl -X PUT http://localhost:5000/api/projects/PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Updated Project Name",
    "description": "Updated description"
  }'
```

---

## 3️⃣ Task Endpoints

### Create a Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Fix login bug",
    "description": "The login page has a bug",
    "project": "PROJECT_ID",
    "status": "todo",
    "priority": "High",
    "dueDate": "2025-12-25",
    "estimatedHours": 5
  }'
```

---

### Get All Tasks for a Project
```bash
curl -X GET http://localhost:5000/api/tasks/project/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Update Task
```bash
curl -X PUT http://localhost:5000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Updated task title",
    "priority": "Critical",
    "status": "inprogress"
  }'
```

---

### Move Task (Drag & Drop)
```bash
curl -X PUT http://localhost:5000/api/tasks/TASK_ID/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "toStatus": "review",
    "newOrder": 2
  }'
```

**Status values:** `todo`, `inprogress`, `review`, `done`

---

### Delete Task
```bash
curl -X DELETE http://localhost:5000/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 4️⃣ Sprint Endpoints

### Create Sprint
```bash
curl -X POST http://localhost:5000/api/sprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Sprint 1",
    "project": "PROJECT_ID",
    "startDate": "2025-12-20",
    "endDate": "2025-12-27",
    "goal": "Complete user authentication"
  }'
```

---

### Get Sprints for Project
```bash
curl -X GET http://localhost:5000/api/sprints/project/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Get Burndown Chart
```bash
curl -X GET http://localhost:5000/api/sprints/SPRINT_ID/burndown \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 5️⃣ Time Tracking Endpoints

### Start Timer
```bash
curl -X POST http://localhost:5000/api/time-logs/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "task": "TASK_ID",
    "description": "Working on login page"
  }'
```

---

### Stop Timer
```bash
curl -X PUT http://localhost:5000/api/time-logs/TIME_LOG_ID/stop \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Get Task Time Logs
```bash
curl -X GET http://localhost:5000/api/time-logs/task/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 6️⃣ Comments Endpoint

### Add Comment
```bash
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "task": "TASK_ID",
    "content": "Great progress on this task!"
  }'
```

---

### Get Task Comments
```bash
curl -X GET http://localhost:5000/api/comments/task/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 7️⃣ Activity Feed

### Get Project Activity
```bash
curl -X GET http://localhost:5000/api/activity/project/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 8️⃣ Team Members

### Add Member to Project
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "userId": "USER_ID",
    "role": "Team Member"
  }'
```

**Role values:** `Admin`, `Project Manager`, `Team Member`

---

### Remove Member
```bash
curl -X DELETE http://localhost:5000/api/projects/PROJECT_ID/members/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🧠 Complete Testing Workflow

### Step 1: Register User #1
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@test.com",
    "password": "password123"
  }'
```
**Save this token as `TOKEN1`**

---

### Step 2: Register User #2
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob",
    "email": "bob@test.com",
    "password": "password123"
  }'
```
**Save this token as `TOKEN2` and User ID as `BOB_ID`**

---

### Step 3: Create Project (as Alice)
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN1" \
  -d '{
    "name": "E-Commerce App",
    "description": "Building an online store"
  }'
```
**Save Project ID as `PROJECT_ID`**

---

### Step 4: Add Bob to Project (as Alice)
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN1" \
  -d '{
    "userId": "BOB_ID",
    "role": "Team Member"
  }'
```

---

### Step 5: Create Tasks (as Alice)
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN1" \
  -d '{
    "title": "Design homepage",
    "description": "Create homepage UI mockup",
    "project": "PROJECT_ID",
    "priority": "High",
    "estimatedHours": 8
  }'
```
**Save Task ID as `TASK_ID`**

---

### Step 6: Create Sprint
```bash
curl -X POST http://localhost:5000/api/sprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN1" \
  -d '{
    "name": "Sprint 1 - MVP",
    "project": "PROJECT_ID",
    "startDate": "2025-12-20",
    "endDate": "2025-12-27",
    "goal": "Complete basic features"
  }'
```
**Save Sprint ID as `SPRINT_ID`**

---

### Step 7: Assign Task to Bob
```bash
curl -X PUT http://localhost:5000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN1" \
  -d '{
    "assignee": "BOB_ID"
  }'
```

---

### Step 8: Bob Adds Comment
```bash
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN2" \
  -d '{
    "task": "TASK_ID",
    "content": "I can start on this tomorrow"
  }'
```

---

### Step 9: Bob Starts Timer
```bash
curl -X POST http://localhost:5000/api/time-logs/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN2" \
  -d '{
    "task": "TASK_ID",
    "description": "Started working on homepage design"
  }'
```

---

### Step 10: Move Task to In Progress
```bash
curl -X PUT http://localhost:5000/api/tasks/TASK_ID/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN1" \
  -d '{
    "toStatus": "inprogress"
  }'
```

---

## 🔍 Using Postman (Optional)

1. Download Postman from https://www.postman.com/downloads/
2. Create new request
3. Set method to POST/GET/PUT/DELETE
4. Set URL to `http://localhost:5000/api/...`
5. Add header: `Authorization: Bearer YOUR_TOKEN`
6. Add JSON body
7. Click Send

---

## ✅ Success Indicators

- ✅ All requests return `"success": true`
- ✅ Get token from register/login
- ✅ Can create projects, tasks, sprints
- ✅ Real-time WebSocket events fire
- ✅ Activity logs appear in feed

---

**Happy Testing! 🚀**
