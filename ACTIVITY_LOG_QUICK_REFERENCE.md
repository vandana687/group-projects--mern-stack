# 🚀 Activity Log - Quick Reference Guide

## **At a Glance**

| Feature | Purpose | How to Access |
|---------|---------|---------------|
| **Comments** | Team discussion on tasks | Click task → scroll to comments |
| **Team Changes** | Track member additions/removals | Click "Team" sidebar button |
| **Activity Log** | View all project activities | Click "Logs" button in header |
| **Real-time** | Instant updates | Socket.IO connection |

---

## **Comments Tracking**

### **When logged:**
- Someone posts a comment on a task
- Someone replies to a comment
- Someone mentions another user (@mention)

### **What's recorded:**
```
✏️ Who commented: User name + avatar
📝 Content: The actual comment text
🎯 Where: Which task
⏰ When: Timestamp (e.g., "2h ago")
```

### **View in Activity Log:**
Filter → "Comments" tab → See all comment activities

### **Example Log Entry:**
```
💬 Sarah Johnson added comment on "API Integration"
   Just now
   
   "I can handle the authentication part"
```

---

## **Team Changes Tracking**

### **When logged:**
- Admin/Manager adds a new member
- Admin/Manager removes a member
- Role is changed
- Member leaves project

### **What's recorded:**
```
👥 Who made change: Admin/Manager name
➕ Action: Added / Removed
👤 Member affected: Their name + email
🔐 Role: Team Member / Manager / Admin
⏰ When: Timestamp
```

### **View in Activity Log:**
Filter → "Team Changes" tab → See all member activities

### **Example Log Entry:**
```
👥 Vandana added Sarah Johnson to the team
   1 day ago
   
   Role: Team Member
```

---

## **How to Use Activity Log**

### **Step 1: Open Activity Log**
```
1. Click "Logs" button in ProjectBoard header
2. Sidebar slides in from right
3. See all project activities
```

### **Step 2: Filter Activities**
```
Click filter tabs:
├─ 📊 All Activities (everything)
├─ ➕ Tasks Created
├─ ✏️ Tasks Updated
├─ 💬 Comments (all comment activities)
└─ 👥 Team Changes (member additions/removals)
```

### **Step 3: View Details**
```
Each activity shows:
├─ Icon (color-coded by type)
├─ User name + avatar
├─ Action description
├─ Timestamp (relative like "5m ago")
├─ Related item (task, comment, etc)
└─ Optional details (status changes, etc)
```

### **Step 4: Pagination**
```
├─ 20 activities per page
├─ Click "Next" for more
├─ Click "Previous" to go back
└─ "Page X" shows current position
```

---

## **Quick Answers**

### **"How do I see who commented on tasks?"**
```
1. Click "Logs" button
2. Filter by "Comments"
3. See all comment activities with names
```

### **"How do I track team changes?"**
```
1. Click "Logs" button
2. Filter by "Team Changes"
3. See all member additions/removals
4. See when each person joined
```

### **"How do I know what Sarah has been doing?"**
```
1. Click "Logs" button
2. Look for activities by Sarah (user avatar/name)
3. See all her comments, tasks, changes
4. Hover over to see full details
```

### **"When did we decide to use REST API?"**
```
1. Click "Logs" button
2. Filter by "Comments"
3. Search for "REST" or "API"
4. Read the discussion thread
```

### **"Who is responsible for this task?"**
```
1. Click on the task
2. See "Assigned to" field
3. Or check Activity Log for task creation
4. See who created it
```

---

## **Color Codes & Icons**

### **Activity Types:**
```
✏️ Red text     = Task Created        (New task)
✏️ Blue text    = Task Updated        (Modified)
↔️ Orange text  = Task Moved          (Status changed)
💬 Purple text  = Comment Added       (Discussion)
👥 Cyan text    = Member Added        (Team growth)
👤 Red text     = Member Removed      (Team change)
📁 Green text   = File Uploaded       (Attachment)
⏱️ Blue text    = Time Logged         (Hours tracked)
```

### **Priority Colors (on tasks):**
```
🔴 Red         = Critical priority
🟠 Orange      = High priority
🔵 Blue        = Medium priority
⚪ Gray        = Low priority
```

---

## **Real-time Features**

### **What updates instantly:**
```
✅ New comments appear immediately
✅ Team changes show right away
✅ Task status changes update
✅ Files appear when uploaded
✅ Activity Log refreshes
✅ Toast notifications alert you
```

### **Why real-time matters:**
```
💡 Everyone sees changes instantly
💡 No need to refresh page
💡 Collaborate in real-time
💡 No missed updates
💡 Live team awareness
```

---

## **Best Practices**

### **Do:**
✅ Check Activity Log regularly
✅ Add comments to document decisions
✅ Review team changes
✅ Filter by relevant type
✅ Use as project audit trail

### **Don't:**
❌ Assume everyone knows about changes
❌ Make decisions without comments
❌ Ignore member removals
❌ Skip Activity Log reviews
❌ Delete important activities

---

## **Troubleshooting**

### **"Activity Log is empty"**
```
→ Might be loading
→ Wait 5 seconds
→ Refresh the page
→ Check if you have permission
```

### **"I don't see a comment I just made"**
```
→ Scroll to bottom
→ It might be on next page
→ Check filter isn't hiding it
→ Try refreshing
```

### **"Team changes not showing"**
```
→ Use correct filter tab "Team Changes"
→ Check time range
→ Try "All Activities" filter
→ Verify you have read permissions
```

### **"Activity Log won't load"**
```
→ Check internet connection
→ Close and reopen sidebar
→ Refresh the page
→ Clear browser cache
→ Try different browser
```

---

## **Keyboard Shortcuts**

```
Coming Soon! Features you might want:
├─ Esc = Close Activity Log sidebar
├─ Enter = Apply filter
├─ Ctrl/Cmd + F = Search activities (future)
└─ Space = Scroll
```

---

## **Mobile Tips**

### **On Tablet/Mobile:**
```
✓ Sidebar works on mobile
✓ Swipe left to close
✓ Tap filters to switch
✓ Scroll for more activities
✓ Tap activity to expand details
```

---

## **Export & Reporting** (Future Features)

```
Coming Soon:
├─ Export activity log as PDF
├─ Generate team reports
├─ Activity analytics
├─ Custom date ranges
└─ Team productivity metrics
```

---

## **FAQs**

**Q: Can I delete activities from the log?**
A: No, Activity Log is immutable for audit purposes.

**Q: Are all team members' activities visible?**
A: Yes, within your project scope.

**Q: How far back does the log go?**
A: All activities since project creation.

**Q: Can I search activities?**
A: Yes, filter by type. Full search coming soon.

**Q: Are deleted tasks/comments still in the log?**
A: Yes, they remain for audit trail.

**Q: Can I view activities from private tasks?**
A: Only if you have access to those tasks.

---

## **Summary**

**Activity Log = 📚 Your Project's Memory**

```
What it tracks:          How to access:
✅ Comments               Click "Logs" button
✅ Team changes          Sidebar opens
✅ Task updates          Filter as needed
✅ All activities        View timeline
✅ Timestamps            See when it happened
✅ Who did what          See user info
✅ Context               See related items
✅ Real-time updates     Instant refresh
```

**Use it to:** Understand project history, make better decisions, audit changes, train new members, solve mysteries! 🎯

---

**Bookmark this guide for quick reference! 📌**
