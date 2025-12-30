import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProjects, createProject } from '../store/slices/projectSlice';
import { logout } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { projects, loading } = useSelector((state) => state.projects);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createProject(formData)).unwrap();
      toast.success('Project created!');
      setShowModal(false);
      setFormData({ name: '', description: '' });
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">📊 Project Manager</div>
        <div className="navbar-user">
          <span>Hi, {user?.name}</span>
          <button onClick={handleLogout} className="btn btn-small btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>My Projects</h1>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Create</button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div><p>Loading...</p></div>
        ) : projects.length === 0 ? (
          <div style={{padding: '60px', textAlign: 'center', color: '#999'}}>
            <h3>No projects yet</h3>
            <p>Create your first project to get started!</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project._id} className="project-card" onClick={() => navigate(`/project/${project._id}`)}>
                <h3>{project.name}</h3>
                <p>{project.description || 'No description'}</p>
                <div className="project-card-footer">
                  <span>{project.members?.length || 0} members</span>
                  <span>{format(new Date(project.createdAt), 'MMM dd')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="Project name" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="3" placeholder="Description (optional)" />
              </div>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
