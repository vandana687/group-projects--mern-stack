import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { fetchTasks, createTask } from '../store/slices/taskSlice';
import { fetchProject } from '../store/slices/projectSlice';
import { toast } from 'react-toastify';
import { joinProject, leaveProject } from '../api/socket';
import API from '../api/axios';
import MemberManagement from '../components/MemberManagement';
import ProjectProgress from '../components/ProjectProgress';
import ReviewQueue from '../components/ReviewQueue';
import TimeTracker from '../components/TimeTracker';
import FileUpload from '../components/FileUpload';
import ActivityLog from '../components/ActivityLog';
import TaskDetailModal from '../components/TaskDetailModal';
import '../TaskCard.css';

const ProjectBoard = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProject } = useSelector((state) => state.projects);
  const { tasks } = useSelector((state) => state.tasks);
  const [showModal, setShowModal] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(null);
  const [showProgressSidebar, setShowProgressSidebar] = useState(false);
  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [showTimeSidebar, setShowTimeSidebar] = useState(false);
  const [showActivitySidebar, setShowActivitySidebar] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    estimatedHours: 0,
    dueDate: ''
  });

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProject(projectId));
      dispatch(fetchTasks(projectId));
      joinProject(projectId);
    }
    return () => {
      if (projectId) leaveProject(projectId);
    };
  }, [dispatch, projectId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating task with data:', { ...formData, project: projectId });
      const result = await dispatch(createTask({ ...formData, project: projectId })).unwrap();
      console.log('Task created successfully:', result);
      toast.success('Task created!');
      setShowModal(false);
      setFormData({ title: '', description: '', priority: 'Medium' });
      dispatch(fetchTasks(projectId)); // Refresh tasks
    } catch (err) {
      console.error('Task creation error:', err);
      toast.error(err || 'Failed to create task');
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid droppable area
    if (!destination) return;

    // Dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId;

    try {
      await API.put(`/tasks/${draggableId}/move`, {
        toStatus: newStatus,
        newOrder: destination.index
      });
      toast.success(`Task moved to ${newStatus}!`);
      dispatch(fetchTasks(projectId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move task');
    }
  };

  const groupedTasks = currentProject?.workflow?.reduce((acc, stage) => {
    acc[stage.id] = tasks.filter(t => t.status === stage.id);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with Gradient */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{currentProject?.name || 'Project Board'}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowProgressSidebar(true)} 
                className="hidden md:flex px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 items-center space-x-2"
                title="View Progress"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Progress</span>
              </button>
              <button 
                onClick={() => setShowMembersSidebar(true)} 
                className="hidden md:flex px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 items-center space-x-2"
                title="View Members"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Team</span>
              </button>
              <button 
                onClick={() => setShowTimeSidebar(true)} 
                className="hidden md:flex px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 items-center space-x-2"
                title="View Time Logs"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Time</span>
              </button>
              <button 
                onClick={() => setShowActivitySidebar(true)} 
                className="hidden md:flex px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 items-center space-x-2"
                title="View Activity Log"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Logs</span>
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition duration-200 backdrop-blur-sm border border-white/30"
              >
                ← Back
              </button>
              <button 
                onClick={() => setShowModal(true)} 
                className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition duration-200 flex items-center space-x-2"
              >
                <span>+</span>
                <span>New Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Kanban Board Section - Full Width and Prominent */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-3xl p-8 shadow-2xl border-2 border-indigo-200/50 animate-fadeIn overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl -z-0"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-200/20 to-blue-200/20 rounded-full blur-3xl -z-0"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <span>Task Board</span>
              </h2>
              
              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-indigo-200">
                  <span className="text-xs text-gray-500 font-semibold">Total Tasks</span>
                  <p className="text-xl font-bold text-indigo-600">{tasks.length}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-green-200">
                  <span className="text-xs text-gray-500 font-semibold">Completed</span>
                  <p className="text-xl font-bold text-green-600">{tasks.filter(t => t.status === 'done').length}</p>
                </div>
              </div>
            </div>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentProject?.workflow?.map((stage, stageIndex) => {
              // Define unique gradient for each column
              const columnGradients = [
                { header: 'from-slate-500 to-slate-600', bg: 'from-slate-50 to-slate-100', hover: 'border-slate-400' },
                { header: 'from-blue-500 to-blue-600', bg: 'from-blue-50 to-blue-100', hover: 'border-blue-400' },
                { header: 'from-orange-500 to-orange-600', bg: 'from-orange-50 to-orange-100', hover: 'border-orange-400' },
                { header: 'from-green-500 to-green-600', bg: 'from-green-50 to-green-100', hover: 'border-green-400' }
              ];
              const gradient = columnGradients[stageIndex] || columnGradients[0];
              
              return (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div 
                    className={`rounded-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                      snapshot.isDraggingOver 
                        ? `bg-gradient-to-b ${gradient.bg} shadow-2xl scale-105 border-2` 
                        : 'bg-white/90 backdrop-blur-sm shadow-lg'
                    } border ${snapshot.isDraggingOver ? gradient.hover : 'border-gray-200/50'} overflow-hidden`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {/* Column Header with Dynamic Gradient */}
                    <div className={`bg-gradient-to-r ${gradient.header} px-6 py-5 text-white relative overflow-hidden`}>
                      {/* Header Decoration */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                            <h3 className="font-bold text-base tracking-wide">{stage.name}</h3>
                          </div>
                          <div className="bg-white/30 backdrop-blur-sm text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                            {groupedTasks?.[stage.id]?.length || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task List */}
                    <div className="p-4 min-h-[500px] space-y-3 bg-gradient-to-b from-transparent to-gray-50/30">
                      {groupedTasks?.[stage.id]?.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedTask(task)}
                              className={`group relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                                snapshot.isDragging 
                                  ? 'opacity-90 shadow-2xl scale-110 rotate-6 border-indigo-400' 
                                  : 'opacity-100 border-gray-200/80 hover:border-indigo-300 hover:shadow-xl'
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                              }}
                            >
                              {/* Subtle Gradient Overlay on Hover */}
                              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none rounded-xl"></div>
                              
                              {/* Drag Handle Indicator */}
                              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity duration-200">
                                <div className="flex flex-col space-y-1">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                </div>
                              </div>

                              <div className="relative z-10">
                                {/* Task Title */}
                                <h4 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors duration-200 pr-2">
                                  {task.title}
                                </h4>

                                {/* Task Description */}
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                                  {task.description || 'No description provided'}
                                </p>

                                {/* Task Meta Tags */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm
                                    ${task.priority?.toLowerCase() === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : ''}
                                    ${task.priority?.toLowerCase() === 'high' ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : ''}
                                    ${task.priority?.toLowerCase() === 'medium' ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' : ''}
                                    ${task.priority?.toLowerCase() === 'low' ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700' : ''}
                                  `}>
                                    {task.priority || 'Medium'}
                                  </span>
                                  {task.estimatedHours > 0 && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-700 border border-indigo-200">
                                      ⏱️ {task.estimatedHours}h
                                    </span>
                                  )}
                                </div>

                                {/* Assignee */}
                                {task.assignee && (
                                  <div className="mb-3 pb-3 border-t border-gray-200 pt-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {task.assignee.name.charAt(0).toUpperCase()}
                                      </div>
                                      <p className="text-xs text-gray-700 font-medium">
                                        {task.assignee.name}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Task Actions */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                  <button 
                                    className="flex-1 px-3 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white text-xs font-bold rounded-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-1 transform hover:scale-105"
                                    onClick={(e) => { e.stopPropagation(); setShowTimeTracker(task); }}
                                    title="Track time"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Time</span>
                                  </button>
                                  <button 
                                    className="flex-1 px-3 py-2.5 bg-gradient-to-r from-teal-500 via-green-500 to-teal-600 text-white text-xs font-bold rounded-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-1 transform hover:scale-105"
                                    onClick={(e) => { e.stopPropagation(); setShowFileUpload(task); }}
                                    title="Upload files"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span>Files</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
            })}
          </div>
        </DragDropContext>
        </div>
        {/* End of Kanban Board Section */}
      </div>
      {/* End of Kanban Board Section */}
    </div>
    {/* End of Main Content */}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Create New Task</h2>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title *</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    required 
                    placeholder="What needs to be done?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    rows="4" 
                    placeholder="Describe your task in detail..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 resize-none"
                  />
                </div>

                {/* Priority and Hours Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select 
                      value={formData.priority} 
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-white"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Hours</label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.5" 
                      value={formData.estimatedHours} 
                      onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})} 
                      placeholder="e.g., 5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                  <input 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 justify-end pt-6 border-t border-gray-200">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-lg hover:shadow-xl transition duration-200 transform hover:-translate-y-0.5"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Time Tracker Modal */}
      {showTimeTracker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowTimeTracker(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <span>⏱️</span>
                <span>Time Tracker</span>
              </h2>
            </div>
            <div className="p-8">
              <TimeTracker task={showTimeTracker} onClose={() => setShowTimeTracker(null)} />
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowFileUpload(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-teal-600 to-green-600 px-8 py-6 text-white">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <span>📁</span>
                <span>File Manager</span>
              </h2>
            </div>
            <div className="p-8">
              <FileUpload task={showFileUpload} onClose={() => setShowFileUpload(null)} />
            </div>
          </div>
        </div>
      )}

      {/* Progress Sidebar */}
      {showProgressSidebar && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" onClick={() => setShowProgressSidebar(false)}></div>
          <div className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showProgressSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h2 className="text-xl font-bold text-white">Project Progress</h2>
                </div>
                <button 
                  onClick={() => setShowProgressSidebar(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
                <ProjectProgress tasks={tasks} />
                <div className="mt-6">
                  <ReviewQueue 
                    tasks={tasks} 
                    projectId={projectId}
                    onTaskUpdated={() => dispatch(fetchTasks(projectId))}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Members Sidebar */}
      {showMembersSidebar && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" onClick={() => setShowMembersSidebar(false)}></div>
          <div className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showMembersSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h2 className="text-xl font-bold text-white">Team Members</h2>
                </div>
                <button 
                  onClick={() => setShowMembersSidebar(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-pink-50">
                <MemberManagement 
                  projectId={projectId}
                  onMemberUpdated={(updatedProject) => {
                    dispatch(fetchProject(projectId));
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Time Tracking Sidebar */}
      {showTimeSidebar && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" onClick={() => setShowTimeSidebar(false)}></div>
          <div className={`fixed top-0 right-0 h-full w-full sm:w-[560px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showTimeSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-xl font-bold text-white">Time Tracking Overview</h2>
                </div>
                <button 
                  onClick={() => setShowTimeSidebar(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-teal-50">
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">Total Hours</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0).toFixed(1)}h
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Across all tasks</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-lg border border-teal-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">Estimated</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0).toFixed(1)}h
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Total estimate</p>
                    </div>
                  </div>

                  {/* Tasks with Time Logs */}
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Task Time Breakdown</span>
                    </h3>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {tasks.filter(t => t.estimatedHours > 0 || t.actualHours > 0).map((task) => (
                        <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition duration-200">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-800 text-sm flex-1">{task.title}</h4>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full
                              ${task.priority?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-800' : ''}
                              ${task.priority?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                              ${task.priority?.toLowerCase() === 'medium' ? 'bg-blue-100 text-blue-800' : ''}
                              ${task.priority?.toLowerCase() === 'low' ? 'bg-gray-100 text-gray-800' : ''}
                            `}>
                              {task.priority}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500">Estimated:</span>
                                <span className="font-semibold text-blue-600">{task.estimatedHours || 0}h</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500">Actual:</span>
                                <span className="font-semibold text-teal-600">{task.actualHours || 0}h</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setShowTimeSidebar(false);
                                setShowTimeTracker(task);
                              }}
                              className="text-xs bg-gradient-to-r from-blue-500 to-teal-500 text-white px-3 py-1.5 rounded-lg hover:shadow-md transition duration-200 font-semibold"
                            >
                              Track Time
                            </button>
                          </div>

                          {/* Progress Bar */}
                          {task.estimatedHours > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">Progress</span>
                                <span className="font-semibold text-gray-700">
                                  {Math.min(100, Math.round(((task.actualHours || 0) / task.estimatedHours) * 100))}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, ((task.actualHours || 0) / task.estimatedHours) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {task.assignee && (
                            <p className="text-xs text-gray-500 mt-2">
                              Assigned to: <span className="font-semibold text-gray-700">{task.assignee.name}</span>
                            </p>
                          )}
                        </div>
                      ))}
                      
                      {tasks.filter(t => t.estimatedHours > 0 || t.actualHours > 0).length === 0 && (
                        <div className="text-center py-8">
                          <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-500 text-sm">No time tracking data yet</p>
                          <p className="text-gray-400 text-xs mt-1">Start tracking time on your tasks!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Activity Log Sidebar */}
      {showActivitySidebar && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" onClick={() => setShowActivitySidebar(false)}></div>
          <div className={`fixed top-0 right-0 h-full w-full sm:w-[560px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showActivitySidebar ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="text-xl font-bold text-white">Activity Log</h2>
                </div>
                <button 
                  onClick={() => setShowActivitySidebar(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                <ActivityLog projectId={projectId} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectMembers={currentProject?.members}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            dispatch(fetchTasks(projectId));
            setSelectedTask(null);
          }}
        />
      )}

    </div>
  );
};

export default ProjectBoard;
