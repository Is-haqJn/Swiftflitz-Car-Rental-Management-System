import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import {
    Badge,
    Button,
    Col,
    Dropdown,
    Form,
    InputGroup,
    Modal,
    Row,
} from 'react-bootstrap';
import type {
    AirportBooking,
    AirportBookingFilters,
    AirportBookingStatus,
    AssignmentTarget,
} from '@/shared/types/airport-booking.types';
import {
    useAirportBookings,
    useConfirmAirportBooking,
    useAssignAirportBookingDriver,
    useStartAirportTrip,
    useCancelAirportBooking,
    useDeleteAirportBooking,
    airportBookingKeys,
} from '@/shared/hooks/queries/useAirportBookings';
import { useAvailableAirportDrivers } from '@/shared/hooks/queries/useDrivers';
import { useAvailableFleetVehiclesForAirport } from '@/shared/hooks/queries/useFleetVehicles';
import { airportBookingService } from '@/services/airportBookingService';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { usePermission, useTitle } from '@/shared/hooks';
import { ROUTES } from '@/shared/routes';
import { FaPlane } from 'react-icons/fa6';
import { formatWithSymbol } from '@/shared/libs/currency';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';

const STATUS_VARIANT: Record<AirportBookingStatus, string> = {
    pending: 'secondary',
    payment_received: 'info',
    confirmed: 'primary',
    driver_assigned: 'warning',
    in_progress: 'success',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'dark',
};

