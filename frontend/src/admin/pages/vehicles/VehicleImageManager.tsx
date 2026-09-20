import { useEffect, useRef, useState } from 'react';
import { Card, Button, Row, Col, Spinner, Badge, Form } from 'react-bootstrap';
import {
    useVehicleImages,
    useSetPrimaryImage,
    useDeleteVehicleImage,
} from '@/shared/hooks/queries/useVehicles';
import { vehicleKeys } from '@/shared/hooks/queries/useVehicles';
import { useTusMultiUpload } from '@/shared/hooks/useTusMultiUpload';
import TusUploadToast from '@/shared/components/ui/TusUploadToast';
import type { VehicleImage } from '@/shared/types';
import { useQueryClient } from '@tanstack/react-query';

const MAX_IMAGES = 10;

interface VehicleImageManagerProps {
    vehicleId: string;
    showTitle?: boolean;
}

/** Pairs a local object-URL preview with the TUS file entry ID so removals stay in sync. */
interface PreviewEntry {
    url: string;
    tusId: string;
}

export default function VehicleImageManager({
    vehicleId,
    showTitle = true,
}: VehicleImageManagerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<PreviewEntry[]>([]);
    const queryClient = useQueryClient();

    const { data: imagesResponse, isLoading } = useVehicleImages(vehicleId);
    const setPrimaryMutation = useSetPrimaryImage();
    const deleteMutation = useDeleteVehicleImage();

    const images = imagesResponse?.data || [];

    /* TUS uploads - immediate handler on the backend */
    const tus = useTusMultiUpload({
        endpoint: '/api/v1/uploads/tus',
        entityType: 'vehicle_image',
        extraMetadata: { entity_id: vehicleId },
    });

    /* Auto-refresh when all uploads complete */
    useEffect(() => {
        if (!tus.allSucceeded || tus.files.length === 0) return;

        queryClient.invalidateQueries({
            queryKey: vehicleKeys.images(vehicleId),
        });
        queryClient.invalidateQueries({
            queryKey: vehicleKeys.detail(vehicleId),
        });
        previews.forEach(p => URL.revokeObjectURL(p.url));
        setPreviews([]);
        tus.clearAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tus.allSucceeded]);

    /* File selection */
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);

        const valid = selected.filter(f =>
            ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
        );

        if (valid.length !== selected.length) {
            alert(
                'Some files were skipped. Only JPEG, PNG, and WebP are allowed.'
            );
        }

        // Enforce max: account for already-uploaded images + pending previews
        const available = MAX_IMAGES - images.length - previews.length;
        if (available <= 0) {
            alert(
                `Maximum of ${MAX_IMAGES} images allowed. Remove existing images first.`
            );
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const toAdd = valid.slice(0, available);
        if (toAdd.length < valid.length) {
            alert(
                `Only ${toAdd.length} of ${valid.length} files added (max ${MAX_IMAGES} total).`
            );
        }

        if (toAdd.length === 0) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Generate TUS entries first so we have IDs to pair with previews
        // addFiles returns void - we read tus.files after state updates,
        // so instead we generate preview entries based on the order we add files.
        // We queue files and capture IDs via the useTusMultiUpload internal state.
        // Because state is async, we track pairing by storing a "pending pairing" ref.
        const urls = toAdd.map(f => URL.createObjectURL(f));
        tus.addFiles(toAdd);

        // We'll sync preview entries with TUS IDs via a useEffect below.
        // For now, store urls temporarily with placeholder IDs.
        setPreviews(prev => [
            ...prev,
            ...urls.map(url => ({ url, tusId: '' })),
        ]);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    /* Sync placeholder preview tusIds from tus.files */
    useEffect(() => {
        setPreviews(prev => {
            // Find previews that still have empty tusId
            const unlinked = prev.filter(p => p.tusId === '');
            if (unlinked.length === 0) return prev;

            // Find TUS file entries that are NOT yet referenced by any preview
            const linkedIds = new Set(
                prev.filter(p => p.tusId !== '').map(p => p.tusId)
            );
            const unlinkedTus = tus.files.filter(f => !linkedIds.has(f.id));

            // Pair them in order
            let tusIdx = 0;
            return prev.map(p => {
                if (p.tusId !== '' || tusIdx >= unlinkedTus.length) return p;
                return { ...p, tusId: unlinkedTus[tusIdx++].id };
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tus.files.length]);

    /* Remove preview + abort TUS entry */
    const removePreview = (idx: number) => {
        const entry = previews[idx];
        if (!entry) return;
        URL.revokeObjectURL(entry.url);
        if (entry.tusId) tus.removeFile(entry.tusId);
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    /* TUS toast removal - also remove from preview */
    const handleTusRemove = (id: string) => {
        tus.removeFile(id);
        setPreviews(prev => {
            const entry = prev.find(p => p.tusId === id);
            if (entry) URL.revokeObjectURL(entry.url);
            return prev.filter(p => p.tusId !== id);
        });
    };

    /* Set primary / delete existing */
    const handleSetPrimary = (mediaId: number) => {
        setPrimaryMutation.mutate({ vehicleId, mediaId });
    };

    const handleDelete = (mediaId: number) => {
        if (window.confirm('Are you sure you want to delete this image?')) {
            deleteMutation.mutate({ vehicleId, mediaId });
        }
    };

    if (isLoading) {
        return (
            <Card>
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading images...</p>
                </Card.Body>
            </Card>
        );
    }

    const remainingSlots = MAX_IMAGES - images.length - previews.length;

    return (
        <Card>
            {showTitle && (
                <Card.Header>
                    <Card.Title>Vehicle Images</Card.Title>
                </Card.Header>
            )}
            <Card.Body>
                {/* Upload Section */}
                <div className="mb-4">
                    <Form.Group className="mb-3">
                        <Form.Label>Select Images to Upload</Form.Label>
                        <Form.Control
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileSelect}
                            disabled={tus.isUploading || remainingSlots <= 0}
                        />
                        <Form.Text className="text-muted">
                            JPEG, PNG or WebP - max 5 MB each.{' '}
                            {remainingSlots > 0
                                ? `${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining (max ${MAX_IMAGES}).`
                                : `Maximum of ${MAX_IMAGES} images reached.`}
                        </Form.Text>
                    </Form.Group>

                    {/* Preview thumbnails */}
                    {previews.length > 0 && (
                        <Row className="g-2 mb-3">
                            {previews.map((entry, idx) => {
                                const tusFile = tus.files.find(
                                    f => f.id === entry.tusId
                                );
                                return (
                                    <Col key={entry.url} xs={6} sm={4} md={3}>
                                        <div className="position-relative border rounded overflow-hidden">
                                            <img
                                                src={entry.url}
                                                alt={`Preview ${idx + 1}`}
                                                className="w-100"
                                                style={{
                                                    height: 100,
                                                    objectFit: 'cover',
                                                    opacity:
                                                        tusFile?.status ===
                                                        'uploading'
                                                            ? 0.6
                                                            : 1,
                                                }}
                                            />
                                            {!tus.isUploading && (
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 p-0 px-1"
                                                    onClick={() =>
                                                        removePreview(idx)
                                                    }
                                                >
                                                    ×
                                                </button>
                                            )}
                                            {tusFile?.status ===
                                                'uploading' && (
                                                <div
                                                    className="position-absolute bottom-0 start-0 end-0"
                                                    style={{
                                                        height: 4,
                                                        background: '#0d6efd',
                                                        width: `${tusFile.percent}%`,
                                                        transition:
                                                            'width 0.3s',
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}

                    {/* TUS upload progress toast */}
                    <TusUploadToast
                        files={tus.files}
                        onPause={tus.pauseFile}
                        onResume={tus.resumeFile}
                        onRemove={handleTusRemove}
                    />

                    {tus.files.length > 0 && (
                        <div className="d-flex gap-2 mt-3">
                            {tus.hasPending && !tus.isUploading && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={tus.startAll}
                                >
                                    Upload{' '}
                                    {
                                        tus.files.filter(
                                            f => f.status === 'pending'
                                        ).length
                                    }{' '}
                                    Image
                                    {tus.files.filter(
                                        f => f.status === 'pending'
                                    ).length !== 1
                                        ? 's'
                                        : ''}
                                </Button>
                            )}
                            {tus.isUploading && (
                                <span className="text-muted small align-self-center">
                                    <Spinner
                                        animation="border"
                                        size="sm"
                                        className="me-1"
                                    />
                                    Uploading… images will refresh automatically
                                    when done.
                                </span>
                            )}
                            {!tus.isUploading &&
                                !tus.hasPending &&
                                !tus.allSucceeded && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-danger p-0"
                                        onClick={() => {
                                            previews.forEach(p =>
                                                URL.revokeObjectURL(p.url)
                                            );
                                            setPreviews([]);
                                            tus.clearAll();
                                        }}
                                    >
                                        Clear All
                                    </Button>
                                )}
                        </div>
                    )}
                </div>

                <hr />

                {/* Existing Images */}
                <div>
                    <h6 className="mb-3">
                        Uploaded Images ({images.length})
                        {images.length === 0 && (
                            <small className="text-muted ms-2">
                                (No images uploaded yet)
                            </small>
                        )}
                    </h6>

                    {images.length > 0 ? (
                        <Row className="g-3">
                            {images.map((image: VehicleImage) => (
                                <Col
                                    key={image.id}
                                    xs={12}
                                    sm={6}
                                    md={4}
                                    lg={3}
                                >
                                    <Card className="h-100">
                                        <div className="position-relative">
                                            <img
                                                src={image.urls.thumb}
                                                alt={image.file_name}
                                                className="card-img-top"
                                                style={{
                                                    height: '200px',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            {image.is_primary && (
                                                <Badge
                                                    bg="success"
                                                    className="position-absolute top-0 start-0 m-2"
                                                >
                                                    Primary
                                                </Badge>
                                            )}
                                        </div>
                                        <Card.Body className="p-2">
                                            <div className="d-flex flex-column gap-1">
                                                {!image.is_primary && (
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSetPrimary(
                                                                image.id
                                                            )
                                                        }
                                                        disabled={
                                                            setPrimaryMutation.isPending
                                                        }
                                                    >
                                                        Set as Primary
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(image.id)
                                                    }
                                                    disabled={
                                                        deleteMutation.isPending
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                            <small className="text-muted d-block mt-2 text-truncate">
                                                {image.file_name}
                                            </small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div className="text-center text-muted py-4">
                            <p>
                                No images uploaded yet. Use the form above to
                                add images.
                            </p>
                        </div>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}
