// CustomerDocumentManager.tsx
import { useEffect, useRef, useState } from 'react';
import { Row, Col, Card, Button, Spinner, Badge, Form } from 'react-bootstrap';
import { useDeleteCustomerDocument } from '@/shared/hooks/queries/useCustomers';
import { useCustomer, customerKeys } from '@/shared/hooks/queries/useCustomers';
import { useTusMultiUpload } from '@/shared/hooks/useTusMultiUpload';
import TusUploadToast from '@/shared/components/ui/TusUploadToast';
import { useQueryClient } from '@tanstack/react-query';
import MediaLightbox, {
    type LightboxSlide,
} from '@adminComponents/MediaLightbox';

/* Types */
type DocumentCollection = 'license' | 'id_document' | 'documents';

interface DocumentSection {
    collection: DocumentCollection;
    label: string;
    description: string;
    multiple: boolean;
}

interface CustomerDocumentManagerProps {
    customerId: string;
}

/* Document section config */
const DOCUMENT_SECTIONS: DocumentSection[] = [
    {
        collection: 'license',
        label: "Driver's License",
        description:
            'Front and back of license. JPEG, PNG, WebP. Max 5MB each.',
        multiple: true,
    },
    {
        collection: 'id_document',
        label: 'ID Document',
        description: 'Ghana Card, Passport, or Voter ID scan. Max 5MB.',
        multiple: false,
    },
    {
        collection: 'documents',
        label: 'Additional Documents',
        description: 'Any other supporting documents.',
        multiple: true,
    },
];

