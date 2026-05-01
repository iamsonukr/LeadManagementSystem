import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Lead, LeadStatus } from '@/types';
import leadsService, { LeadFilters, DashboardStats } from '@/services/leadsService';

export const fetchLeads = createAsyncThunk('leads/fetchAll', async (filters: LeadFilters = {}, { rejectWithValue }) => {
  try { return await leadsService.getAll(filters); }
  catch (err: unknown) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const fetchLeadById = createAsyncThunk('leads/fetchById', async (id: string, { rejectWithValue }) => {
  try { return await leadsService.getById(id); }
  catch { return rejectWithValue('Failed to fetch lead'); }
});

export const createLeadThunk = createAsyncThunk('leads/create', async (payload: Partial<Lead>, { rejectWithValue }) => {
  try { return await leadsService.create(payload); }
  catch (err: unknown) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const addLead = createLeadThunk;

export const updateLeadThunk = createAsyncThunk('leads/update', async ({ id, payload }: { id: string; payload: Partial<Lead> }, { rejectWithValue }) => {
  try { return await leadsService.update(id, payload); }
  catch { return rejectWithValue('Failed to update'); }
});

export const updateLead = createAsyncThunk('leads/updateFromPayload', async (payload: Lead, { rejectWithValue }) => {
  try { return await leadsService.update(payload.id, payload); }
  catch { return rejectWithValue('Failed to update'); }
});

export const patchLeadStatus = createAsyncThunk('leads/patchStatus', async ({ id, status }: { id: string; status: LeadStatus }, { rejectWithValue }) => {
  try { return await leadsService.updateStatus(id, status); }
  catch { return rejectWithValue('Failed'); }
});

export const updateLeadStatus = patchLeadStatus;

export const deleteLeadThunk = createAsyncThunk('leads/delete', async (id: string, { rejectWithValue }) => {
  try { await leadsService.delete(id); return id; }
  catch { return rejectWithValue('Failed'); }
});

export const fetchDashboardStats = createAsyncThunk('leads/dashboardStats', async (_, { rejectWithValue }) => {
  try { return await leadsService.getDashboardStats(); }
  catch { return rejectWithValue('Failed'); }
});

interface LeadsState {
  leads: Lead[];
  selectedLead: Lead | null;
  selectedLeadCalls: unknown[];
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number; pages: number } | null;
  filters: { status: string; source: string; priority: string; search: string };
}

const initialState: LeadsState = {
  leads: [], selectedLead: null, selectedLeadCalls: [], dashboardStats: null,
  isLoading: false, isSubmitting: false, error: null, pagination: null,
  filters: { status: '', source: '', priority: '', search: '' },
};

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<Partial<LeadsState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError(state) { state.error = null; },
    clearSelectedLead(state) { state.selectedLead = null; state.selectedLeadCalls = []; },
    addLeadLocal(state, action: PayloadAction<Lead>) { state.leads.unshift(action.payload); },
    updateLeadStatusLocal(state, action: PayloadAction<{ id: string; status: LeadStatus }>) {
      const lead = state.leads.find(l => l.id === action.payload.id);
      if (lead) lead.status = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, s => { s.isLoading = true; s.error = null; })
      .addCase(fetchLeads.fulfilled, (s, a) => { s.isLoading = false; s.leads = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchLeads.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });
    builder
      .addCase(fetchLeadById.pending, s => { s.isLoading = true; })
      .addCase(fetchLeadById.fulfilled, (s, a) => { s.isLoading = false; s.selectedLead = a.payload.lead; s.selectedLeadCalls = a.payload.calls; })
      .addCase(fetchLeadById.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });
    builder
      .addCase(createLeadThunk.pending, s => { s.isSubmitting = true; s.error = null; })
      .addCase(createLeadThunk.fulfilled, (s, a) => { s.isSubmitting = false; s.leads.unshift(a.payload); })
      .addCase(createLeadThunk.rejected, (s, a) => { s.isSubmitting = false; s.error = a.payload as string; });
    builder
      .addCase(updateLeadThunk.pending, s => { s.isSubmitting = true; })
      .addCase(updateLeadThunk.fulfilled, (s, a) => {
        s.isSubmitting = false;
        const apiLead = a.payload as unknown as { _id: string } & Lead;
        const idx = s.leads.findIndex(l => (l as unknown as { _id: string })._id === apiLead._id);
        if (idx !== -1) s.leads[idx] = a.payload;
        if (s.selectedLead) s.selectedLead = a.payload;
      })
      .addCase(updateLeadThunk.rejected, (s, a) => { s.isSubmitting = false; s.error = a.payload as string; });
    builder
      .addCase(updateLead.pending, s => { s.isSubmitting = true; })
      .addCase(updateLead.fulfilled, (s, a) => {
        s.isSubmitting = false;
        const idx = s.leads.findIndex(l => l.id === a.payload.id);
        if (idx !== -1) s.leads[idx] = a.payload;
        if (s.selectedLead?.id === a.payload.id) s.selectedLead = a.payload;
      })
      .addCase(updateLead.rejected, (s, a) => { s.isSubmitting = false; s.error = a.payload as string; });
    builder.addCase(patchLeadStatus.fulfilled, (s, a) => {
      const idx = s.leads.findIndex(l => l.id === a.payload.id);
      if (idx !== -1) s.leads[idx] = a.payload;
    });
    builder.addCase(deleteLeadThunk.fulfilled, (s, a) => {
      s.leads = s.leads.filter(l => l.id !== a.payload);
    });
    builder
      .addCase(fetchDashboardStats.pending, s => { s.isLoading = true; })
      .addCase(fetchDashboardStats.fulfilled, (s, a) => { s.isLoading = false; s.dashboardStats = a.payload; })
      .addCase(fetchDashboardStats.rejected, s => { s.isLoading = false; });
  },
});

export const { setFilter, clearError, clearSelectedLead, addLeadLocal, updateLeadStatusLocal } = leadsSlice.actions;
export default leadsSlice.reducer;
