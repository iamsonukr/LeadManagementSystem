import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  addLeadModalOpen: boolean;
  logCallModalOpen: boolean;
  activeLeadId: string | null;
}

const initialState: UIState = {
  sidebarOpen: false,
  addLeadModalOpen: false,
  logCallModalOpen: false,
  activeLeadId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setAddLeadModal(state, action: PayloadAction<boolean>) {
      state.addLeadModalOpen = action.payload;
    },
    setLogCallModal(state, action: PayloadAction<boolean>) {
      state.logCallModalOpen = action.payload;
    },
    setActiveLeadId(state, action: PayloadAction<string | null>) {
      state.activeLeadId = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setAddLeadModal, setLogCallModal, setActiveLeadId } = uiSlice.actions;
export default uiSlice.reducer;
