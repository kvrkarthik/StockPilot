import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../services/api";
import type { TokenPair, User } from "../types";

interface AuthState { user: User | null; loading: boolean; initialized: boolean }
const initialState: AuthState = { user: null, loading: false, initialized: false };

export const loadUser = createAsyncThunk("auth/loadUser", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<User>("/auth/me");
    if (!data || typeof data !== "object" || !("email" in data)) {
      return rejectWithValue("Invalid user response");
    }
    return data;
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const login = createAsyncThunk("auth/login", async (credentials: { email: string; password: string }) => {
  const { data } = await api.post<TokenPair>("/auth/login", credentials);
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data.user;
});

const slice = createSlice({
  name: "auth", initialState,
  reducers: {
    setInitialized(state) {
      state.initialized = true;
    },
    logout(state) {
      const refresh_token = localStorage.getItem("refresh_token");
      if (refresh_token) void api.post("/auth/logout", { refresh_token });
      localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); state.user = null;
    },
  },
  extraReducers: (builder) => builder
    .addCase(login.pending, (state) => { state.loading = true; })
    .addCase(login.fulfilled, (state, action: PayloadAction<User>) => { state.user = action.payload; state.loading = false; state.initialized = true; })
    .addCase(login.rejected, (state) => { state.loading = false; })
    .addCase(loadUser.fulfilled, (state, action) => { state.user = action.payload as User; state.initialized = true; })
    .addCase(loadUser.rejected, (state) => { state.user = null; state.initialized = true; }),
});
export const { logout, setInitialized } = slice.actions;
export default slice.reducer;

