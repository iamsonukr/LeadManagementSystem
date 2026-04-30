import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Lead, LeadStatus } from '@/types';
import { allLeads } from '@/data/mockData';

interface LeadsState {
  leads: Lead[];
  selectedLead: Lead | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status: string;
    source: string;
    priority: string;
    search: string;
  };
}

const initialState: LeadsState = {
  leads: allLeads,
  selectedLead: null,
  isLoading: false,
  error: null,
  filters: {
    status: '',
    source: '',
    priority: '',
    search: '',
  },
};

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setLeads(state, action: PayloadAction<Lead[]>) {
      state.leads = action.payload;
    },
    addLead(state, action: PayloadAction<Lead>) {
      state.leads.unshift(action.payload);
    },
    updateLead(state, action: PayloadAction<Lead>) {
      const idx = state.leads.findIndex(l => l.id === action.payload.id);
      if (idx !== -1) state.leads[idx] = action.payload;
    },
    deleteLead(state, action: PayloadAction<string>) {
      state.leads = state.leads.filter(l => l.id !== action.payload);
    },
    selectLead(state, action: PayloadAction<Lead | null>) {
      state.selectedLead = action.payload;
    },
    setFilter(state, action: PayloadAction<Partial<LeadsState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateLeadStatus(state, action: PayloadAction<{ id: string; status: LeadStatus }>) {
      const lead = state.leads.find(l => l.id === action.payload.id);
      if (lead) lead.status = action.payload.status;
    },
  },
});

export const { setLeads, addLead, updateLead, deleteLead, selectLead, setFilter, updateLeadStatus } = leadsSlice.actions;
export default leadsSlice.reducer;
