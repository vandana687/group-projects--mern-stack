import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import './MemberManagement.css';

const MemberManagement = ({ projectId, onMemberUpdated }) => {
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Team Member');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [project, setProject] = useState(null);

  // Fetch project details and members
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const res = await API.get(`/projects/${projectId}`);
        setProject(res.data.project);
        setMembers(res.data.project.members || []);
      } catch (err) {
        console.error('Error fetching project:', err);
      }
    };

    fetchProjectDetails();
    fetchAllUsers();
  }, [projectId]);

  const fetchAllUsers = async () => {
    try {
      const res = await API.get('/users');
      setAvailableUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(`/projects/${projectId}/members`, {
        userId: selectedUserId,
        role: selectedRole
      });
      
      toast.success('✅ Member added successfully!');
      setMembers(res.data.project.members);
      setSelectedUserId('');
      setSelectedRole('Team Member');
      setShowAddForm(false);
      onMemberUpdated?.(res.data.project);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add member';
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the project?`)) {
      return;
    }

    try {
      const res = await API.delete(`/projects/${projectId}/members/${memberId}`);
      toast.success(`✅ ${memberName} removed!`);
      setMembers(res.data.project.members);
      onMemberUpdated?.(res.data.project);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to remove member';
      toast.error(`❌ ${errorMsg}`);
    }
  };

  const getUnusedUsers = () => {
    const memberIds = members.map(m => m.user._id);
    return availableUsers.filter(u => !memberIds.includes(u._id));
  };

  const getRoleColor = (role) => {
    const colors = {
      'Admin': '#ef4444',
      'Project Manager': '#f59e0b',
      'Team Member': '#3b82f6'
    };
    return colors[role] || '#6b7280';
  };

  if (!project) {
    return <div className="member-mgmt">Loading...</div>;
  }

  return (
    <div className="member-mgmt-container">
      {/* Header with Add Button */}
      <div className="member-mgmt-header">
        <div className="header-title">
          <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <div>
            <h3>Team Members</h3>
            <p className="header-subtitle">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button 
          className={`add-member-btn ${showAddForm ? 'active' : ''}`}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAddForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showAddForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <form onSubmit={handleAddMember} className="add-member-form-container">
          <div className="form-fields">
            <div className="form-group">
              <label>Select User</label>
              <select 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="form-input"
              >
                <option value="">-- Choose a user --</option>
                {getUnusedUsers().map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {getUnusedUsers().length === 0 && (
                <small className="form-error">All users are already members</small>
              )}
            </div>

            <div className="form-group">
              <label>Role</label>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="form-input"
              >
                <option>Team Member</option>
                <option>Project Manager</option>
                <option>Admin</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading || !selectedUserId}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Adding...
              </>
            ) : (
              <>
                <svg className="btn-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Member
              </>
            )}
          </button>
        </form>
      )}

      {/* Members List */}
      <div className="members-list-container">
        {members.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p>No members yet</p>
            <span className="empty-hint">Add members to collaborate on this project</span>
          </div>
        ) : (
          members.map(member => (
            <div key={member.user._id} className="member-card">
              <div className="member-content">
                <div className="member-avatar-wrapper">
                  {member.user.avatar ? (
                    <img src={member.user.avatar} alt={member.user.name} className="member-avatar-img" />
                  ) : (
                    <div className="member-avatar-placeholder">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="member-info-details">
                  <h4 className="member-name">{member.user.name}</h4>
                  <p className="member-email">{member.user.email}</p>
                </div>
              </div>

              <div className="member-footer">
                <span 
                  className="role-badge"
                  style={{backgroundColor: getRoleColor(member.role)}}
                >
                  {member.role}
                </span>

                {/* Only show remove if not the only admin and not trying to remove owner */}
                {project?.owner?._id !== member.user._id && (
                  <button
                    className="remove-member-btn"
                    onClick={() => handleRemoveMember(member.user._id, member.user.name)}
                    title="Remove member from project"
                  >
                    <svg className="remove-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemberManagement;
