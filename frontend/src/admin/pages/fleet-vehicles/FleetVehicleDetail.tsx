import { useEffect, useState } from 'react';

const TRANSMISSION_LABEL: Record<string, string> = {
    automatic: 'Automatic',
    manual: 'Manual',
    'semi-automatic': 'Semi-Automatic',
};

const FUEL_LABEL: Record<string, string> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
};
import { Alert, Badge, Card, Col, Row, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { FaStar, FaTrash, FaTruck, FaCheck, FaXmark } from 'react-icons/fa6';

import {
    useFleetVehicle,
    useUpdateFleetVehicleStatus,
    useToggleFleetVehicleActive,
    useSetPrimaryFleetVehiclePhoto,
    useDeleteFleetVehiclePhoto,
} from '@/shared/hooks/queries/useFleetVehicles';
import { ROUTES } from '@/shared/routes';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { useTitle } from '@/shared/hooks';
import type {
    FleetVehicleStatus,
    FleetServiceAssignment,
} from '@/shared/types/fleetVehicle.types';

/* Helpers */
const STATUS_VARIANT: Record<FleetVehicleStatus, string> = {
    available: 'success',
    on_trip: 'primary',
    maintenance: 'warning',
    inactive: 'secondary',
    retired: 'dark',
};

const STATUS_LABEL: Record<FleetVehicleStatus, string> = {
    available: 'Available',
    on_trip: 'On Trip',
    maintenance: 'Maintenance',
    inactive: 'Inactive',
    retired: 'Retired',
};

function resolveStatus(raw: unknown): FleetVehicleStatus {
    if (typeof raw === 'string') return raw as FleetVehicleStatus;
    if (raw && typeof raw === 'object' && 'value' in raw)
        return (raw as { value: FleetVehicleStatus }).value;
    return 'available';
}

function ExpiryBadge({ date }: { date: string | null | undefined }) {
    if (!date) return <span className="text-muted">-</span>;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(date + 'T00:00:00');
    const diffDays = Math.round(
        (expiry.getTime() - today.getTime()) / 86_400_000
    );
    const formatted = expiry.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    if (diffDays < 0)
        return (
            <span>
                {formatted}{' '}
                <Badge bg="danger" className="ms-1">
                    Expired
                </Badge>
            </span>
        );
    if (diffDays <= 30)
        return (
            <span>
                {formatted}{' '}
                <Badge bg="warning" text="dark" className="ms-1">
                    Expiring Soon
                </Badge>
            </span>
        );
    return <span>{formatted}</span>;
}

/* Component */
export default function FleetVehicleDetail() {
    const { id } = useParams<{ id: string }>();
    useTitle('Chauffeured Vehicle Detail');

    const [selectedPhoto, setSelectedPhoto] = useState(0);
    const [hoveredPhotoId, setHoveredPhotoId] = useState<string | null>(null);

    const { data: vehicleRes, isLoading, isError } = useFleetVehicle(id!);
    const updateStatusMutation = useUpdateFleetVehicleStatus();
    const toggleActiveMutation = useToggleFleetVehicleActive();
    const setPrimaryMutation = useSetPrimaryFleetVehiclePhoto();
    const deletePhotoMutation = useDeleteFleetVehiclePhoto();

    const vehicle = vehicleRes?.data;
    const photos = vehicle?.photos ?? [];

    useEffect(() => {
        if (photos.length > 0 && selectedPhoto >= photos.length) {
            setSelectedPhoto(0);
        }
    }, [photos.length, selectedPhoto]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" variant="primary" />
                <span className="ms-2">Loading vehicle...</span>
            </div>
        );
    }

    if (isError || !vehicle) {
        return <Alert variant="danger">Fleet vehicle not found.</Alert>;
    }

    const status = resolveStatus(vehicle.status);
    const displayPhoto = photos[selectedPhoto] ?? photos[0];

    const assignments = vehicle.service_assignments ?? [];
    const airportAssignments = assignments.filter(
        (a: FleetServiceAssignment) => a.service_type === 'airport'
    );
    const chauffeurAssignment = assignments.find(
        (a: FleetServiceAssignment) => a.service_type === 'chauffeur'
    );

    return (
        <div className="pb-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">
                    {vehicle.make} {vehicle.model}{' '}
                    <span className="text-muted fw-normal">
                        ({vehicle.year})
                    </span>
                </h4>
                <div className="d-flex gap-2">
                    <PermisssionGuard
                        permission={PERMISSIONS.FLEET_VEHICLES.EDIT}
                    >
                        <Link
                            to={ROUTES.DASHBOARD.FLEET_VEHICLES.EDIT(
                                vehicle.id
                            )}
                            className="btn btn-outline-primary btn-sm"
                        >
                            Edit Vehicle
                        </Link>
                    </PermisssionGuard>
                    <Link
                        to={ROUTES.DASHBOARD.FLEET_VEHICLES.ROOT}
                        className="btn btn-outline-secondary btn-sm"
                    >
                        ← Back to List
                    </Link>
                </div>
            </div>

            {/* Row 1: Photos + Info (align-items-start prevents stretch) */}
            <Row className="align-items-start g-3 mb-3">
                {/* Photos */}
                <Col lg={7}>
                    <Card>
                        <Card.Body className="p-2">
                            {displayPhoto ? (
                                <div className="position-relative">
                                    <img
                                        src={displayPhoto.urls.large}
                                        alt={`${vehicle.make} ${vehicle.model}`}
                                        className="w-100 rounded"
                                        style={{
                                            height: 420,
                                            objectFit: 'cover',
                                        }}
                                    />
                                    {selectedPhoto === 0 && (
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
                                    style={{ height: 420 }}
                                >
                                    <div className="text-center text-muted">
                                        <FaTruck
                                            size={48}
                                            className="mb-2 d-block mx-auto"
                                        />
                                        <p className="mb-0">No photos</p>
                                    </div>
                                </div>
                            )}

                            {photos.length > 0 && (
                                <div className="d-flex gap-2 mt-2 overflow-auto">
                                    {photos.map((photo, index) => {
                                        const isPrimary = index === 0;
                                        const isHovered =
                                            hoveredPhotoId === photo.id;
                                        return (
                                            <div
                                                key={photo.id}
                                                className="position-relative flex-shrink-0"
                                                style={{
                                                    width: 80,
                                                    height: 60,
                                                }}
                                                onMouseEnter={() =>
                                                    setHoveredPhotoId(photo.id)
                                                }
                                                onMouseLeave={() =>
                                                    setHoveredPhotoId(null)
                                                }
                                            >
                                                <img
                                                    src={photo.urls.thumb}
                                                    alt={`Photo ${index + 1}`}
                                                    className="rounded w-100 h-100"
                                                    style={{
                                                        objectFit: 'cover',
                                                        cursor: 'pointer',
                                                        border: isPrimary
                                                            ? '3px solid #198754'
                                                            : selectedPhoto ===
                                                                index
                                                              ? '3px solid #0d6efd'
                                                              : '1px solid #dee2e6',
                                                    }}
                                                    onClick={() =>
                                                        setSelectedPhoto(index)
                                                    }
                                                />
                                                {isHovered && (
                                                    <div
                                                        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center gap-1 rounded"
                                                        style={{
                                                            background:
                                                                'rgba(0,0,0,0.5)',
                                                        }}
                                                    >
                                                        {!isPrimary && (
                                                            <PermisssionGuard
                                                                permission={
                                                                    PERMISSIONS
                                                                        .FLEET_VEHICLES
                                                                        .EDIT
                                                                }
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-warning btn-sm p-1"
                                                                    style={{
                                                                        lineHeight: 1,
                                                                    }}
                                                                    title="Set as primary"
                                                                    disabled={
                                                                        setPrimaryMutation.isPending
                                                                    }
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        setPrimaryMutation.mutate(
                                                                            {
                                                                                vehicleId:
                                                                                    vehicle.id,
                                                                                mediaId:
                                                                                    photo.id,
                                                                            }
                                                                        );
                                                                    }}
                                                                >
                                                                    <FaStar
                                                                        size={
                                                                            11
                                                                        }
                                                                    />
                                                                </button>
                                                            </PermisssionGuard>
                                                        )}
                                                        <PermisssionGuard
                                                            permission={
                                                                PERMISSIONS
                                                                    .FLEET_VEHICLES
                                                                    .DELETE
                                                            }
                                                        >
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm p-1"
                                                                style={{
                                                                    lineHeight: 1,
                                                                }}
                                                                title="Delete photo"
                                                                disabled={
                                                                    deletePhotoMutation.isPending
                                                                }
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    deletePhotoMutation.mutate(
                                                                        {
                                                                            vehicleId:
                                                                                vehicle.id,
                                                                            mediaId:
                                                                                photo.id,
                                                                        }
                                                                    );
                                                                }}
                                                            >
                                                                <FaTrash
                                                                    size={11}
                                                                />
                                                            </button>
                                                        </PermisssionGuard>
                                                    </div>
                                                )}
                                                {isPrimary && (
                                                    <span
                                                        className="position-absolute top-0 end-0 m-1 badge bg-success"
                                                        style={{
                                                            fontSize: '0.55em',
                                                            padding: '2px 4px',
                                                        }}
                                                    >
                                                        ★
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Vehicle info */}
                <Col lg={5}>
                    <Card>
                        <Card.Body>
                            <h5 className="mb-3">Vehicle Information</h5>
                            <Row className="g-3">
                                <Col xs={6}>
                                    <div className="text-muted small">Make</div>
                                    <div>{vehicle.make}</div>
                                </Col>
                                <Col xs={6}>
                                    <div className="text-muted small">
                                        Model
                                    </div>
                                    <div>{vehicle.model}</div>
                                </Col>
                                <Col xs={6}>
                                    <div className="text-muted small">Year</div>
                                    <div>{vehicle.year}</div>
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
                                        Branch
                                    </div>
                                    <div>{vehicle.branch?.name ?? '-'}</div>
                                </Col>
                                <Col xs={6}>
                                    <div className="text-muted small">
                                        Transmission
                                    </div>
                                    <div>
                                        {vehicle.transmission
                                            ? (TRANSMISSION_LABEL[
                                                  vehicle.transmission
                                              ] ?? vehicle.transmission)
                                            : '-'}
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="text-muted small">
                                        Fuel Type
                                    </div>
                                    <div>
                                        {vehicle.fuel_type
                                            ? (FUEL_LABEL[vehicle.fuel_type] ??
                                              vehicle.fuel_type)
                                            : '-'}
                                    </div>
                                </Col>
                                {vehicle.engine && (
                                    <Col xs={12}>
                                        <div className="text-muted small">
                                            Engine
                                        </div>
                                        <div>{vehicle.engine}</div>
                                    </Col>
                                )}
                                <Col xs={6}>
                                    <div className="text-muted small">
                                        Personal Vehicle
                                    </div>
                                    <div>
                                        {vehicle.is_personal_vehicle ? (
                                            <span className="text-warning fw-semibold">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="text-muted">
                                                No
                                            </span>
                                        )}
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="text-muted small">
                                        Default Driver
                                    </div>
                                    <div>
                                        {vehicle.default_driver
                                            ? vehicle.default_driver.full_name
                                            : '-'}
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
                                                None
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
                                                None
                                            </span>
                                        )}
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="text-muted small">
                                        Insurance Expiry
                                    </div>
                                    <ExpiryBadge
                                        date={vehicle.insurance_expiry_date}
                                    />
                                </Col>
                                <Col xs={6}>
                                    <div className="text-muted small">
                                        Roadworthy Expiry
                                    </div>
                                    <ExpiryBadge
                                        date={vehicle.roadworthy_expiry_date}
                                    />
                                </Col>
                                {vehicle.features &&
                                    vehicle.features.length > 0 && (
                                        <Col xs={12}>
                                            <div className="text-muted small mb-1">
                                                Features
                                            </div>
                                            <div className="d-flex flex-wrap gap-1">
                                                {vehicle.features.map(f => (
                                                    <Badge
                                                        key={f}
                                                        bg="light"
                                                        text="dark"
                                                        className="border"
                                                    >
                                                        {f}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </Col>
                                    )}
                                {vehicle.notes && (
                                    <Col xs={12}>
                                        <div className="text-muted small">
                                            Notes
                                        </div>
                                        <div className="small">
                                            {vehicle.notes}
                                        </div>
                                    </Col>
                                )}
                                <Col xs={12}>
                                    <div className="pt-2 border-top">
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Badge
                                                bg={
                                                    STATUS_VARIANT[status] ??
                                                    'secondary'
                                                }
                                                className="px-3 py-2"
                                            >
                                                {STATUS_LABEL[status] ?? status}
                                            </Badge>
                                            {vehicle.branch && (
                                                <Badge
                                                    bg="secondary"
                                                    className="px-3 py-2"
                                                >
                                                    {vehicle.branch.name}
                                                </Badge>
                                            )}
                                            <Badge
                                                bg={
                                                    vehicle.is_active
                                                        ? 'success'
                                                        : 'secondary'
                                                }
                                                className="px-3 py-2"
                                            >
                                                {vehicle.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Row 2: Service Assignments */}
            <Row className="g-3 mb-3">
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <Badge bg="warning" text="dark">
                                    Airport
                                </Badge>
                                <span className="fw-semibold">
                                    Airport Transfer Service
                                </span>
                            </div>
                            {airportAssignments.length === 0 ? (
                                <p className="text-muted small mb-0">
                                    Not assigned to any airport packages.
                                </p>
                            ) : (
                                <div className="d-flex flex-column gap-1">
                                    {airportAssignments.map(
                                        (a: FleetServiceAssignment) => (
                                            <div
                                                key={a.id}
                                                className="d-flex align-items-center justify-content-between"
                                            >
                                                <span className="small">
                                                    {a.package?.name ?? '-'}
                                                </span>
                                                <Badge
                                                    bg={
                                                        a.is_active
                                                            ? 'success'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {a.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <Badge bg="info" text="dark">
                                    Chauffeur
                                </Badge>
                                <span className="fw-semibold">
                                    Chauffeur Service
                                </span>
                                <Badge
                                    bg="secondary"
                                    className="fw-normal"
                                    style={{ fontSize: '0.65em' }}
                                >
                                    placeholder
                                </Badge>
                            </div>
                            {!chauffeurAssignment ? (
                                <p className="text-muted small mb-0">
                                    Not assigned to chauffeur service.
                                </p>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    <div>
                                        <div className="text-muted small">
                                            Category
                                        </div>
                                        <div>
                                            {chauffeurAssignment.category
                                                ?.name ?? '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted small">
                                            Base Price
                                        </div>
                                        <div className="fw-semibold text-primary">
                                            {chauffeurAssignment.base_price !=
                                            null
                                                ? chauffeurAssignment.base_price
                                                : '-'}
                                        </div>
                                    </div>
                                    <Badge
                                        bg={
                                            chauffeurAssignment.is_active
                                                ? 'success'
                                                : 'secondary'
                                        }
                                        className="align-self-start"
                                    >
                                        {chauffeurAssignment.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Row 3: Actions + Meta */}
            <Row className="g-3">
                <PermisssionGuard permission={PERMISSIONS.FLEET_VEHICLES.EDIT}>
                    <Col md={6}>
                        <Card>
                            <Card.Body>
                                <h6 className="mb-3">Update Status</h6>
                                <div className="d-flex flex-column gap-2">
                                    {(
                                        [
                                            'available',
                                            'on_trip',
                                            'maintenance',
                                            'inactive',
                                            'retired',
                                        ] as FleetVehicleStatus[]
                                    ).map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={`btn btn-sm ${
                                                status === s
                                                    ? `btn-${STATUS_VARIANT[s]}`
                                                    : `btn-outline-${STATUS_VARIANT[s]}`
                                            }`}
                                            disabled={
                                                status === s ||
                                                updateStatusMutation.isPending
                                            }
                                            onClick={() =>
                                                updateStatusMutation.mutate({
                                                    id: vehicle.id,
                                                    status: s,
                                                })
                                            }
                                        >
                                            {STATUS_LABEL[s]}
                                        </button>
                                    ))}
                                </div>
                                <hr />
                                <button
                                    type="button"
                                    className={`btn btn-sm w-100 ${
                                        vehicle.is_active
                                            ? 'btn-outline-secondary'
                                            : 'btn-outline-success'
                                    }`}
                                    onClick={() =>
                                        toggleActiveMutation.mutate(vehicle.id)
                                    }
                                    disabled={toggleActiveMutation.isPending}
                                >
                                    {toggleActiveMutation.isPending
                                        ? 'Updating...'
                                        : vehicle.is_active
                                          ? 'Deactivate Vehicle'
                                          : 'Activate Vehicle'}
                                </button>
                            </Card.Body>
                        </Card>
                    </Col>
                </PermisssionGuard>

                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Row className="g-2">
                                <Col xs={6}>
                                    <div className="text-muted small">
                                        Added
                                    </div>
                                    <div className="small">
                                        {vehicle.created_at
                                            ? new Date(
                                                  vehicle.created_at
                                              ).toLocaleDateString()
                                            : '-'}
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="text-muted small">
                                        Updated
                                    </div>
                                    <div className="small">
                                        {vehicle.updated_at
                                            ? new Date(
                                                  vehicle.updated_at
                                              ).toLocaleDateString()
                                            : '-'}
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