const STATUS_LABEL: Record<AirportBookingStatus, string> = {
    pending: 'Pending',
    payment_received: 'Payment Received',
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

/* Assign Modal */
const ASSIGN_TITLES: Record<AssignmentTarget, string> = {
    driver_only: 'Assign Driver',
    vehicle_only: 'Assign Vehicle',
    driver_and_vehicle: 'Assign Driver & Vehicle',
};

function AssignModal({
    bookingId,
    target,
    show,
    onHide,
}: {
    bookingId: string;
    target: AssignmentTarget;
    show: boolean;
    onHide: () => void;
}) {
    const [driverId, setDriverId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const assignMutation = useAssignAirportBookingDriver();

    const needsDriver =
        target === 'driver_only' || target === 'driver_and_vehicle';
    const needsVehicle =
        target === 'vehicle_only' || target === 'driver_and_vehicle';

    const { data: driversRes, isLoading: driversLoading } =
        useAvailableAirportDrivers(show && needsDriver);
    const { data: vehiclesRes, isLoading: vehiclesLoading } =
        useAvailableFleetVehiclesForAirport(show && needsVehicle);

    const drivers = driversRes?.data ?? [];
    const vehicles = vehiclesRes?.data ?? [];
    const canSubmit =
        (!needsDriver || !!driverId) && (!needsVehicle || !!vehicleId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: { driver_id?: string; vehicle_id?: string } = {};
        if (needsDriver) payload.driver_id = driverId;
        if (needsVehicle) payload.vehicle_id = vehicleId;
        assignMutation.mutate(
            { id: bookingId, payload },
            {
                onSuccess: () => {
                    onHide();
                    setDriverId('');
                    setVehicleId('');
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">
                    {ASSIGN_TITLES[target]}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {needsDriver && (
                        <Form.Group className={needsVehicle ? 'mb-3' : ''}>
                            <Form.Label>Driver</Form.Label>
                            <Form.Select
                                value={driverId}
                                onChange={e => setDriverId(e.target.value)}
                                required
                                disabled={driversLoading}
                            >
                                <option value="">
                                    {driversLoading
                                        ? 'Loading drivers…'
                                        : 'Select a driver…'}
                                </option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.first_name} {d.last_name} -{' '}
                                        {d.phone_number}
                                    </option>
                                ))}
                            </Form.Select>
                            {drivers.length === 0 && !driversLoading && (
                                <Form.Text className="text-warning">
                                    No available airport drivers found.
                                </Form.Text>
                            )}
                        </Form.Group>
                    )}
                    {needsVehicle && (
                        <Form.Group>
                            <Form.Label>Fleet Vehicle</Form.Label>
                            <Form.Select
                                value={vehicleId}
                                onChange={e => setVehicleId(e.target.value)}
                                required
                                disabled={vehiclesLoading}
                            >
                                <option value="">
                                    {vehiclesLoading
                                        ? 'Loading vehicles…'
                                        : 'Select a vehicle…'}
                                </option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.year} {v.make} {v.model} (
                                        {v.license_plate})
                                    </option>
                                ))}
                            </Form.Select>
                            {vehicles.length === 0 && !vehiclesLoading && (
                                <Form.Text className="text-warning">
                                    No available fleet vehicles found.
                                </Form.Text>
                            )}
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={assignMutation.isPending || !canSubmit}
                    >
                        {assignMutation.isPending ? 'Assigning…' : 'Assign'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Cancel Modal */
function CancelModal({
    bookingId,
    show,
    onHide,
}: {
    bookingId: string;
    show: boolean;
    onHide: () => void;
}) {
    const [reason, setReason] = useState('');
    const cancelMutation = useCancelAirportBooking();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        cancelMutation.mutate(
            { id: bookingId, payload: { reason: reason || undefined } },
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
                        A cancellation fee may apply depending on how close to
                        the scheduled time this cancellation is made.
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
                            ? 'Cancelling…'
                            : 'Cancel Booking'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Main Component */
export default function AllAirportBookings() {
    useTitle('Airport Bookings');
    const navigate = useNavigate();
    const activeBranchId = useSelector(selectActiveBranchId);
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';

    const [filters, setFilters] = useState<AirportBookingFilters>({
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
    const [deleteTarget, setDeleteTarget] = useState<AirportBooking | null>(
        null
    );
    const [assignTarget, setAssignTarget] = useState<{
        id: string;
        target: AssignmentTarget;
    } | null>(null);
    const [cancelTarget, setCancelTarget] = useState<AirportBooking | null>(
        null
    );

    const { hasAnyPermission } = usePermission();
    const canManage = hasAnyPermission([
        PERMISSIONS.AIRPORT_TRANSFER.MANAGE_BOOKINGS,
    ]);

    const { data: response, isLoading, isError } = useAirportBookings(filters);
    const deleteMutation = useDeleteAirportBooking();
    const confirmMutation = useConfirmAirportBooking();
    const startTripMutation = useStartAirportTrip();

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => airportBookingService.delete(id),
        invalidateKeys: [airportBookingKeys.lists()],
        entityName: 'booking',
        onSuccess: () => setSelectedIds([]),
    });

    const bookings = useMemo<AirportBooking[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setFilters(prev => ({
                ...prev,
                'filter[search]': search || undefined,
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

    const columns: Column<AirportBooking>[] = [
        {
            key: 'booking_reference',
            label: 'Reference',
            render: booking => (
                <div>
                    <span
                        className="fw-bold text-primary"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                            navigate(
                                ROUTES.DASHBOARD.AIRPORT_TRANSFER.BOOKINGS.VIEW(
                                    booking.id
                                )
                            )
                        }
                    >
                        {booking.booking_reference}
                    </span>
                    <br />
                    <small className="text-muted">
                        <FaPlane className="me-1" />
                        {booking.direction === 'pickup'
                            ? 'Airport Pickup'
                            : 'Airport Dropoff'}
                    </small>
                </div>
            ),
        },
        {
            key: 'airport_customer' as const,
            label: 'Customer',
            render: booking => (
                <div>
                    <span className="fw-semibold">
                        {booking.airport_customer?.full_name ??
                            booking.passenger_name}
                    </span>
                    <br />
                    <small className="text-muted">
                        {booking.airport_customer?.email}
                    </small>
                </div>
            ),
        },
        {
            key: 'scheduled_at',
            label: 'Scheduled',
            render: booking => (
                <span>
                    {booking.scheduled_at
                        ? new Date(booking.scheduled_at).toLocaleString(
                              'en-GB',
                              {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                              }
                          )
                        : '-'}
                </span>
            ),
        },
        {
            key: 'package' as const,
            label: 'Package',
            render: booking => <span>{booking.package?.name ?? '-'}</span>,
        },
        {
            key: 'total_amount',
            label: 'Total',
            render: booking => (
                <span className="fw-semibold">
                    {formatWithSymbol(
                        booking.total_amount,
                        booking.currency_symbol ?? globalSymbol
                    )}
                </span>
            ),
        },
        {
            key: 'booking_status',
            label: 'Status',
            render: booking => (
                <Badge
                    bg={STATUS_VARIANT[booking.booking_status] ?? 'secondary'}
                >
                    {STATUS_LABEL[booking.booking_status] ??
                        booking.booking_status}
                </Badge>
            ),
        },
        ...(canManage
            ? [
                  {
                      key: 'actions' as const,
                      label: 'Action',
                      className: 'text-end',
                      render: (booking: AirportBooking) => {
                          const s = booking.booking_status;
                          const canConfirm = s === 'payment_received';
                          const canAssignDriver =
                              s === 'confirmed' || s === 'driver_assigned';
                          const canAssignVehicle =
                              s === 'confirmed' || s === 'driver_assigned';
                          const canAssignBoth = s === 'confirmed';
                          const canStartTrip =
                              (s === 'confirmed' || s === 'driver_assigned') &&
                              !!booking.driver &&
                              !!booking.vehicle;
                          const canCancel = booking.is_cancellable;
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
                                                  ROUTES.DASHBOARD.AIRPORT_TRANSFER.BOOKINGS.VIEW(
                                                      booking.id
                                                  )
                                              )
                                          }
                                      >
                                          View Details
                                      </Dropdown.Item>

                                      {(canConfirm ||
                                          canAssignDriver ||
                                          canAssignVehicle ||
                                          canStartTrip) && <Dropdown.Divider />}

                                      {canConfirm && (
                                          <Dropdown.Item
                                              className="text-primary"
                                              disabled={
                                                  confirmMutation.isPending
                                              }
                                              onClick={() =>
                                                  confirmMutation.mutate(
                                                      booking.id
                                                  )
                                              }
                                          >
                                              Confirm Booking
                                          </Dropdown.Item>
                                      )}

                                      {canAssignBoth && (
                                          <Dropdown.Item
                                              className="text-warning"
                                              onClick={() =>
                                                  setAssignTarget({
                                                      id: booking.id,
                                                      target: 'driver_and_vehicle',
                                                  })
                                              }
                                          >
                                              Assign Driver & Vehicle
                                          </Dropdown.Item>
                                      )}

                                      {!canAssignBoth && canAssignDriver && (
                                          <Dropdown.Item
                                              className="text-warning"
                                              onClick={() =>
                                                  setAssignTarget({
                                                      id: booking.id,
                                                      target: 'driver_only',
                                                  })
                                              }
                                          >
                                              Assign Driver
                                          </Dropdown.Item>
                                      )}

                                      {!canAssignBoth && canAssignVehicle && (
                                          <Dropdown.Item
                                              className="text-warning"
                                              onClick={() =>
                                                  setAssignTarget({
                                                      id: booking.id,
                                                      target: 'vehicle_only',
                                                  })
                                              }
                                          >
                                              Assign Vehicle
                                          </Dropdown.Item>
                                      )}

                                      {canStartTrip && (
                                          <Dropdown.Item
                                              className="text-info"
                                              disabled={
                                                  startTripMutation.isPending
                                              }
                                              onClick={() =>
                                                  startTripMutation.mutate(
                                                      booking.id
                                                  )
                                              }
                                          >
                                              Start Trip
                                          </Dropdown.Item>
                                      )}

                                      {canCancel && (
                                          <>
                                              <Dropdown.Divider />
                                              <Dropdown.Item
                                                  className="text-danger"
                                                  onClick={() =>
                                                      setCancelTarget(booking)
                                                  }
                                              >
                                                  Cancel Booking
                                              </Dropdown.Item>
                                          </>
                                      )}

                                      <Dropdown.Divider />
                                      <Dropdown.Item
                                          className="text-danger"
                                          onClick={() =>
                                              setDeleteTarget(booking)
                                          }
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
        <div className="d-flex gap-2">
            <PermisssionGuard
                permission={PERMISSIONS.AIRPORT_TRANSFER.MANAGE_BOOKINGS}
            >
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                        navigate(
                            ROUTES.DASHBOARD.AIRPORT_TRANSFER.BOOKINGS.CREATE
                        )
                    }
                >
                    + New Booking
                </button>
            </PermisssionGuard>
        </div>
    );

    return (
        <>
            <FilterBox>
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Reference or passenger name..."
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
                                                .value as AirportBookingStatus) ||
                                            undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="payment_received">
                                    Payment Received
                                </option>
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
                                Direction
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters['filter[direction]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[direction]':
                                            (e.target.value as
                                                | 'pickup'
                                                | 'dropoff') || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Directions</option>
                                <option value="pickup">Airport Pickup</option>
                                <option value="dropoff">Airport Dropoff</option>
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
                title="Airport Bookings"
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
                emptyMessage="Create your first airport booking to get started."
            />

            {assignTarget && (
                <AssignModal
                    bookingId={assignTarget.id}
                    target={assignTarget.target}
                    show={!!assignTarget}
                    onHide={() => setAssignTarget(null)}
                />
            )}

            {cancelTarget && (
                <CancelModal
                    bookingId={cancelTarget.id}
                    show={!!cancelTarget}
                    onHide={() => setCancelTarget(null)}
                />
            )}
        </>
    );
}
