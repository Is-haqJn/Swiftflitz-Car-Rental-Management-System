import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, //? 5 minutes //? data considered fresh for 5 minutes
            gcTime: 1000 * 60 * 30, //? 30 minutes //? unused data removed from cache after 30 minutes
            retry: 2, //? retry failed requests twice
            refetchOnReconnect: false, //? do not refetch on window focus
        },
        mutations: {
            retry: 1, //? do not retry failed mutations
        },
    },
});
