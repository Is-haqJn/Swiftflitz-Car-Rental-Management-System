import { ProgressBar } from 'react-bootstrap';
import type { TusFileEntry } from '@/shared/hooks/useTusMultiUpload';

interface TusFileListProps {
    files: TusFileEntry[];
    onPause: (id: string) => void;
    onResume: (id: string) => void;
    onRemove: (id: string) => void;
}

/**
 * Renders a list of TUS upload entries with per-file progress bars
 * and pause / resume / cancel controls.
 */
export default function TusFileList({
    files,
    onPause,
    onResume,
    onRemove,
}: TusFileListProps) {
    if (files.length === 0) return null;

    return (
        <div className="mt-2">
            {files.map(entry => (
                <div key={entry.id} className="mb-2 border rounded p-2 small">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <span
                            className="text-truncate me-2"
                            style={{ maxWidth: '60%' }}
                            title={entry.file.name}
                        >
                            {entry.file.name}
                        </span>
                        <div className="d-flex gap-1 align-items-center flex-shrink-0">
                            {entry.status === 'uploading' && (
                                <button
                                    className="btn btn-outline-secondary btn-sm py-0 px-1"
                                    onClick={() => onPause(entry.id)}
                                    title="Pause upload"
                                >
                                    ⏸
                                </button>
                            )}
                            {entry.status === 'paused' && (
                                <button
                                    className="btn btn-outline-primary btn-sm py-0 px-1"
                                    onClick={() => onResume(entry.id)}
                                    title="Resume upload"
                                >
                                    ▶
                                </button>
                            )}
                            {entry.status !== 'success' && (
                                <button
                                    className="btn btn-outline-danger btn-sm py-0 px-1"
                                    onClick={() => onRemove(entry.id)}
                                    title="Cancel and remove"
                                >
                                    ✕
                                </button>
                            )}
                            {entry.status === 'success' && (
                                <button
                                    className="btn btn-outline-secondary btn-sm py-0 px-1"
                                    onClick={() => onRemove(entry.id)}
                                    title="Remove"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                    {entry.status === 'pending' ? (
                        <div
                            className="text-muted"
                            style={{ fontSize: '11px' }}
                        >
                            Queued - click Upload to start
                        </div>
                    ) : entry.status === 'error' ? (
                        <div className="text-danger">
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
                            label={
                                entry.status === 'success'
                                    ? 'Done'
                                    : entry.status === 'paused'
                                      ? `${entry.percent}% (paused)`
                                      : `${entry.percent}%`
                            }
                            style={{ height: '18px', fontSize: '11px' }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
