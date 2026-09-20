import { useEffect, useState } from 'react';
import type { PopupSettingsData } from '@/shared/types';
import {
    shouldShowPopup,
    markPopupSeen,
} from '@/website/utils/popupVisibility';

interface PromoPopupProps {
    settings: PopupSettingsData;
    onDismiss: () => void;
}

const STORAGE_KEY = 'promo_popup_seen';

export function PromoPopup({ settings, onDismiss }: PromoPopupProps) {
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const freq = settings.promo_frequency ?? 'once_per_day';
        if (!shouldShowPopup(STORAGE_KEY, freq)) {
            onDismiss();
            return;
        }

        const timer = setTimeout(
            () => setVisible(true),
            (settings.promo_delay_seconds ?? 3) * 1000
        );
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        markPopupSeen(STORAGE_KEY);
        setVisible(false);
        setTimeout(onDismiss, 300);
    };

    const handleCopyCode = () => {
        if (!settings.promo_code) return;
        navigator.clipboard.writeText(settings.promo_code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const hasImage = !!settings.promo_image_url;

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
                    borderRadius: 14,
                    width: '100%',
                    maxWidth: hasImage ? 660 : 460,
                    margin: '0 16px',
                    boxShadow: '0 24px 70px rgba(0,0,0,0.2)',
                    transform: visible ? 'scale(1)' : 'scale(0.95)',
                    transition: 'transform 0.3s ease',
                    overflow: 'hidden',
                    display: 'flex',
                    position: 'relative',
                }}
            >
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 14,
                        background: 'rgba(0,0,0,0.06)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 30,
                        height: 30,
                        cursor: 'pointer',
                        fontSize: 18,
                        color: '#555',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                        lineHeight: 1,
                    }}
                    aria-label="Close"
                >
                    ×
                </button>

                {/* Left: content */}
                <div
                    style={{
                        flex: 1,
                        padding: '36px 32px 32px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    {/* Badge */}
                    <span
                        style={{
                            display: 'inline-block',
                            background: '#edf3ff',
                            color: '#126dff',
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '4px 10px',
                            borderRadius: 20,
                            marginBottom: 14,
                            width: 'fit-content',
                        }}
                    >
                        Limited Offer
                    </span>

                    <h4
                        style={{
                            fontWeight: 800,
                            fontSize: 22,
                            color: '#1a1a2e',
                            marginBottom: 10,
                            lineHeight: 1.3,
                        }}
                    >
                        {settings.promo_title}
                    </h4>

                    <p
                        style={{
                            fontSize: 14,
                            color: '#666',
                            lineHeight: 1.65,
                            marginBottom: settings.promo_code ? 20 : 24,
                        }}
                    >
                        {settings.promo_description}
                    </p>

                    {/* Copy code badge */}
                    {settings.promo_code && (
                        <div style={{ marginBottom: 20 }}>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: '#888',
                                    marginBottom: 6,
                                }}
                            >
                                Use code at checkout:
                            </p>
                            <button
                                onClick={handleCopyCode}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: '#f5f5f5',
                                    border: '1.5px dashed #ccc',
                                    borderRadius: 8,
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    fontSize: 15,
                                    fontWeight: 700,
                                    letterSpacing: '0.1em',
                                    color: '#1a1a2e',
                                    transition: 'background 0.2s',
                                }}
                            >
                                <span>{settings.promo_code}</span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: copied ? '#2e7d32' : '#126dff',
                                        background: copied
                                            ? '#e8f5e9'
                                            : '#edf3ff',
                                        padding: '2px 8px',
                                        borderRadius: 4,
                                        letterSpacing: 0,
                                    }}
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </span>
                            </button>
                        </div>
                    )}

                    {/* CTA button */}
                    <a
                        href={settings.promo_button_url ?? '/listings'}
                        style={{
                            display: 'inline-block',
                            background: '#126dff',
                            color: '#fff',
                            borderRadius: 8,
                            padding: '11px 28px',
                            fontWeight: 700,
                            fontSize: 15,
                            textDecoration: 'none',
                            width: 'fit-content',
                            transition: 'background 0.2s',
                        }}
                        onMouseOver={e =>
                            ((e.target as HTMLAnchorElement).style.background =
                                '#0a56d0')
                        }
                        onMouseOut={e =>
                            ((e.target as HTMLAnchorElement).style.background =
                                '#126dff')
                        }
                    >
                        {settings.promo_button_label ?? 'Book Now'}
                    </a>
                </div>

                {/* Right: image */}
                {hasImage && (
                    <div
                        style={{
                            width: 220,
                            flexShrink: 0,
                            background: '#f8f4ef',
                            overflow: 'hidden',
                        }}
                    >
                        <img
                            src={settings.promo_image_url!}
                            alt="Promo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
