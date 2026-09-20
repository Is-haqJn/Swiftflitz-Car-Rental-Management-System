import { configureStore } from '@reduxjs/toolkit';
import {
    useDispatch,
    useSelector,
    type TypedUseSelectorHook,
} from 'react-redux';
import storage from 'redux-persist/lib/storage';
import {
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
    persistStore,
} from 'redux-persist';
import rootReducer from './rootReducer';

//! Persist config
const persistConfig = {
    key: import.meta.env.VITE_PERSIST_KEY || 'root',
    version: 1,
    storage,
    whitelist: ['auth', 'settings', 'activeBranch'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            //? required to ignore redux-persist actions in serializability check
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
            },
        }),
    devTools: import.meta.env.DEV, // Enable Redux DevTools only in development
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch.withTypes<AppDispatch>();
// export const useAppSelector = () => useSelector.withTypes<RootState>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
