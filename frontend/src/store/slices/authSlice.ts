import type { AuthState } from '@/shared/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isVerifying: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        //? Set the entire auth state (useful for login/logout)
        setAuth: (state, action: PayloadAction<AuthState['user']>) => {
            state.user = action.payload;
            //* If user is not null, we are authenticated
            state.isAuthenticated = !!state.user;
        },

        updateUser: (
            state,
            action: PayloadAction<Partial<AuthState['user']>>
        ) => {
            if (state.user) {
                //* Merge the existing user data with the new data
                state.user = { ...state.user, ...action.payload };
            }
        },

        clearAuth: state => {
            state.user = null;
            state.isAuthenticated = false;
        },

        setLoading: (state, action: PayloadAction<AuthState['isLoading']>) => {
            state.isLoading = action.payload;
        },

        setError: (state, action: PayloadAction<AuthState['error']>) => {
            state.error = action.payload;
        },

        setVerifying: (
            state,
            action: PayloadAction<AuthState['isVerifying']>
        ) => {
            state.isVerifying = action.payload;
        },
    },
});

export const {
    setAuth,
    updateUser,
    clearAuth,
    setLoading,
    setError,
    setVerifying,
} = authSlice.actions;

//! Export custom selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
    state.auth.isAuthenticated;
export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectUserRoles = (state: { auth: AuthState }) =>
    state.auth.user?.roles || [];
export const selectUserPermissions = (state: { auth: AuthState }) =>
    state.auth.user?.permissions || [];

export default authSlice.reducer;
