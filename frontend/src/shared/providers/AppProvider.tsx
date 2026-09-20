import type { ReactNode } from 'react';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from './QueryClientProvider';
import { Toaster } from 'react-hot-toast';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { AuthProvider } from '../context/AuthContext';
import { AppBootSkeleton } from '@/admin/components/skeletons/AppBootSkeleton';

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
    return (
        <ReduxProvider store={store}>
            {/* PersistGate delays rendering until persisted state is loaded */}
            <PersistGate loading={<AppBootSkeleton />} persistor={persistor}>
                <QueryClientProvider>
                    <HelmetProvider>
                        <BrowserRouter>
                            <AuthProvider>
                                {children}
                                <Toaster
                                    position="top-center"
                                    containerStyle={{ zIndex: 99999 }}
                                    toastOptions={{
                                        //duration: 4000,
                                        success: {
                                            duration: 5000,
                                        },
                                        error: {
                                            duration: 6000,
                                        },
                                        loading: {
                                            duration: 240000, // 4m
                                        },
                                    }}
                                />
                            </AuthProvider>
                        </BrowserRouter>
                    </HelmetProvider>
                </QueryClientProvider>
            </PersistGate>
        </ReduxProvider>
    );
};
