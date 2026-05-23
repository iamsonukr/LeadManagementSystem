import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import websiteLeadsService, {
  WebsiteSource,
  CreateWebsiteSourcePayload,
  SourceLeadsResult,
  SourceLeadFilters,
  DashboardStats,
} from '@/services/websiteLeadsService';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchWebsiteSources = createAsyncThunk(
  'websiteLeads/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await websiteLeadsService.getAll(); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const createWebsiteSource = createAsyncThunk(
  'websiteLeads/create',
  async (payload: CreateWebsiteSourcePayload, { rejectWithValue }) => {
    try { return await websiteLeadsService.create(payload); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const updateWebsiteSource = createAsyncThunk(
  'websiteLeads/update',
  async (
    { id, payload }: { id: string; payload: Partial<CreateWebsiteSourcePayload> & { isActive?: boolean } },
    { rejectWithValue },
  ) => {
    try { return await websiteLeadsService.update(id, payload); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const deleteWebsiteSource = createAsyncThunk(
  'websiteLeads/delete',
  async (id: string, { rejectWithValue }) => {
    try { await websiteLeadsService.delete(id); return id; }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const fetchSourceLeads = createAsyncThunk(
  'websiteLeads/fetchLeads',
  async ({ id, filters }: { id: string; filters?: SourceLeadFilters }, { rejectWithValue }) => {
    try { return await websiteLeadsService.getSourceLeads(id, filters); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const fetchDashboardStats = createAsyncThunk(
  'websiteLeads/fetchStats',
  async (_, { rejectWithValue }) => {
    try { return await websiteLeadsService.getDashboardStats(); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

// ─── State ────────────────────────────────────────────────────────────────────

interface WebsiteLeadsState {
  sources: WebsiteSource[];
  activeSourceLeads: SourceLeadsResult | null;
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  isSubmitting: boolean;
  leadsLoading: boolean;
  statsLoading: boolean;
  error: string | null;
}

const initialState: WebsiteLeadsState = {
  sources: [],
  activeSourceLeads: null,
  dashboardStats: null,
  isLoading: false,
  isSubmitting: false,
  leadsLoading: false,
  statsLoading: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const websiteLeadsSlice = createSlice({
  name: 'websiteLeads',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    clearLeads(state) { state.activeSourceLeads = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWebsiteSources.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchWebsiteSources.fulfilled, (s, a) => { s.isLoading = false; s.sources = a.payload; })
      .addCase(fetchWebsiteSources.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });

    builder
      .addCase(createWebsiteSource.pending, (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(createWebsiteSource.fulfilled, (s, a) => { s.isSubmitting = false; s.sources.unshift(a.payload); })
      .addCase(createWebsiteSource.rejected, (s, a) => { s.isSubmitting = false; s.error = a.payload as string; });

    builder
      .addCase(updateWebsiteSource.fulfilled, (s, a) => {
        const idx = s.sources.findIndex((src) => src._id === a.payload._id);
        if (idx !== -1) s.sources[idx] = a.payload;
      });

    builder
      .addCase(deleteWebsiteSource.fulfilled, (s, a) => {
        s.sources = s.sources.filter((src) => src._id !== a.payload);
      });

    builder
      .addCase(fetchSourceLeads.pending, (s) => { s.leadsLoading = true; })
      .addCase(fetchSourceLeads.fulfilled, (s, a) => { s.leadsLoading = false; s.activeSourceLeads = a.payload; })
      .addCase(fetchSourceLeads.rejected, (s, a) => { s.leadsLoading = false; s.error = a.payload as string; });

    builder
      .addCase(fetchDashboardStats.pending, (s) => { s.statsLoading = true; })
      .addCase(fetchDashboardStats.fulfilled, (s, a) => { s.statsLoading = false; s.dashboardStats = a.payload; })
      .addCase(fetchDashboardStats.rejected, (s) => { s.statsLoading = false; });
  },
});

export const { clearError, clearLeads } = websiteLeadsSlice.actions;
export default websiteLeadsSlice.reducer;
