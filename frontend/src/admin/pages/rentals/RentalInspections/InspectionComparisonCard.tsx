import { useState } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { formatDateTime } from '@/shared/libs/utils';
import type { RentalInspection, RentalVideoMedia } from '@/shared/types/rental.types';
import MediaLightbox, { type LightboxSlide } from '@adminComponents/MediaLightbox';

/* Fuel gauge display */
const FUEL_LABELS: Record<string, { label: string; color: string }> = {
    empty: { label: 'Empty', color: 'danger' },
    quarter: { label: '¼', color: 'warning' },
    half: { label: '½', color: 'warning' },
    three_quarter: { label: '¾', color: 'success' },
    full: { label: 'Full', color: 'success' },
};

function FuelBadge({ level }: { level: string | null }) {
    if (!level) return <span className="text-muted">-</span>;
    const info = FUEL_LABELS[level] ?? { label: level, color: 'secondary' };
    return (
        <Badge bg={info.color} className="fw-semibold">
            {info.label}
        </Badge>
    );
}

/* Inspection panel */
function InspectionPanel({
    inspection,
    label,
    allSlides,
    videos,
}: {
    inspection: RentalInspection;
    label: string;
    allSlides: LightboxSlide[];
    videos?: RentalVideoMedia[] | null;
}) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const severityColor =
        inspection.damage_severity === 'severe'
            ? 'danger'
            : inspection.damage_severity === 'moderate'
              ? 'warning'
              : 'info';

    const photoSlides: LightboxSlide[] = inspection.photos.map(url => ({
        type: 'image',
        src: url,
    }));

    const slidesToShow = allSlides.length > 0 ? allSlides : photoSlides;

    function openLightbox(photoIndex: number) {
        setLightboxIndex(photoIndex);
        setLightboxOpen(true);
    }

    return (
        <div className="h-100">
            <p className="small fw-semibold text-uppercase text-muted mb-2">
                {label}
            </p>

            <dl className="row small gy-1 mb-0">
                <dt className="col-5 fw-normal text-muted">Date</dt>
                <dd className="col-7 text-end mb-0">
                    {formatDateTime(inspection.created_at)}
                </dd>

                <dt className="col-5 fw-normal text-muted">Inspector</dt>
                <dd className="col-7 text-end mb-0">
                    {inspection.inspector?.name ?? '-'}
                </dd>

                <dt className="col-5 fw-normal text-muted">Fuel</dt>
                <dd className="col-7 text-end mb-0">
                    <FuelBadge level={inspection.fuel_level} />
                </dd>

                {inspection.mileage != null && (
                    <>
                        <dt className="col-5 fw-normal text-muted">Mileage</dt>
                        <dd className="col-7 text-end mb-0">
                            {inspection.mileage.toLocaleString()} km
                        </dd>
                    </>
                )}

                {inspection.condition_notes && (
                    <>
                        <dt className="col-5 fw-normal text-muted">Notes</dt>
                        <dd className="col-7 text-end mb-0 text-wrap">
                            {inspection.condition_notes}
                        </dd>
                    </>
                )}

                {inspection.damage_noted && (
                    <>
                        <dt className="col-5 fw-normal text-muted">Damage</dt>
                        <dd className="col-7 text-end mb-0">
                            <Badge bg="warning" text="dark">
                                Noted
                            </Badge>
                        </dd>
                    </>
                )}
            </dl>

            {/* Damage detail (return only) */}
            {inspection.damage_noted && (
                <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded border border-warning border-opacity-25">
                    {inspection.damage_severity && (
                        <div className="d-flex align-items-center gap-1 mb-1">
                            <Badge
                                bg={severityColor}
                                className="text-capitalize"
                            >
                                {inspection.damage_severity}
                            </Badge>
                        </div>
                    )}
                    {(inspection.damage_types ?? []).length > 0 && (
                        <div className="d-flex flex-wrap gap-1 mb-1">
                            {(inspection.damage_types ?? []).map(t => (
                                <Badge
                                    key={t}
                                    bg="secondary"
                                    className="fw-normal text-capitalize small"
                                >
                                    {t}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {inspection.damage_description && (
                        <p className="small mb-0 text-muted">
                            {inspection.damage_description}
                        </p>
                    )}
                </div>
            )}

            {/* Photos */}
            {inspection.photos.length > 0 && (
                <div className="mt-2">
                    <p className="small text-muted mb-1">Photos</p>
                    <div className="d-flex flex-wrap gap-1">
                        {inspection.photos.map((url, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className="p-0 border-0 bg-transparent"
                                onClick={() => openLightbox(idx)}
                            >
                                <img
                                    src={url}
                                    alt={`Photo ${idx + 1}`}
                                    style={{
                                        width: 56,
                                        height: 56,
                                        objectFit: 'cover',
                                        borderRadius: 4,
                                        border: '1px solid #dee2e6',
                                        cursor: 'pointer',
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Videos */}
            {(videos ?? []).length > 0 && (
                <div className="mt-2">
                    <p className="small text-muted mb-1">Videos</p>
                    <div className="d-flex flex-wrap gap-1">
                        {(videos ?? []).map((v, idx) => {
                            const lightboxIdx =
                                inspection.photos.length +
                                (videos ?? [])
                                    .slice(0, idx)
                                    .filter(x => !x.video_deleted).length;
                            return (
                                <div key={v.id} style={{ position: 'relative' }}>
                                    <button
                                        type="button"
                                        className="p-0 border-0 bg-transparent"
                                        onClick={() => {
                                            if (!v.video_deleted) {
                                                openLightbox(lightboxIdx);
                                            }
                                        }}
                                        style={{
                                            cursor: v.video_deleted
                                                ? 'default'
                                                : 'pointer',
                                        }}
                                        title={
                                            v.video_deleted
                                                ? 'Video removed'
                                                : `Video ${idx + 1}`
                                        }
                                    >
                                        {v.thumbnail_url ? (
                                            <img
                                                src={v.thumbnail_url}
                                                alt={`Video ${idx + 1}`}
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    objectFit: 'cover',
                                                    borderRadius: 4,
                                                    border: '1px solid #dee2e6',
                                                    opacity: v.video_deleted
                                                        ? 0.4
                                                        : 1,
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="d-flex align-items-center justify-content-center text-muted"
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 4,
                                                    border: '1px solid #dee2e6',
                                                    background: '#f8f9fa',
                                                    fontSize: 22,
                                                    opacity: v.video_deleted
                                                        ? 0.4
                                                        : 1,
                                                }}
                                            >
                                                🎬
                                            </div>
                                        )}
                                    </button>
                                    {v.video_deleted && (
                                        <span
                                            className="badge bg-secondary"
                                            style={{
                                                position: 'absolute',
                                                bottom: 2,
                                                left: 2,
                                                fontSize: 8,
                                                padding: '1px 3px',
                                            }}
                                        >
                                            Removed
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <MediaLightbox
                open={lightboxOpen}
                slides={slidesToShow}
                index={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
            />
        </div>
    );
}

/* Main component */
interface InspectionComparisonCardProps {
    inspections: RentalInspection[];
    pickupVideos?: RentalVideoMedia[] | null;
    returnVideos?: RentalVideoMedia[] | null;
}

export default function InspectionComparisonCard({
    inspections,
    pickupVideos,
    returnVideos,
}: InspectionComparisonCardProps) {
    const pickup = inspections.find(i => i.type === 'pickup') ?? null;
    const returnInspection = inspections.find(i => i.type === 'return') ?? null;

    if (!pickup && !returnInspection) return null;

    const buildSlides = (
        inspection: RentalInspection,
        videos?: RentalVideoMedia[] | null,
    ): LightboxSlide[] => {
        const photoSlides: LightboxSlide[] = inspection.photos.map(url => ({
            type: 'image',
            src: url,
        }));

        const videoSlides: LightboxSlide[] = (videos ?? [])
            .filter(v => !v.video_deleted)
            .map(v => ({
                type: 'video',
                src: v.stream_url,
                poster: v.thumbnail_url ?? undefined,
                mimeType: v.mime_type,
            }));

        return [...photoSlides, ...videoSlides];
    };

    const pickupSlides = pickup ? buildSlides(pickup, pickupVideos) : [];
    const returnSlides = returnInspection ? buildSlides(returnInspection, returnVideos) : [];

    return (
        <Card className="mt-3">
            <Card.Header className="py-2">
                <Card.Title className="small fw-semibold mb-0 text-uppercase text-muted">
                    Inspection Log
                </Card.Title>
            </Card.Header>
            <Card.Body className="p-3">
                <Row className="g-3">
                    <Col md={6}>
                        {pickup ? (
                            <InspectionPanel
                                inspection={pickup}
                                label="Pickup Inspection"
                                allSlides={pickupSlides}
                                videos={pickupVideos}
                            />
                        ) : (
                            <p className="text-muted small mb-0">
                                No pickup inspection recorded.
                            </p>
                        )}
                    </Col>
                    {returnInspection && (
                        <>
                            <Col md={12} className="d-md-none">
                                <hr className="my-0" />
                            </Col>
                            <Col
                                md={6}
                                className="border-start-md"
                                style={{ borderLeft: '1px solid #dee2e6' }}
                            >
                                <InspectionPanel
                                    inspection={returnInspection}
                                    label="Return Inspection"
                                    allSlides={returnSlides}
                                    videos={returnVideos}
                                />
                            </Col>
                        </>
                    )}
                </Row>
            </Card.Body>
        </Card>
    );
}
