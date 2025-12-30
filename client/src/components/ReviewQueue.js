import React, { useState } from 'react';
import { toast } from 'react-toastify';
import API from '../api/axios';
import './ReviewQueue.css';

const ReviewQueue = ({ tasks, projectId, onTaskUpdated }) => {
  const [loading, setLoading] = useState(false);

  const reviewTasks = tasks.filter(task => task.status === 'review');

  const handleStatusChange = async (taskId, newStatus) => {
    setLoading(true);
    try {
      const res = await API.put(`/tasks/${taskId}/move`, {
        toStatus: newStatus
      });
      toast.success(`Task moved to ${newStatus === 'done' ? 'Done' : 'In Progress'}!`);
      if (onTaskUpdated) {
        onTaskUpdated(res.data.task);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority) => {
    return `priority-badge priority-${priority.toLowerCase()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `⚠️ ${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return '🔥 Due today';
    if (diffDays === 1) return '⏰ Due tomorrow';
    return `📅 Due in ${diffDays} days`;
  };

  if (reviewTasks.length === 0) {
    return (
      <div className="review-queue">
        <h3>🔍 Review Queue</h3>
        <div className="no-reviews">
          <p>✅ No tasks waiting for review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-queue">
      <h3>🔍 Review Queue</h3>
      <p className="review-subtitle">{reviewTasks.length} task{reviewTasks.length !== 1 ? 's' : ''} ready for review</p>
      
      <div className="review-list">
        {reviewTasks.map(task => (
          <div key={task._id} className="review-item">
            <div className="review-header">
              <div className="review-title-row">
                <h4>{task.title}</h4>
                <span className={getPriorityClass(task.priority)}>{task.priority}</span>
              </div>
              {task.assignee && (
                <div className="assignee-info">
                  <span className="assignee-avatar">
                    {task.assignee.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                  <span className="assignee-name">{task.assignee.name}</span>
                </div>
              )}
            </div>

            {task.description && (
              <p className="review-description">{task.description}</p>
            )}

            <div className="review-meta">
              <span className="due-date">{formatDate(task.dueDate)}</span>
              {task.estimatedHours > 0 && (
                <span className="estimated-hours">⏱️ {task.estimatedHours}h estimated</span>
              )}
            </div>

            <div className="review-actions">
              <button
                className="btn-approve"
                onClick={() => handleStatusChange(task._id, 'done')}
                disabled={loading}
              >
                ✓ Approve
              </button>
              <button
                className="btn-request-changes"
                onClick={() => handleStatusChange(task._id, 'inprogress')}
                disabled={loading}
              >
                ← Request Changes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewQueue;
