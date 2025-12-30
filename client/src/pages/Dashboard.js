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
      toast.error(err || 'Failed to create project');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-pink-50">
      {/* Navigation Bar - Responsive */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg md:rounded-xl shadow-lg">
                <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-base md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Project Manager
              </span>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden sm:flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg md:rounded-xl">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700">Hi, {user?.name}</span>
              </div>
              <div className="sm:hidden w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button 
                onClick={handleLogout}
                className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg md:rounded-xl transition duration-200"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Responsive */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4 mb-6 md:mb-8 animate-fadeIn">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-1 md:mb-2">My Projects</h1>
            <p className="text-sm md:text-base text-gray-600">Manage and track your projects</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-200"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Project</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-20 animate-fadeIn">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-600 font-medium">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 md:py-20 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4 md:mb-6">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">No projects yet</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Create your first project to get started!</p>
            <button 
              onClick={() => setShowModal(true)}
              className="px-5 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-200"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fadeIn">
            {/* Projects Grid - Fully Responsive */}
            {projects.map((project, index) => (
              <div 
                key={project._id} 
                onClick={() => navigate(`/project/${project._id}`)}
                className="group bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200/50 overflow-hidden cursor-pointer transform hover:-translate-y-1 transition duration-300 animate-slideIn"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                {/* Card Header - Smaller on mobile */}
                <div className="h-16 md:h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-3 right-3 md:top-4 md:right-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card Content - Responsive padding */}
                <div className="p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2 group-hover:text-indigo-600 transition duration-200 line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 min-h-[32px] md:min-h-[40px]">
                    {project.description || 'No description provided'}
                  </p>

                  {/* Card Footer - Responsive */}
                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-1.5 md:space-x-2">
                      <div className="flex -space-x-1.5 md:-space-x-2">
                        {[...Array(Math.min(project.members?.length || 0, 3))].map((_, i) => (
                          <div key={i} className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] md:text-xs font-semibold">
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs md:text-sm text-gray-600 font-medium">
                        {project.members?.length || 0}
                      </span>
                    </div>
                    <span className="text-xs md:text-sm text-gray-500 flex items-center space-x-1">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="hidden sm:inline">{format(new Date(project.createdAt), 'MMM dd, yyyy')}</span>
                      <span className="sm:hidden">{format(new Date(project.createdAt), 'MMM dd')}</span>
                    </span>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500/50 rounded-xl md:rounded-2xl transition duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal - Responsive */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">Create New Project</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Enter project name"
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  placeholder="Describe your project..."
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-3 md:pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition duration-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
