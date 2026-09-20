import { useRef } from 'react';
import { Modal, Button, Row, Col, Spinner, Form } from 'react-bootstrap';
import {
    useIcons,
    useUploadCardIcon,
    settingsKeys,
} from '@/shared/hooks/queries/useSettings';
import { useQueryClient } from '@tanstack/react-query';

/** Ensure asset paths are root-absolute so they resolve correctly in the admin SPA. */
export const toAbsoluteAssetPath = (path: string): string => {
    if (!path || path.startsWith('/') || path.startsWith('http')) return path;
    return `/${path}`;
};

interface AssetIconPickerModalProps {
    show: boolean;
    onHide: () => void;
    onSelect: (iconPath: string) => void;
    currentValue?: string;
}

export function AssetIconPickerModal({
    show,
    onHide,
    onSelect,
    currentValue,
}: AssetIconPickerModalProps) {
    const { data: res, isLoading } = useIcons();
    const uploadMutation = useUploadCardIcon();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const icons = res?.data ?? [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadMutation.mutate(file, {
            onSuccess: uploadRes => {
                queryClient.invalidateQueries({
                    queryKey: settingsKeys.icons,
                });
                onSelect(uploadRes.data.url);
                onHide();
            },
        });
        e.target.value = '';
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Select Icon</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <p className="text-muted mb-0 small">
                        Click an icon to select it for the card.
                    </p>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="d-none"
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="outline-primary"
                            size="sm"
                            disabled={uploadMutation.isPending}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploadMutation.isPending ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        className="me-1"
                                    />
                                    Uploading…
                                </>
                            ) : (
                                'Upload Icon'
                            )}
                        </Button>
                        <Form.Text
                            className="d-block text-muted mt-1"
                            style={{ fontSize: '0.7rem' }}
                        >
                            PNG, SVG or WebP · max 2 MB
                        </Form.Text>
                    </div>
                </div>

                {isLoading ? (
                    <div className="d-flex justify-content-center py-4">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : (
                    <Row className="g-2">
                        {icons.map(icon => {
                            const isSelected = currentValue === icon.url;
                            return (
                                <Col xs={3} sm={2} key={icon.filename}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            onSelect(icon.url);
                                            onHide();
                                        }}
                                        onKeyDown={e => {
                                            if (
                                                e.key === 'Enter' ||
                                                e.key === ' '
                                            ) {
                                                onSelect(icon.url);
                                                onHide();
                                            }
                                        }}
                                        className={`p-2 rounded text-center border ${
                                            isSelected
                                                ? 'border-primary bg-primary bg-opacity-10'
                                                : 'border-light'
                                        }`}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img
                                            src={icon.url}
                                            alt={icon.filename}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                objectFit: 'contain',
                                            }}
                                        />
                                        <p
                                            className="mt-1 mb-0 text-muted"
                                            style={{
                                                fontSize: '0.65rem',
                                                wordBreak: 'break-all',
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {icon.filename.replace(
                                                /\.[^.]+$/,
                                                ''
                                            )}
                                        </p>
                                    </div>
                                </Col>
                            );
                        })}

                        {icons.length === 0 && (
                            <Col xs={12}>
                                <p className="text-muted text-center py-3 mb-0">
                                    No icons found. Upload one to get started.
                                </p>
                            </Col>
                        )}
                    </Row>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