/* Single Section Upload Panel */
function DocumentUploadPanel({
    section,
    customerId,
    existingDocs,
}: {
    section: DocumentSection;
    customerId: string;
    existingDocs: Array<{
        id: number;
        collection: string;
        urls: { thumb: string; original: string };
        file_name: string;
    }>;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const deleteMutation = useDeleteCustomerDocument();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const tus = useTusMultiUpload({
        endpoint: '/api/v1/uploads/tus',
        entityType: 'customer_document',
        extraMetadata: {
            entity_id: customerId,
            collection: section.collection,
        },
    });

    const sectionDocs = existingDocs.filter(
        d => d.collection === section.collection
    );

    const lightboxSlides: LightboxSlide[] = sectionDocs.map(doc => ({
        type: 'image',
        src: doc.urls.original,
    }));

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        const validFiles = newFiles.filter(f =>
            ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
        );

        if (validFiles.length !== newFiles.length) {
            alert(
                'Some files were skipped. Only JPEG, PNG, and WebP are allowed.'
            );
        }

        const filesToUpload = section.multiple
            ? validFiles
            : validFiles.slice(0, 1);

        if (filesToUpload.length > 0) {
            tus.addFiles(filesToUpload);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Auto-refresh + clear when all uploads finish
    useEffect(() => {
        if (!tus.allSucceeded || tus.files.length === 0) return;
        queryClient.invalidateQueries({
            queryKey: customerKeys.detail(customerId),
        });
        tus.clearAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tus.allSucceeded]);

    const handleDelete = (documentId: number) => {
        if (window.confirm('Delete this document?')) {
            deleteMutation.mutate({ customerId, documentId });
        }
    };

    return (
        <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
                <div>
                    <h6 className="mb-0">{section.label}</h6>
                    <small className="text-muted">{section.description}</small>
                </div>
                {sectionDocs.length > 0 && (
                    <Badge bg="success">{sectionDocs.length} uploaded</Badge>
                )}
            </div>

            {/* Existing uploaded docs */}
            {sectionDocs.length > 0 && (
                <>
                    <Row className="g-2 mb-3">
                        {sectionDocs.map(doc => (
                            <Col key={doc.id} xs={6} sm={4} md={3}>
                                <div className="position-relative border rounded overflow-hidden">
                                    <img
                                        src={doc.urls.thumb}
                                        alt={doc.file_name}
                                        className="w-100"
                                        style={{
                                            height: '120px',
                                            objectFit: 'cover',
                                            cursor: 'zoom-in',
                                        }}
                                        onClick={() => {
                                            setLightboxIndex(
                                                sectionDocs.indexOf(doc)
                                            );
                                            setLightboxOpen(true);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                        style={{
                                            padding: '0.15rem 0.4rem',
                                            fontSize: '0.75rem',
                                        }}
                                        onClick={() => handleDelete(doc.id)}
                                        disabled={deleteMutation.isPending}
                                        title="Delete"
                                    >
                                        ×
                                    </button>
                                    <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-1">
                                        <small
                                            className="d-block text-truncate"
                                            style={{ fontSize: '0.65rem' }}
                                        >
                                            {doc.file_name}
                                        </small>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    <MediaLightbox
                        open={lightboxOpen}
                        slides={lightboxSlides}
                        index={lightboxIndex}
                        onClose={() => setLightboxOpen(false)}
                    />
                </>
            )}

            {/* File picker */}
            <Form.Group>
                <Form.Control
                    ref={fileInputRef}
                    type="file"
                    multiple={section.multiple}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    size="sm"
                    disabled={tus.isUploading}
                />
            </Form.Group>

            {/* TUS per-file progress (floating toast panel) */}
            <TusUploadToast
                files={tus.files}
                onPause={tus.pauseFile}
                onResume={tus.resumeFile}
                onRemove={tus.removeFile}
            />

            <div className="d-flex gap-2 mt-2">
                {tus.hasPending && !tus.isUploading && (
                    <Button variant="primary" size="sm" onClick={tus.startAll}>
                        Upload{' '}
                        {tus.files.filter(f => f.status === 'pending').length}{' '}
                        File
                        {tus.files.filter(f => f.status === 'pending')
                            .length !== 1
                            ? 's'
                            : ''}
                    </Button>
                )}
                {tus.isUploading && (
                    <span className="text-muted small align-self-center">
                        Uploading… refreshing automatically when done.
                    </span>
                )}
            </div>
        </div>
    );
}

/* Main Manager Component */
export default function CustomerDocumentManager({
    customerId,
}: CustomerDocumentManagerProps) {
    const { data: customerResponse, isLoading } = useCustomer(customerId);

    // customerService.get() returns ApiResponse<Customer> - .data is Customer directly
    const customer = customerResponse?.data;

    // Combine all Spatie Media collections into one array.
    // Tag each doc with its collection name based on its source array,
    // since CustomerResource does not include collection_name on document items.
    const documents = [
        ...(customer?.license_images || []).map(doc => ({
            id: doc.id,
            collection: 'license' as const,
            urls: doc.urls,
            file_name: doc.file_name,
        })),
        ...(customer?.id_document_images || []).map(doc => ({
            id: doc.id,
            collection: 'id_document' as const,
            urls: doc.urls,
            file_name: doc.file_name,
        })),
        ...(customer?.additional_documents || []).map(doc => ({
            id: doc.id,
            collection: 'documents' as const,
            urls: doc.urls,
            file_name: doc.file_name,
        })),
    ];

    if (isLoading) {
        return (
            <div className="text-center py-3 text-muted">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading documents...
            </div>
        );
    }

    return (
        <Card className="mb-4">
            <Card.Header>
                <Card.Title>Customer Documents</Card.Title>
                <small className="text-muted">
                    Upload license, ID, and any supporting documents
                </small>
            </Card.Header>
            <Card.Body>
                {DOCUMENT_SECTIONS.map((section, idx) => (
                    <div key={section.collection}>
                        <DocumentUploadPanel
                            section={section}
                            customerId={customerId}
                            existingDocs={documents}
                        />
                        {idx < DOCUMENT_SECTIONS.length - 1 && (
                            <hr className="my-3" />
                        )}
                    </div>
                ))}
            </Card.Body>
        </Card>
    );
}
