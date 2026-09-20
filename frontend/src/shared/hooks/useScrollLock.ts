import { useCallback, useEffect, useRef } from 'react';

export function useScrollLock() {
    const scrollPosition = useRef(0);

    const lock = useCallback(() => {
        scrollPosition.current = window.pageYOffset;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPosition.current}px`;
        document.body.style.width = '100%';
    }, []);

    const unlock = useCallback(() => {
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('top');
        document.body.style.removeProperty('width');
        window.scrollTo(0, scrollPosition.current);
    }, []);

    return { lock, unlock };
}

// Hook that locks scroll when mounted and unlocks on unmount
export function useScrollLockOnMount(shouldLock: boolean = true) {
    const { lock, unlock } = useScrollLock();

    useEffect(() => {
        if (shouldLock) {
            lock();
            return () => unlock();
        }
    }, [shouldLock, lock, unlock]);
}
