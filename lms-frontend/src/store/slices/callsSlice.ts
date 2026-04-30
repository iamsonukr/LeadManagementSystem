import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CallLog } from '@/types';
import { callLogs } from '@/data/mockData';

interface CallsState {
  calls: CallLog[];
  isLoading: boolean;
}

const initialState: CallsState = {
  calls: callLogs,
  isLoading: false,
};

const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    addCall(state, action: PayloadAction<CallLog>) {
      state.calls.unshift(action.payload);
    },
    updateCall(state, action: PayloadAction<CallLog>) {
      const index = state.calls.findIndex((call) => call.id === action.payload.id);
      if (index !== -1) {
        state.calls[index] = action.payload;
      }
    },
    deleteCall(state, action: PayloadAction<string>) {
      state.calls = state.calls.filter((call) => call.id !== action.payload);
    },
    setCalls(state, action: PayloadAction<CallLog[]>) {
      state.calls = action.payload;
    },
  },
});

export const { addCall, updateCall, deleteCall, setCalls } = callsSlice.actions;
export default callsSlice.reducer;
