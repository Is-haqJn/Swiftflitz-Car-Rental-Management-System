import axios, {
    type AxiosInstance,
    type AxiosError,
    type InternalAxiosRequestConfig,
    type AxiosResponse,
} from 'axios';
import { tokenManager } from '@/shared/config/tokenManager';
import { persistor, store } from '@/store';
import { clearAuth } from '@/store/slices/authSlice';
import { clearActiveBranch } from '@/store/slices/activeBranchSlice';
import { ROUTES } from '@/shared/routes';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

export const axiosClient: AxiosInstance = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    timeout: (import.meta.env.VITE_API_TIMEOUT_SECONDS || 30) * 1000, // 30 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        //'X-Requested-With': 'XMLHttpRequest', // For Laravel to recognize as AJAX request
    },
    withCredentials: true, // For Sanctum CSRF cookie
    //withXSRFToken: true, // Automatically include XSRF token from cookies
});

//* add request interceptor
axiosClient.interceptors.request.use(
    async (req: InternalAxiosRequestConfig) => {
        //? check if token mode
        if (tokenManager.isTokenMode()) {
            const token = tokenManager.getToken();
            if (token !== null) {
                req.headers['Authorization'] = `Bearer ${token}`;
            }
        }

        //? check if cookie mode
        if (tokenManager.isCookieMode()) {
            //! check if is changing data on server
            const isMutating = ['post', 'put', 'patch', 'delete'].includes(
                req.method?.toLowerCase() || ''
            );

            if (isMutating) {
                //? check if csrf token is in cookies
                const csrfToken = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('XSRF-TOKEN='));

                if (!csrfToken) {
                    //! fetch CSRF token from backend before mutating data
                    await authService.getCsrfCookie();
                }
            }
        }

        //? let browser handle form data and content type
        if (req.data instanceof FormData) {
            //* delete content type header to let browser set it with correct boundary
            delete req.headers['Content-Type'];
        }

        return req;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

//* add response interceptor
axiosClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        //? For example, if 401, we can dispatch logout action and redirect to login page
        if (error.response?.status === 401) {
            //* get isAuthented state from auth store
            const { isAuthenticated } = store.getState().auth;

            //* if authenticated, then we can assume token is invalid or expired, so we can remove it and logout
            if (isAuthenticated) {
                if (tokenManager.isTokenMode() && tokenManager.getToken()) {
                    tokenManager.removeToken();
                }

                //* clear auth state and peristed stated
                store.dispatch(clearAuth());
                store.dispatch(clearActiveBranch());
                await persistor.flush(); //? clear persisted state immediately

                //* redirect to login
                window.location.href = ROUTES.AUTH.AUTH_LOGIN;

                toast.error('Session Expired', { id: 'session-expired' });
            }
        }

        // if (error.response?.status === 403) {
        //     toast.error('You do not have permission to perform this action.', {
        //         id: 'permission-denied',
        //     });
        // }

        //! 419: CSRF token mismatch
        if (error.response?.status === 419) {
            //? TODO: get csrf token then reject error
            if (tokenManager.isCookieMode()) {
                await authService.getCsrfCookie();
            }
        }

        //? handle offline or network errors
        // if(!error.response) {
        //     toast.error('Network error. Please check your internet connection and try again.');
        // }

        return Promise.reject(error);
    }
);

//* export the axios client instance
export default axiosClient;
