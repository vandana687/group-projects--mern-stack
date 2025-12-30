import React from 'react';
import './ProjectProgress.css';

const ProjectProgress = ({ tasks }) => {
  const statusGroups = {
    todo: { label: 'To Do', color: '#94a3b8', tasks: [] },
    inprogress: { label: 'In Progress', color: '#3b82f6', tasks: [] },
    review: { label: 'Review', color: '#f59e0b', tasks: [] },
    done: { label: 'Done', color: '#10b981', tasks: [] }
  };

  // Group tasks by status
  tasks.forEach(task => {
    if (statusGroups[task.status]) {
      statusGroups[task.status].tasks.push(task);
    }
  });

  const totalTasks = tasks.length;
  const completedTasks = statusGroups.done.tasks.length;
  const inReview = statusGroups.review.tasks.length;
  const inProgress = statusGroups.inprogress.tasks.length;
  const todoTasks = statusGroups.todo.tasks.length;

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate estimated hours
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  const completedHours = statusGroups.done.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

  // Priority breakdown
  const priorityCount = {
    Critical: tasks.filter(t => t.priority === 'Critical').length,
    High: tasks.filter(t => t.priority === 'High').length,
    Medium: tasks.filter(t => t.priority === 'Medium').length,
    Low: tasks.filter(t => t.priority === 'Low').length
  };

  return (
    <div className="project-progress">
      <h3>📊 Project Progress</h3>
      
      {/* Overall completion */}
      <div className="progress-summary">
        <div className="progress-stat">
          <span className="stat-value">{completionPercentage}%</span>
          <span className="stat-label">Complete</span>
        </div>
        <div className="progress-stat">
          <span className="stat-value">{completedTasks}/{totalTasks}</span>
          <span className="stat-label">Tasks Done</span>
        </div>
        <div className="progress-stat">
          <span className="stat-value">{completedHours}h/{totalEstimatedHours}h</span>
          <span className="stat-label">Hours</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-bar-fill done" 
            style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
            title={`Done: ${completedTasks}`}
          />
          <div 
            className="progress-bar-fill review" 
            style={{ width: `${(inReview / totalTasks) * 100}%` }}
            title={`Review: ${inReview}`}
          />
          <div 
            className="progress-bar-fill inprogress" 
            style={{ width: `${(inProgress / totalTasks) * 100}%` }}
            title={`In Progress: ${inProgress}`}
          />
          <div 
            className="progress-bar-fill todo" 
            style={{ width: `${(todoTasks / totalTasks) * 100}%` }}
            title={`To Do: ${todoTasks}`}
          />
        </div>
      </div>

      {/* Status breakdown */}
      <div className="status-breakdown">
        {Object.entries(statusGroups).map(([key, { label, color, tasks }]) => (
          <div key={key} className="status-item">
            <div className="status-indicator" style={{ background: color }}></div>
            <span className="status-label">{label}</span>
            <span className="status-count">{tasks.length}</span>
          </div>
        ))}
      </div>

      {/* Priority breakdown */}
      <div className="priority-breakdown">
        <h4>Priority Distribution</h4>
        <div className="priority-grid">
          {Object.entries(priorityCount).map(([priority, count]) => (
            <div key={priority} className={`priority-item priority-${priority.toLowerCase()}`}>
              <span className="priority-label">{priority}</span>
              <span className="priority-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectProgress;
