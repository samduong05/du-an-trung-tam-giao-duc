import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppDispatch } from "../index";

export type UserRole = "admin" | "teacher" | "student";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const storedToken = localStorage.getItem("accessToken");

const initialState: AuthState = {
  user: null,
  accessToken: storedToken,
  isAuthenticated: Boolean(storedToken),
  isLoading: Boolean(storedToken),
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        accessToken: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;

      localStorage.setItem(
        "accessToken",
        action.payload.accessToken,
      );
    },

    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      localStorage.removeItem("accessToken");
    },

    setLoading: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setCredentials,
  setUser,
  logout,
  setLoading,
} = authSlice.actions;

export default authSlice.reducer;

export const performLogout =
  () => async (dispatch: AppDispatch) => {
    dispatch(logout());

    const { apiSlice } = await import("../api/apiSlice");

    dispatch(apiSlice.util.resetApiState());
  };

export const selectCurrentUser = (state: {
  auth: AuthState;
}) => state.auth.user;

export const selectIsAuthenticated = (state: {
  auth: AuthState;
}) => state.auth.isAuthenticated;

export const selectUserRole = (state: {
  auth: AuthState;
}) => state.auth.user?.role;

export const selectAuthLoading = (state: {
  auth: AuthState;
}) => state.auth.isLoading;