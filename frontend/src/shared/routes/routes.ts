//! Route path constants

export const ROUTES = {
    //? Frontend route
    HOME: '/',
    ABOUT: '/about',

    //? Auth routes
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_EMAIL_TOKEN: '/auth/verify-email/:token',

    //? Dashboard routes
    DASHBOARD: '/management/dashboard',
    DASHBOARD_PROFILE: '/management/profile',

    //? Dashboard - Users
    DASHBOARD_USERS: '/management/users',
    DASHBOARD_USER_CREATE: '/management/users/create',
    DASHBOARD_USER_EDIT: '/management/users/edit/:id',
    DASHBOARD_USER_VIEW: '/management/users/:id',
    DASHBOARD_USER_DELETE: '/management/users/delete/:id',

    //? Error Pages
    NOT_FOUND: '/404',
    FORBIDDEN: '/403',
    SERVER_ERROR: '/500',
};
