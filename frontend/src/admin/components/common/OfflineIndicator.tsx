import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { FaPlugCircleXmark, FaXmark } from 'react-icons/fa6';

export function OfflineIndicator() {
    const online = useOnlineStatus();
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!online) {
            setDismissed(false);
        }
    }, [online]);

    if (online || dismissed) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 24,
                left: 24,
                zIndex: 9999,
                maxWidth: 320,
                minWidth: 260,
            }}
        >
            <div
                className="d-flex align-items-center gap-3 px-3 py-3 rounded shadow"
                style={{
                    backgroundColor: 'var(--offline-indicator-bg, #1e1e2d)',
                    color: 'var(--offline-indicator-text, #f8f9fa)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <FaPlugCircleXmark
                    style={{
                        fontSize: '1.25rem',
                        flexShrink: 0,
                        color: '#f87171',
                    }}
                />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        No internet connection
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                        Check your connection and try again.
                    </div>
                </div>
                <button
                    aria-label="Dismiss"
                    onClick={() => setDismissed(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <FaXmark style={{ fontSize: '1rem' }} />
                </button>
            </div>
        </div>
    );
}
