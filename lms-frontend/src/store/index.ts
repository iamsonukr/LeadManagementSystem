import { configureStore } from '@reduxjs/toolkit';
import leadsReducer from './slices/leadsSlice';
import callsReducer from './slices/callsSlice';
import followUpsReducer from './slices/followUpsSlice';
import projectsReducer from './slices/projectsSlice';
import teamMembersReducer from './slices/teamMembersSlice';
import usersReducer from './slices/usersSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    leads: leadsReducer,
    calls: callsReducer,
    followUps: followUpsReducer,
    projects: projectsReducer,
    teamMembers: teamMembersReducer,
    users: usersReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
