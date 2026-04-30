import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { followUpRecords } from '@/data/mockData';
import { FollowUpRecord } from '@/types';

interface FollowUpsState {
  items: FollowUpRecord[];
}

const initialState: FollowUpsState = {
  items: followUpRecords,
};

const followUpsSlice = createSlice({
  name: 'followUps',
  initialState,
  reducers: {
    addFollowUp(state, action: PayloadAction<FollowUpRecord>) {
      state.items.unshift(action.payload);
    },
    updateFollowUp(state, action: PayloadAction<FollowUpRecord>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteFollowUp(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addFollowUp, updateFollowUp, deleteFollowUp } = followUpsSlice.actions;
export default followUpsSlice.reducer;
