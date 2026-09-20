import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import {
    Badge,
    Col,
    Dropdown,
    Form,
    InputGroup,
    Modal,
    Row,
    Button,
} from 'react-bootstrap';
import type {
    ChauffeurBooking,
    ChauffeurBookingFilters,
    ChauffeurBookingStatus,
    CancelChauffeurBookingData,
} from '@/shared/types/chauffeur-booking.types';
import {
    useChauffeurBookings,
    useConfirmChauffeurBooking,
    useDeleteChauffeurBooking,
    useCancelChauffeurBooking,
    chauffeurBookingKeys,
} from '@/shared/hooks/queries/useChauffeurBookings';
import { chauffeurBookingService } from '@/services/chauffeurBookingService';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { PERMISSIONS } from '@/shared/config/permissions';
import { usePermission, useTitle } from '@/shared/hooks';
import { ROUTES } from '@/shared/routes';
import { formatWithSymbol } from '@/shared/libs/currency';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';

const STATUS_VARIANT: Record<ChauffeurBookingStatus, string> = {
    pending: 'secondary',
    confirmed: 'primary',
    driver_assigned: 'warning',
    in_progress: 'success',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'dark',
};

const STATUS_LABEL: Record<ChauffeurBookingStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    driver_assigned: 'Driver Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
};

/* Three-dot toggle */
const ThreeDotToggle = () => (
    <Dropdown.Toggle variant="" className="btn-link i-false p-0">
        <svg width="20px" height="20px" viewBox="0 0 24 24" version="1.1">
            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <rect x="0" y="0" width="24" height="24" />
                <circle fill="#000000" cx="5" cy="12" r="2" />
                <circle fill="#000000" cx="12" cy="12" r="2" />
                <circle fill="#000000" cx="19" cy="12" r="2" />
            </g>
        </svg>
    </Dropdown.Toggle>
);

