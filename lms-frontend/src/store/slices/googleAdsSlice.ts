import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import googleAdsService, {
  GoogleAdsCampaign,
  CreateCampaignPayload,
  SyncResult,
  CampaignLeadsResult,
  CampaignLeadFilters,
} from '@/services/googleAdsService';

// ─── Async thunks ─────────────────────────────────────────────────────────────

export const fetchCampaigns = createAsyncThunk(
  'googleAds/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await googleAdsService.getAll(); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const createCampaign = createAsyncThunk(
  'googleAds/create',
  async (payload: CreateCampaignPayload, { rejectWithValue }) => {
    try { return await googleAdsService.create(payload); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const updateCampaign = createAsyncThunk(
  'googleAds/update',
  async (
    { id, payload }: { id: string; payload: Partial<CreateCampaignPayload> & { isActive?: boolean } },
    { rejectWithValue },
  ) => {
    try { return await googleAdsService.update(id, payload); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const deleteCampaign = createAsyncThunk(
  'googleAds/delete',
  async (id: string, { rejectWithValue }) => {
    try { await googleAdsService.delete(id); return id; }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const syncCampaign = createAsyncThunk(
  'googleAds/sync',
  async (id: string, { rejectWithValue }) => {
    try { return await googleAdsService.sync(id); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const fetchCampaignLeads = createAsyncThunk(
  'googleAds/fetchLeads',
  async (
    { id, filters }: { id: string; filters?: CampaignLeadFilters },
    { rejectWithValue },
  ) => {
    try { return await googleAdsService.getCampaignLeads(id, filters); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

// ─── State ────────────────────────────────────────────────────────────────────

interface GoogleAdsState {
  campaigns: GoogleAdsCampaign[];
  activeCampaignLeads: CampaignLeadsResult | null;
  syncResults: Record<string, SyncResult>;
  isSyncing: Record<string, boolean>;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  leadsLoading: boolean;
  leadsError: string | null;
}

const initialState: GoogleAdsState = {
  campaigns: [],
  activeCampaignLeads: null,
  syncResults: {},
  isSyncing: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
  leadsLoading: false,
  leadsError: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const googleAdsSlice = createSlice({
  name: 'googleAds',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    clearLeads(state) { state.activeCampaignLeads = null; },
  },
  extraReducers: (builder) => {
    // Fetch all campaigns
    builder
      .addCase(fetchCampaigns.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchCampaigns.fulfilled, (s, a) => { s.isLoading = false; s.campaigns = a.payload; })
      .addCase(fetchCampaigns.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });

    // Create
    builder
      .addCase(createCampaign.pending, (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(createCampaign.fulfilled, (s, a) => { s.isSubmitting = false; s.campaigns.unshift(a.payload); })
      .addCase(createCampaign.rejected, (s, a) => { s.isSubmitting = false; s.error = a.payload as string; });

    // Update
    builder
      .addCase(updateCampaign.fulfilled, (s, a) => {
        const idx = s.campaigns.findIndex((c) => c._id === a.payload._id);
        if (idx !== -1) s.campaigns[idx] = a.payload;
      });

    // Delete
    builder
      .addCase(deleteCampaign.fulfilled, (s, a) => {
        s.campaigns = s.campaigns.filter((c) => c._id !== a.payload);
      });

    // Sync
    builder
      .addCase(syncCampaign.pending, (s, a) => {
        s.isSyncing[a.meta.arg] = true;
        // Optimistically mark the campaign as syncing
        const c = s.campaigns.find((c) => c._id === a.meta.arg);
        if (c) c.syncStatus = 'syncing';
      })
      .addCase(syncCampaign.fulfilled, (s, a) => {
        s.isSyncing[a.meta.arg] = false;
        s.syncResults[a.meta.arg] = a.payload;
        // Refresh campaign in list
        const c = s.campaigns.find((c) => c._id === a.meta.arg);
        if (c) {
          c.syncStatus = 'success';
          c.lastSyncedAt = a.payload.syncedAt;
          c.totalLeadsImported += a.payload.imported;
        }
      })
      .addCase(syncCampaign.rejected, (s, a) => {
        s.isSyncing[a.meta.arg] = false;
        const c = s.campaigns.find((c) => c._id === a.meta.arg);
        if (c) c.syncStatus = 'error';
      });

    // Fetch campaign leads
    builder
      .addCase(fetchCampaignLeads.pending, (s) => { s.leadsLoading = true; s.leadsError = null; })
      .addCase(fetchCampaignLeads.fulfilled, (s, a) => { s.leadsLoading = false; s.activeCampaignLeads = a.payload; })
      .addCase(fetchCampaignLeads.rejected, (s, a) => { s.leadsLoading = false; s.leadsError = a.payload as string; });
  },
});

export const { clearError, clearLeads } = googleAdsSlice.actions;
export default googleAdsSlice.reducer;