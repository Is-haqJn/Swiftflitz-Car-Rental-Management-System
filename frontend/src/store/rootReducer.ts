import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import settingsReducer from '@/store/slices/settingsSlice';
import activeBranchReducer from '@/store/slices/activeBranchSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    settings: settingsReducer,
    activeBranch: activeBranchReducer,
});

export type rootReducerState = ReturnType<typeof rootReducer>;
export default rootReducer;
