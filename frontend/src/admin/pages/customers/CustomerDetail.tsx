// CustomerDetail.tsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Row, Col, Card, Badge, Alert, Button } from 'react-bootstrap';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import {
    useCustomer,
    useVerifyCustomer,
    useRequestReupload,
} from '@/shared/hooks/queries/useCustomers';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import { useTitle } from '@/shared/hooks';
import BlacklistToggleDropdown from '@adminPages/customers/BlacklistToggleDropdown';
import { SVGICON } from '@adminConstants/theme';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import type { CustomerDocument, Rental } from '@/shared/types';
import {
    formatDate,
    formatStatus,
    isLicenseExpired,
    isLicenseExpiringSoon,
} from '@/shared/libs/utils';

/* Local types for nested data */
// These mirror what your API returns inside the customer object.
// Adjust field names if your backend uses different keys.

/* Sub-components */
function RentalStatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        active: 'bg-success',
        completed: 'bg-secondary',
        cancelled: 'bg-danger',
        overdue: 'bg-warning',
        pending: 'bg-info',
    };
    return (
        <span
            className={`badge ${map[status] ?? 'bg-secondary'} text-capitalize`}
        >
            {status}
        </span>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="d-flex py-2 border-bottom">
            <span className="text-muted" style={{ minWidth: 160 }}>
                {label}
            </span>
            <span className="fw-semibold">{value ?? '-'}</span>
        </div>
    );
}

