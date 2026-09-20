import { useEffect, useState } from 'react';
import type { PopupSettingsData } from '@/shared/types';
import {
    shouldShowPopup,
    markPopupSeen,
} from '@/website/utils/popupVisibility';

interface AnnouncementPopupProps {
    settings: PopupSettingsData;
    onDismiss: () => void;
}

const STORAGE_KEY = 'announcement_popup_seen';

export function AnnouncementPopup({
    settings,
    onDismiss,
}: AnnouncementPopupProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const freq = settings.announcement_frequency ?? 'once_per_day';
        if (!shouldShowPopup(STORAGE_KEY, freq)) {
            onDismiss();
            return;
        }

        const timer = setTimeout(
            () => setVisible(true),
            (settings.announcement_delay_seconds ?? 2) * 1000
        );
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        markPopupSeen(STORAGE_KEY);
        setVisible(false);
        setTimeout(onDismiss, 300);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: visible ? 'auto' : 'none',
            }}
            onClick={e => {
                if (e.target === e.currentTarget) handleDismiss();
            }}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: 12,
                    width: '100%',
                    maxWidth: 420,
                    margin: '0 16px',
                    padding: '36px 32px 28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    transform: visible ? 'scale(1)' : 'scale(0.95)',
                    transition: 'transform 0.3s ease',
                    position: 'relative',
                    textAlign: 'center',
                }}
            >
                {/* Accent bar */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        borderRadius: '12px 12px 0 0',
                        background: 'linear-gradient(90deg, #126dff, #0a56d0)',
                    }}
                />

                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 20,
                        color: '#888',
                        lineHeight: 1,
                        padding: 4,
                    }}
                    aria-label="Close"
                >
                    ×
                </button>

                {/* Icon */}
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: '#edf3ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: 22,
                    }}
                >
                    📢
                </div>

                <h5
                    style={{
                        fontWeight: 700,
                        fontSize: 20,
                        color: '#1a1a2e',
                        marginBottom: 10,
                    }}
                >
                    {settings.announcement_title}
                </h5>

                <p
                    style={{
                        fontSize: 15,
                        color: '#555',
                        lineHeight: 1.6,
                        marginBottom: 24,
                    }}
                >
                    {settings.announcement_body}
                </p>

                <button
                    onClick={handleDismiss}
                    style={{
                        background: '#126dff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 32px',
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    onMouseOver={e =>
                        ((e.target as HTMLButtonElement).style.background =
                            '#0a56d0')
                    }
                    onMouseOut={e =>
                        ((e.target as HTMLButtonElement).style.background =
                            '#126dff')
                    }
                >
                    Got it
                </button>
            </div>
        </div>
    );
}