/* Cancel Modal */
function CancelModal({
    booking,
    show,
    onHide,
}: {
    booking: ChauffeurBooking | null;
    show: boolean;
    onHide: () => void;
}) {
    const [reason, setReason] = useState('');
    const cancelMutation = useCancelChauffeurBooking();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!booking) return;
        cancelMutation.mutate(
            {
                id: booking.id,
                payload: {
                    reason: reason || undefined,
                } as CancelChauffeurBookingData,
            },
            {
                onSuccess: () => {
                    onHide();
                    setReason('');
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Cancel Booking</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <p className="text-muted small mb-3">
                        A cancellation fee may apply. This action cannot be
                        undone.
                    </p>
                    <Form.Group>
                        <Form.Label>Reason (optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Reason for cancellation"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Back
                    </Button>
                    <Button
                        variant="danger"
                        type="submit"
                        disabled={cancelMutation.isPending}
                    >
                        {cancelMutation.isPending
                            ? 'Cancelling...'
                            : 'Cancel Booking'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Main Component */
export default function AllChauffeurBookings() {
    useTitle('Chauffeur Bookings');
    const navigate = useNavigate();
    const activeBranchId = useSelector(selectActiveBranchId);
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';

    const [filters, setFilters] = useState<ChauffeurBookingFilters>({
        page: 1,
        per_page: 15,
        ...(activeBranchId ? { 'filter[branch_id]': activeBranchId } : {}),
    });

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            'filter[branch_id]': activeBranchId ?? undefined,
            page: 1,
        }));
    }, [activeBranchId]);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<ChauffeurBooking | null>(
        null
    );
    const [cancelTarget, setCancelTarget] = useState<ChauffeurBooking | null>(
        null
    );

    const { hasAnyPermission } = usePermission();
    const canManage = hasAnyPermission([
        PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_BOOKINGS,
    ]);

    const {
        data: response,
        isLoading,
        isError,
    } = useChauffeurBookings(filters);
    const deleteMutation = useDeleteChauffeurBooking();
    const confirmMutation = useConfirmChauffeurBooking();

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => chauffeurBookingService.delete(id),
        invalidateKeys: [chauffeurBookingKeys.lists()],
        entityName: 'booking',
        onSuccess: () => setSelectedIds([]),
    });

    const bookings = useMemo<ChauffeurBooking[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setFilters(prev => ({
                ...prev,
                'filter[customer_full_name]': search || undefined,
                page: 1,
            }));
        },
        [search]
    );

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setFilters({ page: 1, per_page: 15 });
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === bookings.length ? [] : bookings.map(b => b.id)
        );
    }, [bookings]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const columns: Column<ChauffeurBooking>[] = [
        {
            key: 'booking_reference',
            label: 'Reference',
            render: b => (
                <div>
                    <span
                        className="fw-bold text-primary"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                            navigate(
                                ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.BOOKINGS.VIEW(
                                    b.id
                                )
                            )
                        }
                    >
                        {b.booking_reference}
                    </span>
                    <br />
                    <small className="text-muted">
                        {b.vehicle
                            ? `${b.vehicle.make} ${b.vehicle.model}`
                            : 'No vehicle assigned'}
                    </small>
                </div>
            ),
        },
        {
            key: 'chauffeur_customer' as const,
            label: 'Customer',
            render: b => (
                <div>
                    <span className="fw-semibold">
                        {b.chauffeur_customer?.full_name ?? '-'}
                    </span>
                    <br />
                    <small className="text-muted">
                        {b.chauffeur_customer?.phone}
                    </small>
                </div>
            ),
        },
        {
            key: 'pickup_time',
            label: 'Pickup',
            render: b => (
                <span>
                    {new Date(b.pickup_time).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            ),
        },
        {
            key: 'total_amount',
            label: 'Total',
            render: b => (
                <span className="fw-semibold">
                    {formatWithSymbol(
                        b.total_amount,
                        b.currency_symbol ?? globalSymbol
                    )}
                </span>
            ),
        },
        {
            key: 'booking_status',
            label: 'Status',
            render: b => (
                <Badge bg={STATUS_VARIANT[b.booking_status] ?? 'secondary'}>
                    {STATUS_LABEL[b.booking_status] ?? b.booking_status}
                </Badge>
            ),
        },
        {
            key: 'payment_status',
            label: 'Payment',
            render: b => (
                <Badge
                    bg={
                        b.payment_status === 'paid'
                            ? 'success'
                            : b.payment_status === 'refunded'
                              ? 'info'
                              : 'warning'
                    }
                >
                    {b.payment_status === 'paid'
                        ? 'Paid'
                        : b.payment_status === 'refunded'
                          ? 'Refunded'
                          : 'Pending'}
                </Badge>
            ),
        },
        ...(canManage
            ? [
                  {
                      key: 'actions' as const,
                      label: 'Action',
                      className: 'text-end',
                      render: (b: ChauffeurBooking) => {
                          const s = b.booking_status;
                          const canConfirm = s === 'pending';
                          const canCancel = b.is_cancellable;
                          return (
                              <Dropdown align="end">
                                  <ThreeDotToggle />
                                  <Dropdown.Menu
                                      popperConfig={{ strategy: 'fixed' }}
                                      renderOnMount
                                  >
                                      <Dropdown.Item
                                          onClick={() =>
                                              navigate(
                                                  ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.BOOKINGS.VIEW(
                                                      b.id
                                                  )
                                              )
                                          }
                                      >
                                          View Details
                                      </Dropdown.Item>

                                      {(canConfirm || canCancel) && (
                                          <Dropdown.Divider />
                                      )}

                                      {canConfirm && (
                                          <Dropdown.Item
                                              className="text-primary"
                                              disabled={
                                                  confirmMutation.isPending
                                              }
                                              onClick={() =>
                                                  confirmMutation.mutate(b.id)
                                              }
                                          >
                                              Confirm Booking
                                          </Dropdown.Item>
                                      )}

                                      {canCancel && (
                                          <Dropdown.Item
                                              className="text-danger"
                                              onClick={() => setCancelTarget(b)}
                                          >
                                              Cancel Booking
                                          </Dropdown.Item>
                                      )}

                                      <Dropdown.Divider />
                                      <Dropdown.Item
                                          className="text-danger"
                                          onClick={() => setDeleteTarget(b)}
                                      >
                                          Delete
                                      </Dropdown.Item>
                                  </Dropdown.Menu>
                              </Dropdown>
                          );
                      },
                  },
              ]
            : []),
    ];

    const headerActions = (
        <button
            className="btn btn-primary btn-sm"
            onClick={() =>
                navigate(ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.BOOKINGS.CREATE)
            }
        >
            + New Booking
        </button>
    );

    return (
        <>
            <FilterBox>
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search Customer
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Customer name..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Search
                                </button>
                            </InputGroup>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Status
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters['filter[booking_status]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[booking_status]':
                                            (e.target
                                                .value as ChauffeurBookingStatus) ||
                                            undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="driver_assigned">
                                    Driver Assigned
                                </option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="no_show">No Show</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Payment
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters['filter[payment_status]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[payment_status]':
                                            (e.target.value as
                                                | 'pending'
                                                | 'paid'
                                                | 'refunded') || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Payments</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="refunded">Refunded</option>
                            </Form.Select>
                        </Col>
                        <Col md={1}>
                            <button
                                type="button"
                                className="btn btn-outline-secondary w-100"
                                onClick={handleClearFilters}
                            >
                                Clear
                            </button>
                        </Col>
                    </Row>
                </Form>
            </FilterBox>

            <DataTable
                title="Chauffeur Bookings"
                data={bookings}
                columns={columns}
                meta={meta}
                isLoading={isLoading}
                isError={isError}
                selectedIds={selectedIds}
                onSelectAll={toggleSelectAll}
                onSelectOne={toggleOne}
                onBulkDelete={() => bulkDelete(selectedIds)}
                isBulkDeleting={isBulkDeleting}
                deleteTarget={deleteTarget}
                deleteTargetName={deleteTarget?.booking_reference}
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No bookings found"
                emptyMessage="Create your first chauffeur booking to get started."
            />

            <CancelModal
                booking={cancelTarget}
                show={!!cancelTarget}
                onHide={() => setCancelTarget(null)}
            />
        </>
    );
}
