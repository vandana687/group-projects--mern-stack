import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// Fetch all projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/projects');
      return response.data.projects;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

// Fetch single project
export const fetchProject = createAsyncThunk(
  'projects/fetchOne',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/projects/${projectId}`);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project');
    }
  }
);

// Create project
export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await API.post('/projects', projectData);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project');
    }
  }
);

// Update project
export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ projectId, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/projects/${projectId}`, data);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update project');
    }
  }
);

// Add member
export const addMember = createAsyncThunk(
  'projects/addMember',
  async ({ projectId, userId, role }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/projects/${projectId}/members`, { userId, role });
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add member');
    }
  }
);

// Remove member
export const removeMember = createAsyncThunk(
  'projects/removeMember',
  async ({ projectId, userId }, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/projects/${projectId}/members/${userId}`);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
    }
  }
);

// Update workflow
export const updateWorkflow = createAsyncThunk(
  'projects/updateWorkflow',
  async ({ projectId, workflow }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/projects/${projectId}/workflow`, { workflow });
      return { projectId, workflow: response.data.workflow };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update workflow');
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    loading: false,
    error: null
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single project
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.currentProject = action.payload;
      })
      // Create project
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
      })
      // Update project
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      })
      // Add/Remove member
      .addCase(addMember.fulfilled, (state, action) => {
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      })
      // Update workflow
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        if (state.currentProject?._id === action.payload.projectId) {
          state.currentProject.workflow = action.payload.workflow;
        }
      });
  }
});

export const { setCurrentProject, clearCurrentProject, clearError } = projectSlice.actions;
export default projectSlice.reducer;
