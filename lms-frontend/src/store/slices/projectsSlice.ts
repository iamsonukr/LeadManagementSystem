import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { projectRecords } from '@/data/mockData';
import { ProjectRecord } from '@/types';

interface ProjectsState {
  projects: ProjectRecord[];
}

const initialState: ProjectsState = {
  projects: projectRecords,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<ProjectRecord[]>) {
      state.projects = action.payload;
    },
    upsertProject(state, action: PayloadAction<ProjectRecord>) {
      const index = state.projects.findIndex((project) => project.id === action.payload.id);
      if (index === -1) {
        state.projects.unshift(action.payload);
      } else {
        state.projects[index] = action.payload;
      }
    },
  },
});

export const { setProjects, upsertProject } = projectsSlice.actions;
export default projectsSlice.reducer;
