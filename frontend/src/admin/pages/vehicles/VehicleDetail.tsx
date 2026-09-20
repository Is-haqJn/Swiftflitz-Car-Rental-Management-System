import { Fragment, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Alert } from 'react-bootstrap';
import { FaCar, FaCheck, FaXmark } from 'react-icons/fa6';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import MediaLightbox, {
    type LightboxSlide,
} from '@adminComponents/MediaLightbox';
import { useVehicle } from '@/shared/hooks/queries/useVehicles';
import { useTitle } from '@/shared/hooks';
import VehicleExpenseModal from '@adminPages/vehicles/VehicleExpenseModal';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import {
    useFormatCurrency,
    useGeneralSettings,
} from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';
import { useAppSelector } from '@/store';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';

function ExpiryBadge({ date }: { date: string | null | undefined }) {
    if (!date) return <span className="text-muted">-</span>;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(date);
    const diffDays = Math.round(
        (expiry.getTime() - today.getTime()) / 86_400_000
    );
    const formatted = expiry.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    if (diffDays < 0) {
        return (
            <span>
                {formatted}{' '}
                <Badge bg="danger" className="ms-1">
                    Expired
                </Badge>
            </span>
        );
    }
    if (diffDays <= 30) {
        return (
            <span>
                {formatted}{' '}
                <Badge bg="warning" text="dark" className="ms-1">
                    Expiring Soon
                </Badge>
            </span>
        );
    }
    return <span>{formatted}</span>;
}

