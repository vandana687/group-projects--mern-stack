import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import './ActivityLog.css';

const ActivityLog = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, task, comment, member
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const skip = page * limit;
        const res = await API.get(`/activity/project/${projectId}`, {
          params: { limit, skip }
        });

        let filtered = res.data.activities;

        if (filter !== 'all') {
          filtered = filtered.filter(act => act.action === filter);
        }

        setActivities(filtered);
      } catch (err) {
        console.error('Error fetching activities:', err);
        toast.error('Failed to load activity log');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [projectId, page, filter]);

  const getActivityIcon = (action) => {
    const icons = {
      task_created: { icon: '➕', color: '#10b981', label: 'Task Created' },
      task_updated: { icon: '✏️', color: '#3b82f6', label: 'Task Updated' },
      task_deleted: { icon: '🗑️', color: '#ef4444', label: 'Task Deleted' },
      task_moved: { icon: '↔️', color: '#f59e0b', label: 'Task Moved' },
      comment_added: { icon: '💬', color: '#8b5cf6', label: 'Comment Added' },
      comment_deleted: { icon: '🗑️', color: '#ef4444', label: 'Comment Deleted' },
      member_added: { icon: '👥', color: '#06b6d4', label: 'Member Added' },
      member_removed: { icon: '👤', color: '#ef4444', label: 'Member Removed' },
      time_logged: { icon: '⏱️', color: '#6366f1', label: 'Time Logged' },
      file_uploaded: { icon: '📁', color: '#14b8a6', label: 'File Uploaded' }
    };
    return icons[action] || { icon: '•', color: '#6b7280', label: action };
  };

  const formatTime = (date) => {
    const now = new Date();
    const actDate = new Date(date);
    const diffMs = now - actDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return actDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityDescription = (activity) => {
    if (!activity) return 'Unknown activity';
    
    const action = activity.action || 'unknown';
    const entityName =
      activity.details?.taskTitle ||
      activity.details?.memberName ||
      activity.details?.role ||
      activity.entity?.entityType ||
      'item';

    const descriptions = {
      task_created: `created task "${entityName}"`,
      task_updated: `updated task "${entityName}"`,
      task_deleted: `deleted task "${entityName}"`,
      task_moved: `moved task "${entityName}" to ${activity.details?.newStatus || 'new status'}`,
      comment_added: `added comment on "${entityName}"`,
      comment_deleted: `deleted comment from "${entityName}"`,
      member_added: `added member ${activity.details?.memberName || activity.details?.addedUserId || ''} to the team`,
      member_removed: `removed member ${activity.details?.memberName || activity.details?.removedUserId || ''} from the team`,
      time_logged: `logged ${activity.details?.hours || '0'} hours on "${entityName}"`,
      file_uploaded: `uploaded file to "${entityName}"`
    };

    return descriptions[action] || `${action.replace(/_/g, ' ')} on "${entityName}"`;
  };

  return (
    <div className="activity-log-container">
      {/* Header */}
      <div className="activity-log-header">
        <div className="header-title">
          <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <h3>Activity Log</h3>
            <p className="header-subtitle">Track all changes and updates</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="activity-filters">
        {[
          { value: 'all', label: 'All Activities', icon: '📊' },
          { value: 'task_created', label: 'Tasks Created', icon: '➕' },
          { value: 'task_updated', label: 'Tasks Updated', icon: '✏️' },
          { value: 'comment_added', label: 'Comments', icon: '💬' },
          { value: 'member_added', label: 'Team Changes', icon: '👥' }
        ].map(tab => (
          <button
            key={tab.value}
            className={`filter-tab ${filter === tab.value ? 'active' : ''}`}
            onClick={() => {
              setFilter(tab.value);
              setPage(0);
            }}
          >
            <span className="filter-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="activity-list">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading activities...</p>
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No activities found</p>
            <span className="empty-hint">Changes will appear here</span>
          </div>
        )}

        {!loading && activities.length > 0 && (
          <div className="activity-timeline">
            {activities.map((activity, index) => {
              const activityInfo = getActivityIcon(activity.action);
              return (
                <div key={activity._id} className="activity-item">
                  {/* Timeline Line */}
                  {index < activities.length - 1 && <div className="timeline-line"></div>}

                  {/* Activity Node */}
                  <div className="activity-node" style={{ backgroundColor: activityInfo.color }}>
                    {activityInfo.icon}
                  </div>

                  {/* Activity Content */}
                  <div className="activity-content">
                    <div className="activity-header">
                      <div className="activity-user">
                        <div className="user-avatar">
                          {activity.user?.avatar ? (
                            <img src={activity.user.avatar} alt={activity.user.name} />
                          ) : (
                            <span className="avatar-text">
                              {activity.user?.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="user-info">
                          <strong className="user-name">{activity.user?.name || 'Unknown User'}</strong>
                          <p className="activity-description">
                            {getActivityDescription(activity)}
                          </p>
                        </div>
                      </div>
                      <span className="activity-time">{formatTime(activity.createdAt)}</span>
                    </div>

                    {/* Activity Details */}
                    {activity.details && (
                      <div className="activity-details">
                        {activity.details.oldStatus && activity.details.newStatus && (
                          <div className="detail-item">
                            <span className="detail-label">Status:</span>
                            <span className="status-badge old">{activity.details.oldStatus}</span>
                            <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="status-badge new">{activity.details.newStatus}</span>
                          </div>
                        )}
                        {activity.details.description && (
                          <div className="detail-item">
                            <span className="detail-label">Change:</span>
                            <span className="detail-text">{activity.details.description}</span>
                          </div>
                        )}
                        {activity.details.priority && (
                          <div className="detail-item">
                            <span className="detail-label">Priority:</span>
                            <span className={`priority-badge priority-${activity.details.priority.toLowerCase()}`}>
                              {activity.details.priority}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && activities.length > 0 && (
        <div className="activity-pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            ← Previous
          </button>
          <span className="page-info">Page {page + 1}</span>
          <button
            className="pagination-btn"
            onClick={() => setPage(page + 1)}
            disabled={activities.length < limit}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
