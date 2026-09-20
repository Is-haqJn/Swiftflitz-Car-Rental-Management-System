import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProgressBar } from 'react-bootstrap';
import type { TusFileEntry } from '@/shared/hooks/useTusMultiUpload';

interface TusUploadToastProps {
    files: TusFileEntry[];
    onPause: (id: string) => void;
    onResume: (id: string) => void;
    onRemove: (id: string) => void;
}

type ToastPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

const POSITION_KEY = 'tus-toast-position';

const POSITION_LABELS: Record<ToastPosition, string> = {
    'bottom-left': '↙ Bottom Left',
    'bottom-right': '↘ Bottom Right',
    'top-left': '↖ Top Left',
    'top-right': '↗ Top Right',
};

function getPositionStyle(position: ToastPosition): React.CSSProperties {
    const base: React.CSSProperties = {
        position: 'fixed',
        width: '22rem',
        zIndex: 9999,
    };
    switch (position) {
        case 'bottom-left':
            return { ...base, bottom: '1.25rem', left: '1.25rem' };
        case 'bottom-right':
            return { ...base, bottom: '1.25rem', right: '1.25rem' };
        case 'top-left':
            return { ...base, top: '1.25rem', left: '1.25rem' };
        case 'top-right':
            return { ...base, top: '1.25rem', right: '1.25rem' };
    }
}

const statusLabel: Record<string, string> = {
    pending: 'Queued',
    uploading: 'Uploading',
    paused: 'Paused',
    success: 'Done',
    error: 'Failed',
};

/**
 * A Gmail-style floating upload progress panel.
 * Position is configurable via a settings gear and persisted to localStorage.
 * Renders via a React portal so it sits above all other content.
 * Auto-hides 3 seconds after all uploads complete.
 */
