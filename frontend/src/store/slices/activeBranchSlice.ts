import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

interface ActiveBranchState {
    activeBranchId: string | null;
}

const initialState: ActiveBranchState = {
    activeBranchId: null,
};

const activeBranchSlice = createSlice({
    name: 'activeBranch',
    initialState,
    reducers: {
        setActiveBranch: (state, action: PayloadAction<string>) => {
            state.activeBranchId = action.payload;
        },
        clearActiveBranch: state => {
            state.activeBranchId = null;
        },
    },
});

export const { setActiveBranch, clearActiveBranch } = activeBranchSlice.actions;

export const selectActiveBranchId = (state: RootState) =>
    state.activeBranch.activeBranchId;

export default activeBranchSlice.reducer;
