import axios, {
    type AxiosInstance,
    type AxiosError,
    type InternalAxiosRequestConfig,
    type AxiosResponse,
} from 'axios';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const axiosClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    withCredentials: true, // For Sanctum CSRF cookie
});

//* add request interceptor
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        //! TODO: get token from auth store and add to headers

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

//* add response interceptor
axiosClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        //! TODO: handle global errors like 401, 403, 500 etc.
        //? For example, if 401, we can dispatch logout action and redirect to login page
        if (error.response?.status === 401) {
            //? dispatch logout action
        }

        return Promise.reject(error);
    }
);

//* export the axios client instance
export default axiosClient;
