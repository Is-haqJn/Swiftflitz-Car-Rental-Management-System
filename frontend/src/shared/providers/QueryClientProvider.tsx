import { QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/libs/queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode } from 'react';

interface QueryClientProviderProps {
    children: ReactNode;
}

export const QueryClientProvider = ({ children }: QueryClientProviderProps) => (
    <TanStackQueryClientProvider client={queryClient}>
        {children}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </TanStackQueryClientProvider>
);
