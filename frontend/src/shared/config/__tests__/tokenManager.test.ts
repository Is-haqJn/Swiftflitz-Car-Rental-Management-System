import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { tokenManager } from '../tokenManager';

const TOKEN_KEY = 'auth_token';
const ORIGINAL_TOKEN_KEY = 'original_auth_token';
const ORIGINAL_USER_NAME_KEY = 'original_auth_user_name';
const TOKEN_EXPIRES_AT_KEY = 'auth_token_expires_at';
const IMPERSONATION_STARTED_AT_KEY = 'impersonation_started_at';

describe('tokenManager - token expiry', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('getToken returns token when not expired', () => {
        localStorage.setItem(TOKEN_KEY, 'my-token');
        localStorage.setItem(
            TOKEN_EXPIRES_AT_KEY,
            (Date.now() + 60_000).toString()
        );
        expect(tokenManager.getToken()).toBe('my-token');
    });

    it('getToken returns null and clears token when expired', () => {
        localStorage.setItem(TOKEN_KEY, 'my-token');
        localStorage.setItem(
            TOKEN_EXPIRES_AT_KEY,
            (Date.now() - 1000).toString()
        );
        expect(tokenManager.getToken()).toBeNull();
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('getToken returns token when no expires_at is stored', () => {
        localStorage.setItem(TOKEN_KEY, 'my-token');
        expect(tokenManager.getToken()).toBe('my-token');
    });

    it('removeToken also clears auth_token_expires_at', () => {
        localStorage.setItem(TOKEN_KEY, 'my-token');
        localStorage.setItem(TOKEN_EXPIRES_AT_KEY, Date.now().toString());
        tokenManager.removeToken();
        expect(localStorage.getItem(TOKEN_EXPIRES_AT_KEY)).toBeNull();
    });
});

describe('tokenManager - impersonation', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    /* isImpersonating */
    it('returns false when not impersonating', () => {
        expect(tokenManager.isImpersonating()).toBe(false);
    });

    it('returns true after startImpersonation is called', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token');
        expect(tokenManager.isImpersonating()).toBe(true);
    });

    it('returns false after stopImpersonation is called', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token');
        tokenManager.stopImpersonation();
        expect(tokenManager.isImpersonating()).toBe(false);
    });

    /* startImpersonation */
    it('saves the current token as original before switching', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token');
        expect(localStorage.getItem(ORIGINAL_TOKEN_KEY)).toBe('admin-token');
    });

    it('sets the impersonation token as the active token', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token');
        expect(tokenManager.getToken()).toBe('impersonation-token');
    });

    it('saves the original user name when provided', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token', 'Super Admin');
        expect(localStorage.getItem(ORIGINAL_USER_NAME_KEY)).toBe(
            'Super Admin'
        );
    });

    it('does not save original user name when not provided', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token');
        expect(localStorage.getItem(ORIGINAL_USER_NAME_KEY)).toBeNull();
    });

    it('does not save original token when there is no current token', () => {
        // No token in storage - should not save empty original
        tokenManager.startImpersonation('impersonation-token');
        expect(localStorage.getItem(ORIGINAL_TOKEN_KEY)).toBeNull();
    });

    /* stopImpersonation */
    it('restores the original token on stop', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token');
        tokenManager.stopImpersonation();
        expect(tokenManager.getToken()).toBe('admin-token');
    });

    it('clears the saved original token on stop', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token');
        tokenManager.stopImpersonation();
        expect(localStorage.getItem(ORIGINAL_TOKEN_KEY)).toBeNull();
    });

    it('clears the saved original user name on stop', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token', 'Super Admin');
        tokenManager.stopImpersonation();
        expect(localStorage.getItem(ORIGINAL_USER_NAME_KEY)).toBeNull();
    });

    it('does nothing silently if stopImpersonation is called without a saved original', () => {
        // Should not throw
        expect(() => tokenManager.stopImpersonation()).not.toThrow();
    });

    /* getOriginalUserName */
    it('returns null when not impersonating', () => {
        expect(tokenManager.getOriginalUserName()).toBeNull();
    });

    it('returns the original user name during impersonation', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token', 'Danny Admin');
        expect(tokenManager.getOriginalUserName()).toBe('Danny Admin');
    });

    it('returns null after stopping impersonation', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token', 'Danny Admin');
        tokenManager.stopImpersonation();
        expect(tokenManager.getOriginalUserName()).toBeNull();
    });

    /* impersonation timeout */
    it('startImpersonation stores impersonation_started_at timestamp', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        const before = Date.now();
        tokenManager.startImpersonation('impersonation-token');
        const stored = parseInt(
            localStorage.getItem(IMPERSONATION_STARTED_AT_KEY) ?? '0',
            10
        );
        expect(stored).toBeGreaterThanOrEqual(before);
    });

    it('stopImpersonation clears impersonation_started_at', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token');
        tokenManager.stopImpersonation();
        expect(localStorage.getItem(IMPERSONATION_STARTED_AT_KEY)).toBeNull();
    });

    it('isImpersonating returns false when impersonation has exceeded 60 minutes', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token');
        /* Back-date the start time by 61 minutes */
        const expired = Date.now() - 61 * 60 * 1000;
        localStorage.setItem(IMPERSONATION_STARTED_AT_KEY, expired.toString());
        expect(tokenManager.isImpersonating()).toBe(false);
    });

    it('isImpersonating auto-cleans up when session expired', () => {
        localStorage.setItem(TOKEN_KEY, 'admin-token');
        tokenManager.startImpersonation('impersonation-token');
        const expired = Date.now() - 61 * 60 * 1000;
        localStorage.setItem(IMPERSONATION_STARTED_AT_KEY, expired.toString());
        tokenManager.isImpersonating();
        expect(localStorage.getItem(ORIGINAL_TOKEN_KEY)).toBeNull();
    });
});
