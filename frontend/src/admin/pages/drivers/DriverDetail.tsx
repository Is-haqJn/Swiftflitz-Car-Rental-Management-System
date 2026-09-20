import { Alert, Badge, Card, Col, Row } from 'react-bootstrap';
import {
    FaTriangleExclamation,
    FaCircleDot,
    FaCheck,
    FaXmark,
} from 'react-icons/fa6';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    useDriver,
    useUpdateDriverStatus,
} from '@/shared/hooks/queries/useDrivers';
import { ROUTES } from '@/shared/routes';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { useTitle } from '@/shared/hooks';
import type { DriverStatus } from '@/shared/types/driver.types';
import { FaCamera, FaFilePdf } from 'react-icons/fa6';

/* Helpers */
function statusBadgeVariant(status: string): string {
    const map: Record<string, string> = {
        available: 'success',
        on_trip: 'primary',
        off_duty: 'secondary',
        suspended: 'danger',
        inactive: 'dark',
    };
    return map[status] ?? 'secondary';
}

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        available: 'Available',
        on_trip: 'On Trip',
        off_duty: 'Off Duty',
        suspended: 'Suspended',
        inactive: 'Inactive',
    };
    return map[status] ?? status;
}

/* Component */
export default function DriverDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    useTitle('Driver Detail');

    const { data: driverRes, isLoading, isError } = useDriver(id!);
    const updateStatusMutation = useUpdateDriverStatus();

    if (isLoading) {
        return <DetailPageSkeleton withImage cards={3} />;
    }

    if (isError || !driverRes?.data) {
        return <Alert variant="danger">Driver not found.</Alert>;
    }

    const driver = driverRes.data;
    const status =
        typeof driver.status === 'string'
            ? driver.status
            : (driver.status as { value: string }).value;
    const idType =
        driver.id_type == null
            ? null
            : typeof driver.id_type === 'string'
              ? driver.id_type
              : (driver.id_type as { value: string }).value;

    return (
        <div className="pb-4">
            <div className="page-titles mb-3 d-flex justify-content-between align-items-center">
                <div>
                    <h4 className="mb-0">{driver.full_name}</h4>
                    <small className="text-muted">Driver Profile</small>
                </div>
                <div className="d-flex gap-2">
                    <PermisssionGuard permission={PERMISSIONS.DRIVERS.EDIT}>
                        <Link
                            to={ROUTES.DASHBOARD.DRIVERS.EDIT(driver.id)}
                            className="btn btn-outline-primary btn-sm"
                        >
                            Edit Driver
                        </Link>
                    </PermisssionGuard>
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate(ROUTES.DASHBOARD.DRIVERS.ROOT)}
                    >
                        Back
                    </button>
                </div>
            </div>

            {/* Warnings */}
            {driver.license_expired && (
                <Alert variant="danger" className="mb-3">
                    <FaCircleDot className="me-1 text-danger" /> License has
                    expired ({driver.license_expiry_date})
                </Alert>
            )}
            {!driver.license_expired && driver.license_expires_soon && (
                <Alert variant="warning" className="mb-3">
                    <FaTriangleExclamation className="me-1" /> License expires
                    soon ({driver.license_expiry_date})
                </Alert>
            )}
            {driver.id_expired && (
                <Alert variant="danger" className="mb-3">
                    <FaCircleDot className="me-1 text-danger" /> Identity
                    document has expired
                </Alert>
            )}
            {!driver.id_expired && driver.id_expires_soon && (
                <Alert variant="warning" className="mb-3">
                    <FaTriangleExclamation className="me-1" /> Identity document
                    expires soon
                </Alert>
            )}
            {status === 'suspended' && (
                <Alert variant="danger" className="mb-3">
                    <FaCircleDot className="me-1 text-danger" /> Driver is
                    suspended
                </Alert>
            )}

            <Row className="g-3 align-items-start">
                {/* Personal Info */}
                <Col md={8}>
                    <Card className="mb-3">
                        <Card.Header>
                            <h5 className="mb-0">Personal Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-2">
                                <Col sm={6}>
                                    <small className="text-muted d-block">
                                        Phone
                                    </small>
                                    <span>{driver.phone_number}</span>
                                </Col>
                                <Col sm={6}>
                                    <small className="text-muted d-block">
                                        Email
                                    </small>
                                    <span>{driver.email ?? '-'}</span>
                                </Col>
                                <Col sm={6}>
                                    <small className="text-muted d-block">
                                        Date of Birth
                                    </small>
                                    <span>{driver.date_of_birth ?? '-'}</span>
                                </Col>
                                <Col sm={6}>
                                    <small className="text-muted d-block">
                                        City
                                    </small>
                                    <span>{driver.city ?? '-'}</span>
                                </Col>
                                {driver.address && (
                                    <Col sm={12}>
                                        <small className="text-muted d-block">
                                            Address
                                        </small>
                                        <span>{driver.address}</span>
                                    </Col>
                                )}
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* License */}
                    <Card className="mb-3">
                        <Card.Header>
                            <h5 className="mb-0">Driving License</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-2">
                                <Col sm={4}>
                                    <small className="text-muted d-block">
                                        License Number
                                    </small>
                                    <span className="fw-semibold">
                                        {driver.license_number}
                                    </span>
                                </Col>
                                <Col sm={4}>
                                    <small className="text-muted d-block">
                                        Class
                                    </small>
                                    <span>{driver.license_class}</span>
                                </Col>
                                <Col sm={4}>
                                    <small className="text-muted d-block">
                                        Expiry
                                    </small>
                                    <span
                                        className={
                                            driver.license_expired
                                                ? 'text-danger fw-semibold'
                                                : driver.license_expires_soon
                                                  ? 'text-warning fw-semibold'
                                                  : ''
                                        }
                                    >
                                        {driver.license_expiry_date}
                                    </span>
                                </Col>
                            </Row>

                            {/* License photo */}
                            {driver.license_photo && (
                                <>
                                    <hr className="my-3" />
                                    <small className="text-muted d-block mb-2">
                                        License Photo
                                    </small>
                                    {driver.license_photo.mime_type ===
                                    'application/pdf' ? (
                                        <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                                            <FaFilePdf
                                                size={20}
                                                className="text-danger"
                                            />
                                            <a
                                                href={
                                                    driver.license_photo.urls
                                                        .original
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="small"
                                            >
                                                View License PDF
                                            </a>
                                        </div>
                                    ) : (
                                        <a
                                            href={
                                                driver.license_photo.urls
                                                    .original
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <img
                                                src={
                                                    driver.license_photo.urls
                                                        .thumb ??
                                                    driver.license_photo.urls
                                                        .original
                                                }
                                                alt="License"
                                                className="border rounded"
                                                style={{
                                                    maxWidth: 220,
                                                    maxHeight: 140,
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        </a>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Identity Document */}
                    {(idType || driver.id_number) && (
                        <Card className="mb-3">
                            <Card.Header>
                                <h5 className="mb-0">Identity Document</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-2">
                                    <Col sm={4}>
                                        <small className="text-muted d-block">
                                            Type
                                        </small>
                                        <span>{idType ?? '-'}</span>
                                    </Col>
                                    <Col sm={4}>
                                        <small className="text-muted d-block">
                                            Number
                                        </small>
                                        <span>{driver.id_number ?? '-'}</span>
                                    </Col>
                                    <Col sm={4}>
                                        <small className="text-muted d-block">
                                            Expiry
                                        </small>
                                        <span
                                            className={
                                                driver.id_expired
                                                    ? 'text-danger fw-semibold'
                                                    : driver.id_expires_soon
                                                      ? 'text-warning fw-semibold'
                                                      : ''
                                            }
                                        >
                                            {driver.id_expiry_date ?? '-'}
                                        </span>
                                    </Col>
                                </Row>

                                {/* ID document image */}
                                {driver.id_document && (
                                    <>
                                        <hr className="my-3" />
                                        <small className="text-muted d-block mb-2">
                                            Document Image
                                        </small>
                                        {driver.id_document.mime_type ===
                                        'application/pdf' ? (
                                            <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                                                <FaFilePdf
                                                    size={20}
                                                    className="text-danger"
                                                />
                                                <a
                                                    href={
                                                        driver.id_document.urls
                                                            .original
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="small"
                                                >
                                                    View ID Document PDF
                                                </a>
                                            </div>
                                        ) : (
                                            <a
                                                href={
                                                    driver.id_document.urls
                                                        .original
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <img
                                                    src={
                                                        driver.id_document.urls
                                                            .thumb ??
                                                        driver.id_document.urls
                                                            .original
                                                    }
                                                    alt="ID Document"
                                                    className="border rounded"
                                                    style={{
                                                        maxWidth: 220,
                                                        maxHeight: 140,
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            </a>
                                        )}
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Emergency Contact */}
                    {(driver.emergency_contact_name ||
                        driver.emergency_contact_phone) && (
                        <Card className="mb-3">
                            <Card.Header>
                                <h5 className="mb-0">Emergency Contact</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-2">
                                    <Col sm={4}>
                                        <small className="text-muted d-block">
                                            Name
                                        </small>
                                        <span>
                                            {driver.emergency_contact_name ??
                                                '-'}
                                        </span>
                                    </Col>
                                    <Col sm={4}>
                                        <small className="text-muted d-block">
                                            Phone
                                        </small>
                                        <span>
                                            {driver.emergency_contact_phone ??
                                                '-'}
                                        </span>
                                    </Col>
                                    <Col sm={4}>
                                        <small className="text-muted d-block">
                                            Relation
                                        </small>
                                        <span>
                                            {driver.emergency_contact_relation ??
                                                '-'}
                                        </span>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                {/* Sidebar */}
                <Col md={4}>
                    {/* Driver Photo */}
                    <Card className="mb-3">
                        <Card.Header>
                            <h5 className="mb-0">Profile Photo</h5>
                        </Card.Header>
                        <Card.Body className="text-center">
                            {driver.driver_photo ? (
                                <img
                                    src={
                                        driver.driver_photo.urls.medium ??
                                        driver.driver_photo.urls.original
                                    }
                                    alt={driver.full_name}
                                    className="rounded"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: 200,
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <div
                                    className="d-flex flex-column align-items-center justify-content-center text-muted border rounded bg-light mx-auto"
                                    style={{ width: 120, height: 160 }}
                                >
                                    <FaCamera size={28} className="mb-1" />
                                    <small>No photo</small>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Status Card */}
                    <Card className="mb-3">
                        <Card.Header>
                            <h5 className="mb-0">Status</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <Badge bg={statusBadgeVariant(status)}>
                                    {statusLabel(status)}
                                </Badge>
                                {!driver.is_active && (
                                    <Badge bg="dark" className="ms-2">
                                        Inactive
                                    </Badge>
                                )}
                            </div>
                            <PermisssionGuard
                                permission={PERMISSIONS.DRIVERS.EDIT}
                            >
                                <div>
                                    <small className="text-muted d-block mb-1">
                                        Update Status
                                    </small>
                                    <select
                                        className="form-select form-select-sm"
                                        value={status}
                                        disabled={
                                            updateStatusMutation.isPending
                                        }
                                        onChange={e =>
                                            updateStatusMutation.mutate({
                                                id: driver.id,
                                                status: e.target
                                                    .value as DriverStatus,
                                            })
                                        }
                                    >
                                        <option value="available">
                                            Available
                                        </option>
                                        <option value="on_trip">On Trip</option>
                                        <option value="off_duty">
                                            Off Duty
                                        </option>
                                        <option value="suspended">
                                            Suspended
                                        </option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>
                            </PermisssionGuard>
                        </Card.Body>
                    </Card>

                    {/* Services */}
                    <Card className="mb-3">
                        <Card.Header>
                            <h5 className="mb-0">Services</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex flex-column gap-1">
                                <span>
                                    {driver.available_for_chauffeur ? (
                                        <Badge bg="info" text="dark">
                                            <FaCheck className="me-1" />{' '}
                                            Chauffeur
                                        </Badge>
                                    ) : (
                                        <span className="text-muted small">
                                            <FaXmark className="me-1" /> Not
                                            available for Chauffeur
                                        </span>
                                    )}
                                </span>
                                <span>
                                    {driver.available_for_airport ? (
                                        <Badge bg="warning" text="dark">
                                            <FaCheck className="me-1" /> Airport
                                            Transfers
                                        </Badge>
                                    ) : (
                                        <span className="text-muted small">
                                            <FaXmark className="me-1" /> Not
                                            available for Airport
                                        </span>
                                    )}
                                </span>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Notes */}
                    {driver.notes && (
                        <Card className="mb-3">
                            <Card.Header>
                                <h5 className="mb-0">Notes</h5>
                            </Card.Header>
                            <Card.Body>
                                <p className="mb-0 small">{driver.notes}</p>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </div>
    );
}
