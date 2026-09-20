import { authService } from '@/services/authService';
import { tokenManager } from '@/shared/config/tokenManager';
import { ROUTES } from '@/shared/routes';
import type {
    ForgotPasswordData,
    LoginCredentials,
    RegisterData,
    ResetPasswordData,
} from '@/shared/types';
import store, { persistor } from '@/store';
import { clearAuth, setAuth } from '@/store/slices/authSlice';
import { clearActiveBranch } from '@/store/slices/activeBranchSlice';
import { getErrorMessage } from '@/shared/libs/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

//! auth keys for query management
export const authKeys = {
    all: ['auth'] as const,
    me: () => [...authKeys.all, 'me'] as const,
};

/**
 * verify session and fetch user data if authenticated
 * and verify if token is valid
 */
export const useCurrentUser = () => {
    //* get current user data
    return useQuery({
        queryKey: authKeys.me(),
        queryFn: async () => {
            try {
                const user = await authService.getCurrentUser();
                const authUser = {
                    ...user.data,
                    roles:
                        user.data.roles?.map(role => role ?? role) ?? undefined,
                };
                store.dispatch(setAuth(authUser));
                return user.data;
            } catch (error) {
                //? clean up session exired
                //? Don't clear on 419 (CSRF), 500 (server error), or network errors
                if ((error as AxiosError)?.response?.status === 401) {
                    store.dispatch(clearAuth());
                    store.dispatch(clearActiveBranch());
                    await persistor.flush(); //? clear persisted state immediately
                }
                //console.log(error)
                throw error;
            }
        },
        /* fire whenever a valid token exists in localStorage, regardless of Redux auth state.
           authService.isAuthenticated() checks BOTH token AND Redux isAuthenticated, so it
           returns false after clearAuth() even when a valid token was just restored - which
           prevents the query from re-running and leaves the user permanently logged out.
           Checking only the token lets the query refetch after impersonation stop, session
           restore, or any other state-reset path. A 401 response still clears auth. */
        enabled: !!tokenManager.getToken(),
        // retry: (failureCount, error) => {
        //     //? don't retry on 401 (unauthorized)
        //     if((error as AxiosError)?.response?.status === 401) {
        //         return false
        //     }
        //     return failureCount < 1;
        // },
        refetchOnMount: true,
        refetchOnWindowFocus: true, //? re-verify when user returns to tab
        refetchInterval: 1000 * 60 * 15, //? re-verify every 5 minutes
    });
};

/**
 * Login
 */
export const useLogin = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();

    return useMutation({
        mutationFn: (credentials: LoginCredentials) =>
            authService.login(credentials),
        onMutate: () => toast.loading('Signing In..', { id: 'login' }),
        onSuccess: ({ data, message }) => {
            //? set auth state with user data
            const authUser = {
                ...data.user,
                roles: data.user.roles?.map(r => r ?? r) ?? undefined,
            };
            store.dispatch(setAuth(authUser));
            store.dispatch(clearActiveBranch());
            queryClient.setQueryData(authKeys.me(), data.user);

            //? TODO: add toast message
            toast.success(message, { id: 'login' });

            //? redirect user to the intended page or dashboard if no intended page
            const from =
                (location.state as { from?: { pathname: string } })?.from
                    ?.pathname || ROUTES.DASHBOARD.ROOT;
            navigate(from, { replace: true });
        },
        onError: (error: AxiosError<{ message: string }>) => {
            if (!error.response) {
                toast.error(
                    'Network error. Please check your connection and try again.',
                    { id: 'login' }
                );
            } else {
                toast.error(
                    getErrorMessage(error, 'Login failed. Please try again.'),
                    { id: 'login' }
                );
            }
        },
    });
};

/**
 * Register
 */
export const useRegister = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: RegisterData) => authService.register(data),
        onSuccess: ({ data, message }) => {
            //? set auth state with user data
            const authUser = {
                ...data.user,
                roles: data.user.roles?.map(role => role ?? role) ?? undefined,
            };
            store.dispatch(setAuth(authUser));
            queryClient.setQueryData(authKeys.me(), data.user);
            //? TODO: add toast message
            toast.success(message);

            //? redirect user to dashboard
            navigate(ROUTES.DASHBOARD.ROOT, { replace: true });
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(
                getErrorMessage(error, 'Registration failed. Please try again.')
            );
            //console.log(error)
        },
    });
};

/**
 * Logout
 */
export const useLogout = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: () => authService.logout(),
        onMutate: () => toast.loading('Logging out...', { id: 'logout' }),
        onSettled: async () => {
            //? always clear regardless of api success/failure to avoid stale session
            //? clear auth state and queries
            store.dispatch(clearAuth());
            await persistor.flush(); //? clear persisted state immediately
            await persistor.purge(); //? purge persisted state to ensure complete cleanup
            queryClient.removeQueries(); //? clear all queries to remove any cached data

            //! TODO: add toast message for logout success or failure
            toast.success('Logout successful', { id: 'logout' });

            navigate(ROUTES.AUTH.AUTH_LOGIN, { replace: true });
        },
    });
};

/**
 * Forgot password
 */
export const useForgotPassword = () => {
    return useMutation({
        mutationFn: ({ email }: ForgotPasswordData) =>
            authService.forgetPassword({ email }),
        onSuccess: ({ message }) => {
            //? TODO: add toast message for success
            toast.success(message);
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(
                getErrorMessage(
                    error,
                    'Forgot password request failed. Please try again.'
                )
            );
            //console.log(error);
        },
    });
};

/**
 * Reset password
 */
export const useResetPassword = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: ResetPasswordData) =>
            authService.resetPassword(data),
        onSuccess: ({ message }) => {
            //! TODO: add toast message for success
            toast.success(message);

            navigate(ROUTES.AUTH.LOGIN, { replace: true });
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(
                getErrorMessage(
                    error,
                    'Reset password request failed. Please try again.'
                )
            );
        },
    });
};