export default function TusUploadToast({
    files,
    onPause,
    onResume,
    onRemove,
}: TusUploadToastProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [visible, setVisible] = useState(false);
    const [showPositionMenu, setShowPositionMenu] = useState(false);
    const [position, setPosition] = useState<ToastPosition>(() => {
        const saved = localStorage.getItem(POSITION_KEY);
        return (saved as ToastPosition) ?? 'bottom-left';
    });
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const totalFiles = files.length;
    const doneCount = files.filter(f => f.status === 'success').length;
    const errorCount = files.filter(f => f.status === 'error').length;
    const uploadingCount = files.filter(f => f.status === 'uploading').length;
    const allDone =
        totalFiles > 0 &&
        files.every(f => f.status === 'success' || f.status === 'error');

    // Show whenever there are files; hide 3s after all finish
    useEffect(() => {
        if (totalFiles > 0) {
            setVisible(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        }

        if (allDone && totalFiles > 0) {
            hideTimerRef.current = setTimeout(() => setVisible(false), 3000);
        }

        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [totalFiles, allDone]);

    if (!visible || totalFiles === 0) return null;

    const headerLabel =
        uploadingCount > 0
            ? `Uploading ${doneCount + errorCount + 1} of ${totalFiles}…`
            : allDone
              ? errorCount > 0
                  ? `${doneCount} uploaded, ${errorCount} failed`
                  : `${doneCount} upload${doneCount !== 1 ? 's' : ''} complete`
              : `${totalFiles} file${totalFiles !== 1 ? 's' : ''} queued`;

    const handlePositionChange = (pos: ToastPosition) => {
        setPosition(pos);
        localStorage.setItem(POSITION_KEY, pos);
        setShowPositionMenu(false);
    };

    return createPortal(
        <div
            style={{
                ...getPositionStyle(position),
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.10)',
                background: '#fff',
                fontSize: '0.82rem',
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: '#2c3e50',
                    color: '#fff',
                    padding: '0.55rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
                onClick={() => setCollapsed(c => !c)}
            >
                <span style={{ fontWeight: 600, fontSize: '0.83rem' }}>
                    {headerLabel}
                </span>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                    }}
                >
                    {/* Position settings gear */}
                    <span
                        title="Position settings"
                        style={{
                            fontSize: '0.78rem',
                            opacity: 0.8,
                            lineHeight: 1,
                            cursor: 'pointer',
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            setShowPositionMenu(m => !m);
                        }}
                    >
                        ⚙
                    </span>
                    <span
                        title={collapsed ? 'Expand' : 'Collapse'}
                        style={{
                            fontSize: '0.75rem',
                            opacity: 0.85,
                            lineHeight: 1,
                        }}
                    >
                        {collapsed ? '▲' : '▼'}
                    </span>
                    <span
                        title="Close"
                        style={{
                            fontSize: '0.9rem',
                            opacity: 0.85,
                            lineHeight: 1,
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            setVisible(false);
                        }}
                    >
                        ✕
                    </span>
                </div>
            </div>

            {/* Position picker */}
            {showPositionMenu && (
                <div
                    style={{
                        background: '#1a252f',
                        padding: '0.4rem 0.5rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.3rem',
                    }}
                >
                    {(Object.keys(POSITION_LABELS) as ToastPosition[]).map(
                        pos => (
                            <button
                                key={pos}
                                style={{
                                    background:
                                        position === pos
                                            ? '#0d6efd'
                                            : 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                                onClick={() => handlePositionChange(pos)}
                            >
                                {POSITION_LABELS[pos]}
                            </button>
                        )
                    )}
                </div>
            )}

            {/* File list */}
            {!collapsed && (
                <div style={{ maxHeight: '14rem', overflowY: 'auto' }}>
                    {files.map(entry => (
                        <div
                            key={entry.id}
                            style={{
                                padding: '0.45rem 0.85rem',
                                borderBottom: '1px solid #f0f0f0',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.2rem',
                                }}
                            >
                                <span
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '65%',
                                        color: '#333',
                                    }}
                                    title={entry.file.name}
                                >
                                    {entry.file.name}
                                </span>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.3rem',
                                        alignItems: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '0.72rem',
                                            color:
                                                entry.status === 'success'
                                                    ? '#28a745'
                                                    : entry.status === 'error'
                                                      ? '#dc3545'
                                                      : entry.status ===
                                                          'paused'
                                                        ? '#ffc107'
                                                        : '#6c757d',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {statusLabel[entry.status] ??
                                            entry.status}
                                    </span>
                                    {entry.status === 'uploading' && (
                                        <button
                                            className="btn btn-link p-0"
                                            style={{
                                                fontSize: '0.75rem',
                                                color: '#6c757d',
                                                lineHeight: 1,
                                            }}
                                            onClick={() => onPause(entry.id)}
                                            title="Pause"
                                        >
                                            ⏸
                                        </button>
                                    )}
                                    {entry.status === 'paused' && (
                                        <button
                                            className="btn btn-link p-0"
                                            style={{
                                                fontSize: '0.75rem',
                                                color: '#0d6efd',
                                                lineHeight: 1,
                                            }}
                                            onClick={() => onResume(entry.id)}
                                            title="Resume"
                                        >
                                            ▶
                                        </button>
                                    )}
                                    {entry.status !== 'success' && (
                                        <button
                                            className="btn btn-link p-0"
                                            style={{
                                                fontSize: '0.75rem',
                                                color: '#dc3545',
                                                lineHeight: 1,
                                            }}
                                            onClick={() => onRemove(entry.id)}
                                            title="Remove"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Progress / status line */}
                            {entry.status === 'pending' ? (
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: '#aaa',
                                    }}
                                >
                                    Queued - waiting to start…
                                </div>
                            ) : entry.status === 'error' ? (
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: '#dc3545',
                                    }}
                                >
                                    {entry.error ?? 'Upload failed'}
                                </div>
                            ) : (
                                <ProgressBar
                                    now={entry.percent}
                                    variant={
                                        entry.status === 'success'
                                            ? 'success'
                                            : entry.status === 'paused'
                                              ? 'warning'
                                              : 'primary'
                                    }
                                    animated={entry.status === 'uploading'}
                                    style={{
                                        height: '4px',
                                        borderRadius: '2px',
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>,
        document.body
    );
}
