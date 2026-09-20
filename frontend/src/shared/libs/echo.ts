import { configureEcho } from '@laravel/echo-react';
import { tokenManager } from '@/shared/config/tokenManager';

/**
 * Authorization headers object with a live getter for the bearer token.
 * Echo reads this object at channel-auth time (not at configureEcho time),
 * so the token is always current even if set after bootstrap.
 */
const authHeaders: Record<string, string> = {};
Object.defineProperty(authHeaders, 'Authorization', {
    get: () => `Bearer ${tokenManager.getToken() ?? ''}`,
    enumerable: true,
});

/**
 * Derive the backend origin from VITE_API_BASE_URL so the Sanctum broadcasting
 * auth endpoint resolves to the backend, not the frontend SPA origin.
 * e.g. http://backend.swiftflitz.test/api/v1 → http://backend.swiftflitz.test/broadcasting/auth
 */
const backendOrigin = new URL(
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
).origin;

/**
 * Configure Laravel Echo with Reverb broadcaster.
 * Imported once in main.tsx so the side effect executes at app startup.
 *
 * Requires env vars: VITE_REVERB_APP_KEY, VITE_REVERB_HOST (hostname only),
 * VITE_REVERB_PORT, VITE_REVERB_SCHEME.
 */
const rawReverbHost = import.meta.env.VITE_REVERB_HOST ?? 'localhost';
// ? wsHost must be a plain hostname (e.g. "backend.swiftflitz.test").
// ? Strip scheme and path if the env var was accidentally set to a full URL.
const wsHost = rawReverbHost.startsWith('http')
    ? new URL(rawReverbHost).hostname
    : rawReverbHost;

configureEcho({
    broadcaster: import.meta.env.VITE_REVERB_BROADCASTER ?? 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1', // Required by Echo but ignored by Reverb
    wsHost,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    // ? Sanctum token auth - must point to the backend origin, not the SPA origin
    authEndpoint: `${backendOrigin}/api/v1/broadcasting/auth`,
    auth: { headers: authHeaders },
});

export {};
