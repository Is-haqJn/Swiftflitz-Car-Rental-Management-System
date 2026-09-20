const ORIGINAL_TOKEN_KEY = 'original_auth_token';
const ORIGINAL_USER_NAME_KEY = 'original_auth_user_name';
const TOKEN_EXPIRES_AT_KEY = 'auth_token_expires_at';
const IMPERSONATION_STARTED_AT_KEY = 'impersonation_started_at';
const IMPERSONATION_TTL_MS = 60 * 60 * 1000; // 60 minutes - matches backend token expiry

export const tokenManager = {
    getToken: (): string | null => {
        const token = localStorage.getItem(
            import.meta.env.VITE_TOKEN_KEY || 'auth_token'
        );
        if (!token) {
            return null;
        }
        const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
        if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
            tokenManager.removeToken();
            return null;
        }
        return token;
    },
    setToken: (token: string): void => {
        localStorage.setItem(
            import.meta.env.VITE_TOKEN_KEY || 'auth_token',
            token
        );
    },
    removeToken: (): void => {
        localStorage.removeItem(import.meta.env.VITE_TOKEN_KEY || 'auth_token');
        localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
    },
    getAuthMode: (): 'cookie' | 'token' => {
        return import.meta.env.VITE_AUTH_MODE === 'cookie' ? 'cookie' : 'token';
    },
    isTokenMode: (): boolean => {
        return tokenManager.getAuthMode() === 'token';
    },
    isCookieMode: (): boolean => {
        return tokenManager.getAuthMode() === 'cookie';
    },

    /* Impersonation */
    /** Returns true when currently impersonating and the session has not expired. */
    isImpersonating: (): boolean => {
        if (!localStorage.getItem(ORIGINAL_TOKEN_KEY)) {
            return false;
        }
        const startedAt = localStorage.getItem(IMPERSONATION_STARTED_AT_KEY);
        if (
            startedAt &&
            Date.now() - parseInt(startedAt, 10) > IMPERSONATION_TTL_MS
        ) {
            tokenManager.stopImpersonation();
            return false;
        }
        return true;
    },

    /**
     * Save the current admin token and switch to the impersonation token.
     * Optionally store the real user's name for display in the header.
     */
    startImpersonation: (
        impersonationToken: string,
        originalUserName?: string
    ): void => {
        const current = tokenManager.getToken();
        if (current) {
            localStorage.setItem(ORIGINAL_TOKEN_KEY, current);
        }
        if (originalUserName) {
            localStorage.setItem(ORIGINAL_USER_NAME_KEY, originalUserName);
        }
        localStorage.setItem(
            IMPERSONATION_STARTED_AT_KEY,
            Date.now().toString()
        );
        tokenManager.setToken(impersonationToken);
    },

    /** Restore the original admin token and clear impersonation state. */
    stopImpersonation: (): void => {
        const original = localStorage.getItem(ORIGINAL_TOKEN_KEY);
        if (original) {
            tokenManager.setToken(original);
        }
        localStorage.removeItem(ORIGINAL_TOKEN_KEY);
        localStorage.removeItem(ORIGINAL_USER_NAME_KEY);
        localStorage.removeItem(IMPERSONATION_STARTED_AT_KEY);
    },

    /** Returns the real admin's name saved at impersonation start, or null. */
    getOriginalUserName: (): string | null => {
        return localStorage.getItem(ORIGINAL_USER_NAME_KEY);
    },
};
