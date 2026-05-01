import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CallLog } from '@/types';
import { callsService } from '@/services/index';

export const fetchCalls = createAsyncThunk('calls/fetchAll', async (params: Record<string, string | number> = {}, { rejectWithValue }) => {
  try { return await callsService.getAll(params); }
  catch { return rejectWithValue('Failed to fetch calls'); }
});

export const createCallThunk = createAsyncThunk('calls/create', async (payload: Partial<CallLog> & { lead: string }, { rejectWithValue }) => {
  try { return await callsService.create(payload); }
  catch (err: unknown) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const addCall = createAsyncThunk('calls/addFromRecord', async (payload: Partial<CallLog>, { rejectWithValue }) => {
  try {
    return await callsService.create({ ...payload, lead: payload.leadId ?? '' });
  } catch (err: unknown) {
    return rejectWithValue(err instanceof Error ? err.message : 'Failed');
  }
});

export const updateCall = createAsyncThunk('calls/update', async (payload: CallLog, { rejectWithValue }) => {
  try {
    return await callsService.update(payload.id, { ...payload, lead: payload.leadId } as Partial<CallLog>);
  } catch {
    return rejectWithValue('Failed to update call');
  }
});

export const deleteCall = createAsyncThunk('calls/delete', async (id: string, { rejectWithValue }) => {
  try { await callsService.delete(id); return id; }
  catch { return rejectWithValue('Failed to delete call'); }
});

export const fetchCallStats = createAsyncThunk('calls/stats', async (_, { rejectWithValue }) => {
  try { return await callsService.getStats(); }
  catch { return rejectWithValue('Failed'); }
});

interface CallsState {
  calls: CallLog[];
  stats: { byStatus: Array<{ _id: string; count: number }>; byDirection: Array<{ _id: string; count: number }>; totalThisWeek: number } | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: CallsState = { calls: [], stats: null, isLoading: false, isSubmitting: false, error: null };

const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    addCallLocal(state, action: PayloadAction<CallLog>) { state.calls.unshift(action.payload); },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCalls.pending, s => { s.isLoading = true; })
      .addCase(fetchCalls.fulfilled, (s, a) => { s.isLoading = false; s.calls = a.payload.data; })
      .addCase(fetchCalls.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });
    builder
      .addCase(createCallThunk.pending, s => { s.isSubmitting = true; })
      .addCase(createCallThunk.fulfilled, (s, a) => { s.isSubmitting = false; s.calls.unshift(a.payload); })
      .addCase(createCallThunk.rejected, (s, a) => { s.isSubmitting = false; s.error = a.payload as string; });
    builder
      .addCase(addCall.pending, s => { s.isSubmitting = true; })
      .addCase(addCall.fulfilled, (s, a) => { s.isSubmitting = false; s.calls.unshift(a.payload); })
      .addCase(addCall.rejected, (s, a) => { s.isSubmitting = false; s.error = a.payload as string; });
    builder
      .addCase(updateCall.fulfilled, (s, a) => {
        const idx = s.calls.findIndex(call => call.id === a.payload.id);
        if (idx !== -1) s.calls[idx] = a.payload;
      })
      .addCase(deleteCall.fulfilled, (s, a) => {
        s.calls = s.calls.filter(call => call.id !== a.payload);
      });
    builder
      .addCase(fetchCallStats.fulfilled, (s, a) => { s.stats = a.payload; });
  },
});

export const { addCallLocal } = callsSlice.actions;
export default callsSlice.reducer;
