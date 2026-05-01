import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectRecord } from '@/types';
import { projectsService } from '@/services';

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params: Record<string, string | number> = {}, { rejectWithValue }) => {
  try { return await projectsService.getAll(params); }
  catch { return rejectWithValue('Failed to fetch projects'); }
});

export const upsertProject = createAsyncThunk('projects/upsert', async (payload: ProjectRecord, { rejectWithValue }) => {
  try {
    return await projectsService.update(payload.id, { ...payload, lead: payload.leadId } as Partial<ProjectRecord>);
  } catch {
    return rejectWithValue('Failed to save project');
  }
});

interface ProjectsState {
  projects: ProjectRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<ProjectRecord[]>) {
      state.projects = action.payload;
    },
    upsertProjectLocal(state, action: PayloadAction<ProjectRecord>) {
      const index = state.projects.findIndex((project) => project.id === action.payload.id);
      if (index === -1) {
        state.projects.unshift(action.payload);
      } else {
        state.projects[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => { state.isLoading = false; state.projects = action.payload.data; })
      .addCase(fetchProjects.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });
    builder
      .addCase(upsertProject.pending, (state) => { state.isSubmitting = true; })
      .addCase(upsertProject.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.projects.findIndex((project) => project.id === action.payload.id);
        if (index === -1) state.projects.unshift(action.payload);
        else state.projects[index] = action.payload;
      })
      .addCase(upsertProject.rejected, (state, action) => { state.isSubmitting = false; state.error = action.payload as string; });
  },
});

export const { setProjects, upsertProjectLocal } = projectsSlice.actions;
export default projectsSlice.reducer;
