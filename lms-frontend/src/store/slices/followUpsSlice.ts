import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { FollowUpRecord } from '@/types';
import { followUpsService } from '@/services';

export const fetchFollowUps = createAsyncThunk('followUps/fetchAll', async (params: Record<string, string | number> = {}, { rejectWithValue }) => {
  try { return await followUpsService.getAll(params); }
  catch { return rejectWithValue('Failed to fetch follow-ups'); }
});

export const addFollowUp = createAsyncThunk('followUps/create', async (payload: FollowUpRecord, { rejectWithValue }) => {
  try { return await followUpsService.create({ ...payload, lead: payload.leadId }); }
  catch { return rejectWithValue('Failed to create follow-up'); }
});

export const updateFollowUp = createAsyncThunk('followUps/update', async (payload: FollowUpRecord, { rejectWithValue }) => {
  try { return await followUpsService.update(payload.id, { ...payload, lead: payload.leadId } as Partial<FollowUpRecord>); }
  catch { return rejectWithValue('Failed to update follow-up'); }
});

export const deleteFollowUp = createAsyncThunk('followUps/delete', async (id: string, { rejectWithValue }) => {
  try { await followUpsService.delete(id); return id; }
  catch { return rejectWithValue('Failed to delete follow-up'); }
});

interface FollowUpsState {
  items: FollowUpRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: FollowUpsState = {
  items: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

const followUpsSlice = createSlice({
  name: 'followUps',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFollowUps.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchFollowUps.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload.data; })
      .addCase(fetchFollowUps.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });
    builder
      .addCase(addFollowUp.pending, (state) => { state.isSubmitting = true; state.error = null; })
      .addCase(addFollowUp.fulfilled, (state, action) => { state.isSubmitting = false; state.items.unshift(action.payload); })
      .addCase(addFollowUp.rejected, (state, action) => { state.isSubmitting = false; state.error = action.payload as string; });
    builder.addCase(updateFollowUp.fulfilled, (state, action) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    });
    builder.addCase(deleteFollowUp.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
  },
});

export default followUpsSlice.reducer;
