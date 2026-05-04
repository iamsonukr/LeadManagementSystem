import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { UserRecord } from '@/types';
import { usersService } from '@/services';

export type CreateUserPayload = Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'> & {
  password: string;
};

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await usersService.getAll();
    } catch {
      return rejectWithValue('Failed to fetch users');
    }
  },
);

export const addUser = createAsyncThunk(
  'users/create',
  async (payload: CreateUserPayload, { rejectWithValue }) => {
    try {
      return await usersService.create(payload);
    } catch {
      return rejectWithValue('Failed to create user');
    }
  },
);

export const updateUserRecord = createAsyncThunk(
  'users/update',
  async (payload: UserRecord, { rejectWithValue }) => {
    try {
      return await usersService.update(payload.id, payload);
    } catch {
      return rejectWithValue('Failed to update user');
    }
  },
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await usersService.delete(id);
      return id;
    } catch {
      return rejectWithValue('Failed to delete user');
    }
  },
);

interface UsersState {
  items: UserRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: UsersState = {
  items: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(addUser.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.items.unshift(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateUserRecord.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateUserRecord.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateUserRecord.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
  },
});

export default usersSlice.reducer;
