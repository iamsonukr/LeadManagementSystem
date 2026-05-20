import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import metaAdsService, {
  MetaAdsCampaign,
  CreateMetaCampaignPayload,
  MetaSyncResult,
  MetaCampaignLeadsResult,
  MetaCampaignLeadFilters,
} from '@/services/metaAdsService';

// ─── Async thunks ─────────────────────────────────────────────────────────────

export const fetchMetaCampaigns = createAsyncThunk(
  'metaAds/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await metaAdsService.getAll(); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const createMetaCampaign = createAsyncThunk(
  'metaAds/create',
  async (payload: CreateMetaCampaignPayload, { rejectWithValue }) => {
    try { return await metaAdsService.create(payload); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const updateMetaCampaign = createAsyncThunk(
  'metaAds/update',
  async (
    { id, payload }: { id: string; payload: Partial<CreateMetaCampaignPayload> & { isActive?: boolean } },
    { rejectWithValue },
  ) => {
    try { return await metaAdsService.update(id, payload); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const deleteMetaCampaign = createAsyncThunk(
  'metaAds/delete',
  async (id: string, { rejectWithValue }) => {
    try { await metaAdsService.delete(id); return id; }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const syncMetaCampaign = createAsyncThunk(
  'metaAds/sync',
  async (id: string, { rejectWithValue }) => {
    try { return await metaAdsService.sync(id); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

export const fetchMetaCampaignLeads = createAsyncThunk(
  'metaAds/fetchLeads',
  async (
    { id, filters }: { id: string; filters?: MetaCampaignLeadFilters },
    { rejectWithValue },
  ) => {
    try { return await metaAdsService.getCampaignLeads(id, filters); }
    catch (e: unknown) { return rejectWithValue((e as Error).message); }
  },
);

// ─── State ────────────────────────────────────────────────────────────────────

interface MetaAdsState {
  campaigns: MetaAdsCampaign[];
  activeCampaignLeads: MetaCampaignLeadsResult | null;
  syncResults: Record<string, MetaSyncResult>;
  isSyncing: Record<string, boolean>;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  leadsLoading: boolean;
  leadsError: string | null;
}

const initialState: MetaAdsState = {
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

const metaAdsSlice = createSlice({
  name: 'metaAds',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    clearLeads(state) { state.activeCampaignLeads = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetaCampaigns.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchMetaCampaigns.fulfilled, (s, a) => { s.isLoading = false; s.campaigns = a.payload; })
      .addCase(fetchMetaCampaigns.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });

    builder
      .addCase(createMetaCampaign.pending, (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(createMetaCampaign.fulfilled, (s, a) => { s.isSubmitting = false; s.campaigns.unshift(a.payload); })
      .addCase(createMetaCampaign.rejected, (s, a) => { s.isSubmitting = false; s.error = a.payload as string; });

    builder
      .addCase(updateMetaCampaign.fulfilled, (s, a) => {
        const idx = s.campaigns.findIndex((c) => c._id === a.payload._id);
        if (idx !== -1) s.campaigns[idx] = a.payload;
      });

    builder
      .addCase(deleteMetaCampaign.fulfilled, (s, a) => {
        s.campaigns = s.campaigns.filter((c) => c._id !== a.payload);
      });

    builder
      .addCase(syncMetaCampaign.pending, (s, a) => {
        s.isSyncing[a.meta.arg] = true;
        const c = s.campaigns.find((c) => c._id === a.meta.arg);
        if (c) c.syncStatus = 'syncing';
      })
      .addCase(syncMetaCampaign.fulfilled, (s, a) => {
        s.isSyncing[a.meta.arg] = false;
        s.syncResults[a.meta.arg] = a.payload;
        const c = s.campaigns.find((c) => c._id === a.meta.arg);
        if (c) {
          c.syncStatus = 'active';
          c.lastSyncedAt = a.payload.syncedAt;
          c.totalLeadsImported += a.payload.imported;
        }
      })
      .addCase(syncMetaCampaign.rejected, (s, a) => {
        s.isSyncing[a.meta.arg] = false;
        const c = s.campaigns.find((c) => c._id === a.meta.arg);
        if (c) c.syncStatus = 'error';
      });

    builder
      .addCase(fetchMetaCampaignLeads.pending, (s) => { s.leadsLoading = true; s.leadsError = null; })
      .addCase(fetchMetaCampaignLeads.fulfilled, (s, a) => { s.leadsLoading = false; s.activeCampaignLeads = a.payload; })
      .addCase(fetchMetaCampaignLeads.rejected, (s, a) => { s.leadsLoading = false; s.leadsError = a.payload as string; });
  },
});

export const { clearError, clearLeads } = metaAdsSlice.actions;
export default metaAdsSlice.reducer;
