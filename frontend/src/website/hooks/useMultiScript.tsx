import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface ScriptConfig {
    src: string;
    async?: boolean;
    appendTo?: 'head' | 'body';
}

interface UseMultiScriptOptions {
    /** Load scripts one after another in order instead of all at once. Useful when scripts depend on each other. */
    sequential?: boolean;
    /** Called once all scripts have successfully loaded. */
    onAllLoaded?: () => void;
    /** Called if any script fails to load. */
    onError?: (error: Error) => void;
}

interface State {
    isLoaded: boolean;
    error: Error | null;
    loadedCount: number;
}

/**
 * Dynamically injects multiple `<script>` tags into the document and tracks their load state.
 *
 * Accepts plain URL strings or `ScriptConfig` objects. Already-present scripts
 * (matched by `src`) are reused rather than duplicated.
 *
 * @example
 * const { isLoaded, progress } = useMultiScript([
 *   'https://cdn.example.com/lib.js',
 *   { src: 'https://cdn.example.com/plugin.js', appendTo: 'head' },
 * ], { sequential: true });
 */
const useMultiScript = (
    urls: (string | ScriptConfig)[],
    options: UseMultiScriptOptions = {}
) => {
    const { sequential = false, onAllLoaded, onError } = options;
    const [state, setState] = useState<State>({
        isLoaded: false,
        error: null,
        loadedCount: 0,
    });
    const scriptsRef = useRef<HTMLScriptElement[]>([]);
    const isMountedRef = useRef(true);
    // Store callbacks in refs so they never become stale deps in the effect below
    const onAllLoadedRef = useRef(onAllLoaded);
    const onErrorRef = useRef(onError);

    // Keep callback refs in sync without causing the main effect to re-run
    useEffect(() => {
        onAllLoadedRef.current = onAllLoaded;
        onErrorRef.current = onError;
    }, [onAllLoaded, onError]);

    // Normalize plain strings to ScriptConfig objects. JSON.stringify provides
    // deep equality so the memo only recomputes when the array contents actually change.
    const normalizedUrls = useMemo(
        () => urls.map(url => (typeof url === 'string' ? { src: url } : url)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(urls)]
    );

    const total = normalizedUrls.length;

    /**
     * Injects a single script tag, or waits on an existing one that is still loading.
     * Increments `loadedCount` once the script is ready.
     */
    const loadScript = useCallback(
        (config: ScriptConfig): Promise<void> => {
            return new Promise((resolve, reject) => {
                const existing = document.querySelector<HTMLScriptElement>(
                    `script[src="${config.src}"]`
                );

                if (existing) {
                    // Script tag already exists - reuse it
                    if (existing.dataset.loaded === 'true') {
                        // Already fully loaded; count it and move on
                        if (isMountedRef.current) {
                            setState(prev => ({
                                ...prev,
                                loadedCount: prev.loadedCount + 1,
                            }));
                        }
                        resolve();
                    } else {
                        // Still loading - piggyback on its events
                        existing.addEventListener(
                            'load',
                            () => {
                                if (isMountedRef.current) {
                                    setState(prev => ({
                                        ...prev,
                                        loadedCount: prev.loadedCount + 1,
                                    }));
                                }
                                resolve();
                            },
                            { once: true }
                        );
                        existing.addEventListener(
                            'error',
                            () =>
                                reject(
                                    new Error(`Failed to load: ${config.src}`)
                                ),
                            { once: true }
                        );
                    }
                    return;
                }

                const script = document.createElement('script');
                script.src = config.src;
                // In sequential mode, async is disabled so execution order is guaranteed
                script.async = config.async ?? !sequential;
                script.dataset.appendTo = config.appendTo ?? 'body';

                script.addEventListener(
                    'load',
                    () => {
                        script.dataset.loaded = 'true';
                        if (isMountedRef.current) {
                            setState(prev => ({
                                ...prev,
                                loadedCount: prev.loadedCount + 1,
                            }));
                        }
                        resolve();
                    },
                    { once: true }
                );

                script.addEventListener(
                    'error',
                    () => reject(new Error(`Failed to load: ${config.src}`)),
                    { once: true }
                );

                const target =
                    config.appendTo === 'head' ? document.head : document.body;
                target.appendChild(script);
                // Track injected scripts so we can remove them on cleanup
                scriptsRef.current.push(script);
            });
        },
        [sequential]
    );

    useEffect(() => {
        isMountedRef.current = true;
        scriptsRef.current = [];

        // Nothing to load - resolve immediately
        if (!normalizedUrls.length) {
            setState({ isLoaded: true, error: null, loadedCount: 0 });
            onAllLoadedRef.current?.();
            return;
        }

        setState({ isLoaded: false, error: null, loadedCount: 0 });

        const load = async () => {
            try {
                if (sequential) {
                    // Await each script in order - required when scripts depend on one another
                    for (const config of normalizedUrls) {
                        await loadScript(config);
                    }
                } else {
                    // Fire all requests simultaneously for the fastest overall load time
                    await Promise.all(normalizedUrls.map(loadScript));
                }
                if (isMountedRef.current) {
                    setState(prev => ({ ...prev, isLoaded: true }));
                    onAllLoadedRef.current?.();
                }
            } catch (err) {
                if (isMountedRef.current) {
                    const error = err as Error;
                    setState(prev => ({ ...prev, error, isLoaded: false }));
                    onErrorRef.current?.(error);
                }
            }
        };

        load();

        return () => {
            // Mark as unmounted to prevent state updates on stale closures,
            // then remove every script tag this hook injected
            isMountedRef.current = false;
            scriptsRef.current.forEach(script => script.remove());
            scriptsRef.current = [];
        };
    }, [normalizedUrls, sequential, loadScript]);

    return {
        /** True once every script has loaded successfully. */
        isLoaded: state.isLoaded,
        /** The first load error encountered, or null. */
        error: state.error,
        /** Number of scripts that have finished loading so far. */
        loadedCount: state.loadedCount,
        /** Total number of scripts being managed. */
        total,
        /** Integer 0–100 representing overall load progress. */
        progress: total ? Math.round((state.loadedCount / total) * 100) : 100,
    };
};

export default useMultiScript;
