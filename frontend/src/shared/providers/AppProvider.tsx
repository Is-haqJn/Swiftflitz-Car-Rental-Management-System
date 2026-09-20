import type { ReactNode } from 'react';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from './QueryClientProvider';

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
    return (
        <QueryClientProvider>
            <HelmetProvider>
                <BrowserRouter>{children}</BrowserRouter>
            </HelmetProvider>
        </QueryClientProvider>
    );
};
