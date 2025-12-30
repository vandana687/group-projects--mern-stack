# Local Member Management - Complete Process

## Step 1: Start the Application

```bash
npm run dev:full
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

## Step 2: Register Users

Open your browser and go to **`http://localhost:3000/register`**

**Register User 1 (Alice - Project Owner):**
- Name: `Alice`
- Email: `alice@test.com`
- Password: `password123`
- Click `Register` → Auto-login
- Save this browser tab or note the session

**Register User 2 (Bob - Team Member):**
- Open a new incognito/private window
- Go to `http://localhost:3000/register`
- Name: `Bob`
- Email: `bob@test.com`
- Password: `password123`
- Click `Register` → Auto-login

**Register User 3 (Charlie - Another Team Member):**
- Open another incognito/private window
- Go to `http://localhost:3000/register`
- Name: `Charlie`
- Email: `charlie@test.com`
- Password: `password123`
- Click `Register` → Auto-login

**Now you have 3 users registered!**

## Step 3: Create a Project (as Alice)

In **Alice's tab** (`http://localhost:3000/dashboard`):
- Click **`+ Create`** button
- Project Name: `Team Project`
- Description: `Collaborative project for testing members`
- Click **Create**
- Wait for redirect to the project board

## Step 4: Add Members (as Alice - Project Owner)

On the **Project Board** page:
- Scroll down to the **"👥 Team Members"** section (below the board header)
- Click **`+ Add Member`** button

**Add Bob as Team Member:**
1. In the "Select User" dropdown, choose **Bob (bob@test.com)**
2. In the "Role" dropdown, keep **Team Member**
3. Click **Add Member**
4. ✅ Success! You'll see "✅ Member added successfully!"
5. Bob appears in the members list with a blue badge "Team Member"

**Add Charlie as Project Manager:**
1. Click **`+ Add Member`** again
2. Select **Charlie (charlie@test.com)**
3. Change role to **Project Manager**
4. Click **Add Member**
5. ✅ Charlie added with orange "Project Manager" badge

**Your Team Members section now shows:**
```
👥 Team Members (3)
[+ Add Member]

┌─────────────────────────────────────┐
│ A  Alice              Admin      ✗   │  (You can't remove owner)
├─────────────────────────────────────┤
│ B  Bob (bob@...)      Team Member    │  [Remove]
├─────────────────────────────────────┤
│ C  Charlie (ch...)    Project Mgr    │  [Remove]
└─────────────────────────────────────┘
```

## Step 5: Verify Members Can Access Project

**In Bob's tab:**
1. Go to `http://localhost:3000/dashboard`
2. You should see **"Team Project"** in your projects list
3. Click on it
4. ✅ Bob can now see the project board!

**In Charlie's tab:**
1. Go to `http://localhost:3000/dashboard`
2. You should see **"Team Project"**
3. Click on it
4. ✅ Charlie can access it too!

## Step 6: Remove a Member (as Alice)

Back in **Alice's tab** on the project board:
- In the Team Members section, find **Bob**
- Click **[Remove]** button
- Confirm: "Remove Bob from the project?"
- ✅ Bob is removed

**Check Bob's tab:**
- Go to `http://localhost:3000/dashboard`
- "Team Project" is no longer visible
- ✅ Access revoked!

**Charlie still has access** because he's a Project Manager, not removed.

## Step 7: View Activity Log (Optional)

To see all member changes that were logged:

**In Alice's tab:**
- Open DevTools (F12) → Console
- Run:
```javascript
// Fetch activity (you'd need to set TOKEN and PROJECT_ID in your app)
const TOKEN = localStorage.getItem('token');
const PROJECT_ID = window.location.pathname.split('/')[2];

fetch(`http://localhost:5000/api/activity/project/${PROJECT_ID}`, {
  headers: { 'Authorization': `Bearer ${TOKEN}` }
})
.then(r => r.json())
.then(data => console.log(data.activities))
.catch(e => console.error(e));
```

You'll see activity logs like:
```json
{
  "action": "member_added",
  "user": { "name": "Alice" },
  "details": { "addedUserId": "...", "role": "Team Member" },
  "createdAt": "2025-12-22T10:30:00Z"
}
```

## Common Scenarios

### Scenario 1: Promote Bob from Team Member to Project Manager
1. Remove Bob
2. Re-add Bob with **Project Manager** role
3. Charlie can now be removed by Bob (since he's PM)

### Scenario 2: See Real-time Updates
1. Open the project in Alice's tab
2. Open the project in Bob's tab
3. In Alice's tab, add a new member
4. Watch Bob's tab → He'll see the new member appear in real-time (WebSocket event)

### Scenario 3: User Not in Dropdown?
If you can't find a user in the "Select User" dropdown:
- They're **already a member** (get removed first to re-add)
- Or they might not exist (register them first)

## API Equivalents (if using curl instead)

**Get all users:**
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

**Add member via curl:**
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":"USER_ID","role":"Team Member"}'
```

**Remove member via curl:**
```bash
curl -X DELETE http://localhost:5000/api/projects/PROJECT_ID/members/USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Add Member" button doesn't appear | Page didn't load the component. Refresh the project board. |
| "All users are already members" | Remove someone first, or register another user. |
| Can't remove the project owner | Expected! Only admins can remove owners (not implemented in basic view). |
| Bob can't see the project after being added | Bob might need to refresh `http://localhost:3000/dashboard`. |
| Getting "Access denied" when adding members | You're not the owner/PM. Only project owners/PMs can manage members. |

---

**Now you can fully manage team members on localhost!** 🎉
