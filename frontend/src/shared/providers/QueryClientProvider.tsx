import { lazy, Suspense } from 'react';
import { QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/libs/queryClient';
import { type ReactNode } from 'react';

const ReactQueryDevtools = import.meta.env.VITE_DEBUG_MODE === 'true'
    ? lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
    : null;

interface QueryClientProviderProps {
    children: ReactNode;
}

export const QueryClientProvider = ({ children }: QueryClientProviderProps) => (
    <TanStackQueryClientProvider client={queryClient}>
        {children}
        {ReactQueryDevtools && (
            <Suspense fallback={null}>
                <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
        )}
    </TanStackQueryClientProvider>
);
