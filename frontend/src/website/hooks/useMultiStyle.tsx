import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface StyleConfig {
    href: string;
    id?: string;
    /** Restrict the stylesheet to specific media queries e.g. `"print"` or `"(max-width: 768px)"`. */
    media?: string;
    appendTo?: 'head' | 'body';
}

interface UseMultiStyleOptions {
    /** Inject stylesheets one after another instead of all at once. */
    sequential?: boolean;
    /** Called once all stylesheets have successfully loaded. */
    onAllLoaded?: () => void;
    /** Called if any stylesheet fails to load. */
    onError?: (error: Error) => void;
}

interface State {
    isLoaded: boolean;
    error: Error | null;
    loadedCount: number;
}

/**
 * Dynamically injects multiple `<link rel="stylesheet">` tags into the document
 * and tracks their load state.
 *
 * Accepts plain URL strings or `StyleConfig` objects. Already-present links
 * (matched by `href`) are reused rather than duplicated.
 *
 * @example
 * const { isLoaded, progress } = useMultiStyle([
 *   'https://cdn.example.com/base.css',
 *   { href: 'https://cdn.example.com/theme.css', media: 'print' },
 * ]);
 */
const useMultiStyle = (
    styles: (string | StyleConfig)[],
    options: UseMultiStyleOptions = {}
) => {
    const { sequential = false, onAllLoaded, onError } = options;
    const [state, setState] = useState<State>({
        isLoaded: false,
        error: null,
        loadedCount: 0,
    });
    const linksRef = useRef<HTMLLinkElement[]>([]);
    const isMountedRef = useRef(true);
    // Store callbacks in refs so they never become stale deps in the effect below
    const onAllLoadedRef = useRef(onAllLoaded);
    const onErrorRef = useRef(onError);

    // Keep callback refs in sync without causing the main effect to re-run
    useEffect(() => {
        onAllLoadedRef.current = onAllLoaded;
        onErrorRef.current = onError;
    }, [onAllLoaded, onError]);

    // Normalize plain strings to StyleConfig objects. JSON.stringify provides
    // deep equality so the memo only recomputes when the array contents actually change.
    const normalizedStyles = useMemo(
        () =>
            styles.map(style =>
                typeof style === 'string' ? { href: style } : style
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(styles)]
    );

    const total = normalizedStyles.length;

    /**
     * Injects a single `<link>` tag, or waits on an existing one that is still loading.
     * Increments `loadedCount` once the stylesheet is ready.
     */
    const loadStyle = useCallback((config: StyleConfig): Promise<void> => {
        return new Promise((resolve, reject) => {
            const { href, id, media, appendTo = 'head' } = config;
            const existing = document.querySelector<HTMLLinkElement>(
                `link[href="${href}"]`
            );

            if (existing) {
                // Link tag already exists - reuse it
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
                        () => reject(new Error(`Failed to load: ${href}`)),
                        { once: true }
                    );
                }
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            if (id) link.id = id;
            if (media) link.media = media;
            link.dataset.appendTo = appendTo;

            link.addEventListener(
                'load',
                () => {
                    link.dataset.loaded = 'true';
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

            link.addEventListener(
                'error',
                () => reject(new Error(`Failed to load: ${href}`)),
                { once: true }
            );

            const target = appendTo === 'body' ? document.body : document.head;
            target.appendChild(link);
            // Track injected links so we can remove them on cleanup
            linksRef.current.push(link);
        });
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        linksRef.current = [];

        // Nothing to load - resolve immediately
        if (!normalizedStyles.length) {
            setState({ isLoaded: true, error: null, loadedCount: 0 });
            onAllLoadedRef.current?.();
            return;
        }

        setState({ isLoaded: false, error: null, loadedCount: 0 });

        const load = async () => {
            try {
                if (sequential) {
                    // Await each stylesheet in order - useful when styles must cascade in a specific sequence
                    for (const config of normalizedStyles) {
                        await loadStyle(config);
                    }
                } else {
                    // Fire all requests simultaneously for the fastest overall load time
                    await Promise.all(normalizedStyles.map(loadStyle));
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
            // then remove every link tag this hook injected
            isMountedRef.current = false;
            linksRef.current.forEach(link => link.remove());
            linksRef.current = [];
        };
    }, [normalizedStyles, sequential, loadStyle]);

    return {
        /** True once every stylesheet has loaded successfully. */
        isLoaded: state.isLoaded,
        /** The first load error encountered, or null. */
        error: state.error,
        /** Number of stylesheets that have finished loading so far. */
        loadedCount: state.loadedCount,
        /** Total number of stylesheets being managed. */
        total,
        /** Integer 0–100 representing overall load progress. */
        progress: total ? Math.round((state.loadedCount / total) * 100) : 100,
    };
};

export default useMultiStyle;