/* Main Component */
export default function CustomerDetail() {
    const formatCurrency = useFormatCurrency();
    const title = useTitle('Customer Details');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: response, isLoading, isError } = useCustomer(id!);
    const verifyCustomer = useVerifyCustomer();
    const requestReupload = useRequestReupload();

    if (isLoading) {
        return (
            <>
                {title}
                <DetailPageSkeleton cards={2} />
            </>
        );
    }

    if (isError || !response) {
        return (
            <>
                {title}
                <Alert variant="danger">
                    Failed to load customer.{' '}
                    <Link to="/management/customers">Go back</Link>
                </Alert>
            </>
        );
    }

    // Unwrap to the customer object - adjust if your API shape differs
    const customer = response?.data;

    const rentals: Rental[] = customer?.rentals ?? [];
    const licenseDocs: CustomerDocument[] = customer?.license_images ?? [];
    const idDocs: CustomerDocument[] = customer?.id_document_images ?? [];
    const passportDocs: CustomerDocument[] = customer?.passport_images ?? [];

    const licenseExpired = isLicenseExpired(customer.license_expiry_date);
    const licenseExpiringSoon = isLicenseExpiringSoon(
        customer.license_expiry_date
    );

    const completedRentals = rentals.filter(
        r => r.status === 'completed'
    ).length;
    const activeRentals = rentals.filter(r => r.status === 'active').length;

    return (
        <>
            {title}
            <div className="pb-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-0">{customer.name}</h4>
                        <small className="text-muted">{customer.email}</small>
                    </div>
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                        {/* Profile status badge */}
                        {customer.profile_status && (
                            <Badge
                                bg={
                                    customer.profile_status === 'verified'
                                        ? 'success'
                                        : customer.profile_status ===
                                            'pending_review'
                                          ? 'warning'
                                          : customer.profile_status ===
                                              'rejected'
                                            ? 'danger'
                                            : 'secondary'
                                }
                                className="text-capitalize"
                            >
                                {formatStatus(customer.profile_status)}
                            </Badge>
                        )}

                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => navigate('/management/customers')}
                        >
                            ← All Customers
                        </Button>

                        {customer.profile_status !== 'verified' && (
                            <PermisssionGuard
                                permission={PERMISSIONS.CUSTOMERS.EDIT}
                            >
                                <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() =>
                                        verifyCustomer.mutate(customer.id)
                                    }
                                    disabled={verifyCustomer.isPending}
                                >
                                    {verifyCustomer.isPending
                                        ? 'Verifying…'
                                        : 'Verify Customer'}
                                </Button>
                            </PermisssionGuard>
                        )}

                        <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => requestReupload.mutate(customer.id)}
                            disabled={requestReupload.isPending}
                        >
                            {requestReupload.isPending
                                ? 'Sending…'
                                : 'Request Doc Reupload'}
                        </Button>

                        <Link
                            to={`/management/customers/${customer.id}/edit`}
                            className="btn btn-primary btn-sm"
                        >
                            {SVGICON.pencil} Edit
                        </Link>
                    </div>
                </div>

                <Row className="g-4">
                    {/* Left column */}
                    <Col lg={4}>
                        {/* Status / stats card */}
                        <Card className="mb-4">
                            <Card.Body className="text-center py-4">
                                <div
                                    className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center
                                           justify-content-center mx-auto mb-3"
                                    style={{
                                        width: 72,
                                        height: 72,
                                        fontSize: '1.75rem',
                                    }}
                                >
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <h5 className="mb-1">{customer.name}</h5>
                                <div className="mb-3">
                                    <BlacklistToggleDropdown
                                        customer={customer}
                                    />
                                </div>
                                <div className="d-flex justify-content-center gap-3 text-center">
                                    <div>
                                        <div className="fw-bold fs-5">
                                            {rentals.length}
                                        </div>
                                        <small className="text-muted">
                                            Total
                                        </small>
                                    </div>
                                    <div className="border-start ps-3">
                                        <div className="fw-bold fs-5 text-success">
                                            {completedRentals}
                                        </div>
                                        <small className="text-muted">
                                            Completed
                                        </small>
                                    </div>
                                    <div className="border-start ps-3">
                                        <div className="fw-bold fs-5 text-primary">
                                            {activeRentals}
                                        </div>
                                        <small className="text-muted">
                                            Active
                                        </small>
                                    </div>
                                </div>

                                {/* License & ID */}
                                <Card.Header>
                                    <Card.Title className="fs-6 mb-0">
                                        License & Identification
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <InfoRow
                                        label="License Number"
                                        value={customer.license_number}
                                    />
                                    <InfoRow
                                        label="License Expiry"
                                        value={
                                            <span
                                                className={
                                                    licenseExpired
                                                        ? 'text-danger'
                                                        : licenseExpiringSoon
                                                          ? 'text-warning'
                                                          : ''
                                                }
                                            >
                                                {formatDate(
                                                    customer.license_expiry_date
                                                )}
                                                {licenseExpired && (
                                                    <Badge
                                                        bg="danger"
                                                        className="ms-2"
                                                    >
                                                        Expired
                                                    </Badge>
                                                )}
                                                {licenseExpiringSoon &&
                                                    !licenseExpired && (
                                                        <Badge
                                                            bg="warning"
                                                            text="dark"
                                                            className="ms-2"
                                                        >
                                                            Expiring Soon
                                                        </Badge>
                                                    )}
                                            </span>
                                        }
                                    />
                                    <InfoRow
                                        label="ID Type"
                                        value={
                                            <span className="text-capitalize">
                                                {formatStatus(customer.id_type)}
                                            </span>
                                        }
                                    />
                                    <InfoRow
                                        label="ID Number"
                                        value={customer.id_number}
                                    />
                                </Card.Body>

                                {/* Documents card */}
                                <Card.Header>
                                    <Card.Title className="fs-6 mb-0">
                                        Documents
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <div className="text-muted small fw-semibold mb-2">
                                            Driver's License
                                        </div>
                                        {licenseDocs.length > 0 ? (
                                            <Row className="g-2">
                                                {licenseDocs.map(doc => (
                                                    <Col xs={6} key={doc.id}>
                                                        <a
                                                            href={
                                                                doc.urls
                                                                    .original
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <img
                                                                src={
                                                                    doc.urls
                                                                        .thumb
                                                                }
                                                                alt={
                                                                    doc.file_name
                                                                }
                                                                className="w-100 rounded border"
                                                                style={{
                                                                    height: '80px',
                                                                    objectFit:
                                                                        'cover',
                                                                }}
                                                            />
                                                        </a>
                                                    </Col>
                                                ))}
                                            </Row>
                                        ) : (
                                            <small className="text-danger">
                                                No license uploaded
                                            </small>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-muted small fw-semibold mb-2">
                                            ID Document
                                        </div>
                                        {idDocs.length > 0 ? (
                                            <Row className="g-2">
                                                {idDocs.map(doc => (
                                                    <Col xs={6} key={doc.id}>
                                                        <a
                                                            href={
                                                                doc.urls
                                                                    .original
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <img
                                                                src={
                                                                    doc.urls
                                                                        .thumb
                                                                }
                                                                alt={
                                                                    doc.file_name
                                                                }
                                                                className="w-100 rounded border"
                                                                style={{
                                                                    height: '80px',
                                                                    objectFit:
                                                                        'cover',
                                                                }}
                                                            />
                                                        </a>
                                                    </Col>
                                                ))}
                                            </Row>
                                        ) : (
                                            <small className="text-danger">
                                                No ID uploaded
                                            </small>
                                        )}
                                    </div>

                                    <div className="mt-3">
                                        <div className="text-muted small fw-semibold mb-2">
                                            Passport
                                        </div>
                                        {passportDocs.length > 0 ? (
                                            <Row className="g-2">
                                                {passportDocs.map(doc => (
                                                    <Col xs={6} key={doc.id}>
                                                        <a
                                                            href={
                                                                doc.urls
                                                                    .original
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <img
                                                                src={
                                                                    doc.urls
                                                                        .thumb
                                                                }
                                                                alt={
                                                                    doc.file_name
                                                                }
                                                                className="w-100 rounded border"
                                                                style={{
                                                                    height: '80px',
                                                                    objectFit:
                                                                        'cover',
                                                                }}
                                                            />
                                                        </a>
                                                    </Col>
                                                ))}
                                            </Row>
                                        ) : (
                                            <small className="text-muted">
                                                No passport uploaded
                                            </small>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right column */}
                    <Col lg={8}>
                        {/* Personal details */}
                        <Card className="mb-4">
                            {/* License warning */}
                            {licenseExpired && (
                                <Alert variant="danger" className="mb-4">
                                    <strong>License Expired</strong> - This
                                    customer's license expired on{' '}
                                    {formatDate(customer.license_expiry_date)}.
                                    They cannot rent until renewed.
                                </Alert>
                            )}
                            {licenseExpiringSoon && !licenseExpired && (
                                <Alert variant="warning" className="mb-4">
                                    <strong>License Expiring Soon</strong> -
                                    Expires on{' '}
                                    {formatDate(customer.license_expiry_date)}.
                                </Alert>
                            )}

                            {/* Blacklist reason */}
                            {customer.is_blacklisted &&
                                customer.blacklist_reason && (
                                    <Alert variant="danger" className="mb-4">
                                        <strong>Blacklisted:</strong>{' '}
                                        {customer.blacklist_reason}
                                    </Alert>
                                )}
                            <Card.Header>
                                <Card.Title className="fs-6 mb-0">
                                    Personal Information
                                </Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <InfoRow
                                    label="Full Name"
                                    value={customer.name}
                                />
                                <InfoRow label="Email" value={customer.email} />
                                <InfoRow label="Phone" value={customer.phone} />
                                {customer.alt_phone && (
                                    <InfoRow
                                        label="Alt Phone"
                                        value={customer.alt_phone}
                                    />
                                )}
                                <InfoRow
                                    label="Address"
                                    value={customer.address}
                                />
                                {customer.date_of_birth && (
                                    <InfoRow
                                        label="Date of Birth"
                                        value={formatDate(
                                            customer.date_of_birth
                                        )}
                                    />
                                )}
                                <InfoRow
                                    label="Member Since"
                                    value={formatDate(customer.created_at)}
                                />
                                {customer.branches &&
                                    customer.branches.length > 0 && (
                                        <InfoRow
                                            label="Branches"
                                            value={
                                                <div className="d-flex flex-wrap gap-1">
                                                    {customer.branches.map(
                                                        branch => (
                                                            <Badge
                                                                key={branch.id}
                                                                bg="secondary"
                                                                className="small"
                                                            >
                                                                {branch.name}
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                            }
                                        />
                                    )}
                            </Card.Body>
                            {/* Emergency contact */}
                            {customer.emergency_contact && (
                                <Card>
                                    <Card.Header>
                                        <Card.Title className="fs-6 mb-0">
                                            Emergency Contact
                                        </Card.Title>
                                    </Card.Header>
                                    <Card.Body>
                                        <InfoRow
                                            label="Name"
                                            value={
                                                customer.emergency_contact.name
                                            }
                                        />
                                        <InfoRow
                                            label="Phone"
                                            value={
                                                customer.emergency_contact.phone
                                            }
                                        />
                                        <InfoRow
                                            label="Relationship"
                                            value={
                                                customer.emergency_contact
                                                    .relationship
                                            }
                                        />
                                    </Card.Body>
                                </Card>
                            )}
                            {/* Notes */}
                            {customer.notes && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <Card.Title className="fs-6 mb-0">
                                            Notes
                                        </Card.Title>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="mb-0 text-muted">
                                            {customer.notes}
                                        </p>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Rental History */}
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <Card.Title className="fs-6 mb-0">
                                    Rental History{' '}
                                    <Badge bg="secondary" className="ms-1">
                                        {rentals.length}
                                    </Badge>
                                </Card.Title>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {rentals.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        <p className="mb-0">
                                            No rental history yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Vehicle</th>
                                                    <th>Start Date</th>
                                                    <th>End Date</th>
                                                    <th>Amount</th>
                                                    <th>Status</th>
                                                    <th className="text-end">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rentals.map(
                                                    (rental: Rental) => (
                                                        <tr key={rental.id}>
                                                            <td>
                                                                <div className="fw-semibold">
                                                                    {rental
                                                                        .vehicle
                                                                        ?.name ??
                                                                        '-'}
                                                                </div>
                                                                <small className="text-muted">
                                                                    {rental
                                                                        .vehicle
                                                                        ?.license_plate ??
                                                                        ''}
                                                                </small>
                                                            </td>
                                                            <td>
                                                                {rental.pickup_date
                                                                    ? formatDate(
                                                                          rental.pickup_date
                                                                      )
                                                                    : '-'}
                                                            </td>
                                                            <td>
                                                                {rental.return_date
                                                                    ? formatDate(
                                                                          rental.return_date
                                                                      )
                                                                    : '-'}
                                                            </td>
                                                            <td>
                                                                <strong>
                                                                    {rental.total_cost !=
                                                                    null
                                                                        ? formatCurrency(
                                                                              Number(
                                                                                  rental.total_cost
                                                                              )
                                                                          )
                                                                        : '-'}
                                                                </strong>
                                                            </td>
                                                            <td>
                                                                <RentalStatusBadge
                                                                    status={
                                                                        rental.status
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="text-end">
                                                                <Link
                                                                    to={`/management/rentals/${rental.id}`}
                                                                    className="btn btn-info shadow btn-xs sharp"
                                                                    title="View Rental"
                                                                >
                                                                    {
                                                                        SVGICON.eye
                                                                    }
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
}
