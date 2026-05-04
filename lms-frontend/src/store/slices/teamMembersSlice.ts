import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { TeamMemberRecord } from '@/types';
import { teamMembersService } from '@/services';

type TeamMemberPayload = Omit<TeamMemberRecord, 'id' | 'createdAt' | 'updatedAt'>;

export const fetchTeamMembers = createAsyncThunk(
  'teamMembers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await teamMembersService.getAll();
    } catch {
      return rejectWithValue('Failed to fetch team members');
    }
  },
);

export const addTeamMember = createAsyncThunk(
  'teamMembers/create',
  async (payload: TeamMemberPayload, { rejectWithValue }) => {
    try {
      return await teamMembersService.create(payload);
    } catch {
      return rejectWithValue('Failed to create team member');
    }
  },
);

export const updateTeamMember = createAsyncThunk(
  'teamMembers/update',
  async (payload: TeamMemberRecord, { rejectWithValue }) => {
    try {
      return await teamMembersService.update(payload.id, payload);
    } catch {
      return rejectWithValue('Failed to update team member');
    }
  },
);

export const deleteTeamMember = createAsyncThunk(
  'teamMembers/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await teamMembersService.delete(id);
      return id;
    } catch {
      return rejectWithValue('Failed to delete team member');
    }
  },
);

interface TeamMembersState {
  items: TeamMemberRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: TeamMembersState = {
  items: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

const teamMembersSlice = createSlice({
  name: 'teamMembers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeamMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(addTeamMember.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(addTeamMember.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.items.unshift(action.payload);
      })
      .addCase(addTeamMember.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateTeamMember.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateTeamMember.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateTeamMember.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    builder.addCase(deleteTeamMember.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
  },
});

export default teamMembersSlice.reducer;
