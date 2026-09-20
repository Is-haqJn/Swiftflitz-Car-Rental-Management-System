import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

/* Types */
export interface AppSettings {
    site_name: string;
    site_email: string;
    site_phone: string;
    site_address: string;
    currency: string;
    currency_symbol: string;
    timezone: string;
    logo_url: string | null;
    favicon_url: string | null;
    maintenance_mode: boolean;
}

interface SettingsState {
    settings: AppSettings | null;
}

/* Initial State */
const initialState: SettingsState = {
    settings: null,
};

/* Slice */
const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        //? Overwrite all settings (e.g. after fetching from the API)
        setSettings: (state, action: PayloadAction<AppSettings>) => {
            state.settings = action.payload;
        },

        //? Merge a partial update into existing settings
        updateSettings: (
            state,
            action: PayloadAction<Partial<AppSettings>>
        ) => {
            if (state.settings) {
                state.settings = { ...state.settings, ...action.payload };
            }
        },

        //? Clear settings on logout
        clearSettings: state => {
            state.settings = null;
        },
    },
});

export const { setSettings, updateSettings, clearSettings } =
    settingsSlice.actions;

/* Selectors */
export const selectSettings = (state: RootState) => state.settings.settings;
export const selectCurrencySymbol = (state: RootState) =>
    state.settings.settings?.currency_symbol ?? '₵';
export const selectSiteName = (state: RootState) =>
    state.settings.settings?.site_name ?? 'Swiftflitz';
export const selectMaintenanceModeEnabled = (state: RootState) =>
    state.settings.settings?.maintenance_mode ?? false;

export default settingsSlice.reducer;