export default function VehicleDetail() {
    const formatCurrency = useFormatCurrency();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? 'GHS';
    const activeBranchId = useAppSelector(selectActiveBranchId);
    const title = useTitle('Vehicle Details');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState<number>(0);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const {
        data: vehicleResponse,
        isLoading,
        isError,
        error,
    } = useVehicle(id!);

    //console.log(vehicleResponse);

    const vehicle = vehicleResponse?.data;

    // Helper to get status badge color
    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            available: 'success',
            rented: 'warning',
            maintenance: 'danger',
            returned: 'info',
            pending_approval: 'warning',
            unavailable: 'secondary',
        };
        return badges[status] || 'secondary';
    };

    if (isLoading) {
        return (
            <>
                {title}
                <DetailPageSkeleton withImage cards={3} />
            </>
        );
    }

    if (isError || !vehicle) {
        return (
            <Fragment>
                {title}
                <Alert variant="danger">
                    {(error as Error)?.message || 'Vehicle not found.'}
                </Alert>
                <Button
                    variant="primary"
                    onClick={() => navigate('/management/vehicles')}
                >
                    Back to Self-Drive Fleet
                </Button>
            </Fragment>
        );
    }

    const allImages = [...(vehicle.images || [])].sort((a, b) =>
        a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1
    );
    const displayImage = allImages[selectedImage] ?? allImages[0];

    const imageSlides: LightboxSlide[] = allImages.map(img => ({
        type: 'image',
        src: img.urls.large,
    }));

    return (
        <>
            {title}
            <div className="pb-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="mb-0">{vehicle.name}</h4>
                    <div className="d-flex gap-2">
                        <PermisssionGuard
                            permission={PERMISSIONS.VEHICLES.MANAGE_MAINTENANCE}
                        >
                            <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => setShowExpenseModal(true)}
                            >
                                + Add Expense
                            </Button>
                        </PermisssionGuard>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => navigate('/management/vehicles')}
                        >
                            ← Back to List
                        </Button>
                    </div>
                </div>

                <VehicleExpenseModal
                    mode="petty"
                    show={showExpenseModal}
                    onHide={() => setShowExpenseModal(false)}
                    vehicleId={vehicle.id}
                    vehicleName={vehicle.name}
                />

                <Row>
                    {/* Left: Images Only */}
                    <Col lg={7}>
                        <Card>
                            <Card.Body className="p-2">
                                {/* Main Image */}
                                {displayImage ? (
                                    <div
                                        className="position-relative"
                                        style={{ cursor: 'zoom-in' }}
                                        onClick={() => {
                                            setLightboxIndex(selectedImage);
                                            setLightboxOpen(true);
                                        }}
                                    >
                                        <img
                                            src={displayImage.urls.large}
                                            alt={vehicle.name}
                                            className="w-100 rounded"
                                            style={{
                                                height: '450px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                        {displayImage.is_primary && (
                                            <Badge
                                                bg="success"
                                                className="position-absolute top-0 start-0 m-2"
                                            >
                                                Primary
                                            </Badge>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className="d-flex align-items-center justify-content-center bg-light rounded"
                                        style={{ height: '450px' }}
                                    >
                                        <div className="text-center text-muted">
                                            <div className="fs-1 mb-2">
                                                <FaCar />
                                            </div>
                                            <p className="mb-0">No images</p>
                                        </div>
                                    </div>
                                )}

                                {/* Thumbnails */}
                                {allImages.length > 1 && (
                                    <div className="d-flex gap-2 mt-2 overflow-auto">
                                        {allImages.map((image, index) => (
                                            <img
                                                key={image.id}
                                                src={image.urls.thumb}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="rounded"
                                                style={{
                                                    width: '80px',
                                                    height: '60px',
                                                    objectFit: 'cover',
                                                    cursor: 'zoom-in',
                                                    border:
                                                        selectedImage === index
                                                            ? '3px solid #0d6efd'
                                                            : '1px solid #dee2e6',
                                                }}
                                                onClick={() => {
                                                    setSelectedImage(index);
                                                    setLightboxIndex(index);
                                                    setLightboxOpen(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div
                                    className="d-grid gap-2"
                                    style={{ marginTop: '5rem' }}
                                >
                                    <PermisssionGuard
                                        permission={PERMISSIONS.VEHICLES.EDIT}
                                    >
                                        <Button
                                            variant="primary"
                                            onClick={() =>
                                                navigate(
                                                    `/management/vehicles/${vehicle.id}/edit`
                                                )
                                            }
                                        >
                                            Edit Vehicle
                                        </Button>
                                    </PermisssionGuard>
                                    <PermisssionGuard
                                        permission={PERMISSIONS.VEHICLES.DELETE}
                                    >
                                        <Button variant="outline-danger">
                                            Delete Vehicle
                                        </Button>
                                    </PermisssionGuard>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right: Simple Order */}
                    <Col lg={5}>
                        {/* 1. Pricing */}
                        <Card className="mb-3">
                            <Card.Body>
                                <h5 className="mb-3">Pricing</h5>

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <div className="text-muted small">
                                            Daily Rate
                                        </div>
                                        <h3 className="mb-0 text-primary">
                                            {(() => {
                                                const sym =
                                                    vehicle.branch
                                                        ?.currency_symbol;
                                                const rate =
                                                    vehicle.branch
                                                        ?.exchange_rate;
                                                const showDual =
                                                    !!rate &&
                                                    (!activeBranchId ||
                                                        activeBranchId !==
                                                            vehicle.branch_id);
                                                if (showDual && rate && sym) {
                                                    return `${formatWithSymbol(vehicle.daily_rate, sym)} / ${formatWithSymbol(vehicle.daily_rate * rate, globalSymbol)}`;
                                                }
                                                return sym
                                                    ? formatWithSymbol(
                                                          vehicle.daily_rate,
                                                          sym
                                                      )
                                                    : formatCurrency(
                                                          vehicle.daily_rate
                                                      );
                                            })()}
                                        </h3>
                                    </div>
                                    <Badge
                                        bg={
                                            vehicle.price_visible
                                                ? 'success'
                                                : 'secondary'
                                        }
                                    >
                                        {vehicle.price_visible
                                            ? 'Public'
                                            : 'Hidden'}
                                    </Badge>
                                </div>

                                <h5 className="mb-3">Vehicle Information</h5>

                                {/* Specs Grid */}
                                <Row className="g-3 mb-3">
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Category
                                        </div>
                                        <div>
                                            {vehicle.category?.icon}{' '}
                                            {vehicle.category?.name}
                                        </div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Year
                                        </div>
                                        <div>{vehicle.year}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Make
                                        </div>
                                        <div>{vehicle.make}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Model
                                        </div>
                                        <div>{vehicle.model}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Color
                                        </div>
                                        <div>{vehicle.color}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Seats
                                        </div>
                                        <div>{vehicle.seats}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Fuel Type
                                        </div>
                                        <div className="text-capitalize">
                                            {vehicle.fuel_type}
                                        </div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Transmission
                                        </div>
                                        <div className="text-capitalize">
                                            {vehicle.transmission}
                                        </div>
                                    </Col>
                                    {vehicle.engine_size && (
                                        <Col xs={6}>
                                            <div className="text-muted small">
                                                Engine Size
                                            </div>
                                            <div>{vehicle.engine_size}</div>
                                        </Col>
                                    )}
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Odometer
                                        </div>
                                        <div>
                                            {vehicle.odometer?.toLocaleString()}{' '}
                                            km
                                        </div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Insurance
                                        </div>
                                        <div>
                                            {vehicle.has_insurance ? (
                                                <span className="text-success fw-semibold">
                                                    <FaCheck className="me-1" />{' '}
                                                    Valid
                                                </span>
                                            ) : (
                                                <span className="text-danger">
                                                    <FaXmark className="me-1" />{' '}
                                                    Not confirmed
                                                </span>
                                            )}
                                        </div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Roadworthy
                                        </div>
                                        <div>
                                            {vehicle.has_roadworthy ? (
                                                <span className="text-success fw-semibold">
                                                    <FaCheck className="me-1" />{' '}
                                                    Valid
                                                </span>
                                            ) : (
                                                <span className="text-danger">
                                                    <FaXmark className="me-1" />{' '}
                                                    Not confirmed
                                                </span>
                                            )}
                                        </div>
                                    </Col>
                                    <Col xs={12}>
                                        <div className="text-muted small">
                                            License Plate
                                        </div>
                                        <div className="fw-semibold">
                                            {vehicle.license_plate}
                                        </div>
                                    </Col>
                                    {vehicle.vin && (
                                        <Col xs={12}>
                                            <div className="text-muted small">
                                                VIN
                                            </div>
                                            <div className="font-monospace small">
                                                {vehicle.vin}
                                            </div>
                                        </Col>
                                    )}
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Roadworthy Expiry
                                        </div>
                                        <div>
                                            <ExpiryBadge
                                                date={
                                                    vehicle.roadworthy_expiry_date
                                                }
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">
                                            Insurance Expiry
                                        </div>
                                        <div>
                                            <ExpiryBadge
                                                date={
                                                    vehicle.insurance_expiry_date
                                                }
                                            />
                                        </div>
                                    </Col>
                                </Row>
                                {/* Features - Neatly under Vehicle Information */}
                                {/*{vehicle.features &&
                                vehicle.features?.length > 0 && (
                                    <div className="pt-3 border-top">
                                        <div className="text-muted small mb-2">
                                            Features
                                        </div>
                                        <div className="d-flex flex-wrap gap-2">
                                            {vehicle?.features?.map(
                                                (feature, index) => (
                                                    <Badge
                                                        key={index}
                                                        bg="light"
                                                        text="dark"
                                                        className="px-2 py-1"
                                                    >
                                                        {feature}
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}*/}
                                <h5
                                    className="mb-3"
                                    style={{ marginTop: '2rem' }}
                                >
                                    Status
                                </h5>
                                <div className="d-flex gap-2 flex-wrap">
                                    <Badge
                                        bg={getStatusBadge(vehicle.status)}
                                        className="px-3 py-2"
                                    >
                                        {vehicle.status.toUpperCase()}
                                    </Badge>
                                    {vehicle.branch && (
                                        <Badge
                                            bg="secondary"
                                            className="px-3 py-2"
                                        >
                                            {vehicle.branch.name}
                                        </Badge>
                                    )}
                                    {/*{vehicle.is_featured && (*/}
                                    {/*    <Badge bg="warning" className="px-3 py-2">*/}
                                    {/*        FEATURED*/}
                                    {/*    </Badge>*/}
                                    {/*)}*/}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Full-width: Description & Condition Notes */}
                {(vehicle.description || vehicle.condition_notes) && (
                    <Row className="mt-3">
                        {vehicle.description && (
                            <Col
                                md={vehicle.condition_notes ? 6 : 12}
                                className="mb-3"
                            >
                                <Card className="h-100">
                                    <Card.Body>
                                        <h6 className="mb-2">Description</h6>
                                        <p className="mb-0 text-muted">
                                            {vehicle.description}
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}
                        {vehicle.condition_notes && (
                            <Col
                                md={vehicle.description ? 6 : 12}
                                className="mb-3"
                            >
                                <Card className="h-100">
                                    <Card.Body>
                                        <h6 className="mb-2">
                                            Condition Notes
                                        </h6>
                                        <p className="mb-0 text-muted">
                                            {vehicle.condition_notes}
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}
                    </Row>
                )}
            </div>

            <MediaLightbox
                open={lightboxOpen}
                slides={imageSlides}
                index={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
            />
        </>
    );
}
