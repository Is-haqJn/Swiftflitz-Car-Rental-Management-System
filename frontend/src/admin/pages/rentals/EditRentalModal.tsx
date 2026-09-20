import { useEffect } from 'react';
import {
    Alert,
    Button,
    Col,
    Form,
    Modal,
    Row,
    Spinner,
} from 'react-bootstrap';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { parse, startOfDay } from 'date-fns';
import DatePickerField from '@adminComponents/DatePickerField';
import TimePickerField from '@adminComponents/TimePickerField';
import { useRentalLocations } from '@/shared/hooks/queries/useRentalLocations';
import { useVehicleBookedDates } from '@/shared/hooks/queries/useVehicles';
import { useUpdateRental } from '@/shared/hooks/queries/useRentals';
import type { Rental, RentalSource, UpdateRentalData } from '@/shared/types/rental.types';

interface EditRentalForm {
    pickup_date: string;
    pickup_time: string;
    return_date: string;
    return_time: string;
    source: RentalSource;
    pickup_location_id: string;
    dropoff_location_id: string;
    customer_notes: string;
    admin_notes: string;
}

interface Props {
    show: boolean;
    onHide: () => void;
    rental: Rental;
}

const LOCKED_STATUSES = ['confirmed', 'active', 'overdue', 'returned', 'completed'];
const PICKUP_LOCATION_LOCKED_STATUSES = ['active', 'overdue', 'returned', 'completed'];

function formatTime12h(time: string | null | undefined): string {
    if (!time) return '-';
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    if (isNaN(h)) return time;
    const period = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${period}`;
}

export default function EditRentalModal({ show, onHide, rental }: Props) {
    const updateMutation = useUpdateRental();
    const datesLocked = LOCKED_STATUSES.includes(rental.status);
    const pickupLocationLocked = PICKUP_LOCATION_LOCKED_STATUSES.includes(rental.status);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EditRentalForm>({
        defaultValues: {
            pickup_date: rental.pickup_date ?? '',
            pickup_time: rental.pickup_time ?? '',
            return_date: rental.return_date ?? '',
            return_time: rental.return_time ?? '',
            source: rental.source ?? 'walk_in',
            pickup_location_id: rental.pickup_location_id ?? '',
            dropoff_location_id: rental.dropoff_location_id ?? '',
            customer_notes: rental.customer_notes ?? '',
            admin_notes: rental.admin_notes ?? '',
        },
    });

    useEffect(() => {
        if (!show) return;
        reset({
            pickup_date: rental.pickup_date ?? '',
            pickup_time: rental.pickup_time ?? '',
            return_date: rental.return_date ?? '',
            return_time: rental.return_time ?? '',
            source: rental.source ?? 'walk_in',
            pickup_location_id: rental.pickup_location_id ?? '',
            dropoff_location_id: rental.dropoff_location_id ?? '',
            customer_notes: rental.customer_notes ?? '',
            admin_notes: rental.admin_notes ?? '',
        });
    }, [show, rental, reset]);

    const { data: locationsRes } = useRentalLocations({
        'filter[is_active]': '1',
        'filter[branch_id]': rental.branch_id ?? undefined,
        per_page: 100,
    });
    const locations = locationsRes?.data ?? [];
    const pickupLocations = locations.filter(l => l.is_pickup);
    const dropoffLocations = locations.filter(l => l.is_dropoff);

    const { data: bookedDatesData } = useVehicleBookedDates(
        !datesLocked ? (rental.vehicle_id ?? null) : null,
        rental.id,
    );
    const excludeIntervals = (bookedDatesData ?? []).map(r => ({
        start: parse(r.from, 'yyyy-MM-dd', new Date()),
        end: parse(r.to, 'yyyy-MM-dd', new Date()),
    }));
    const today = startOfDay(new Date());

    const watchedPickupDate = useWatch({ control, name: 'pickup_date' });
    const returnMinDate = watchedPickupDate
        ? parse(watchedPickupDate, 'yyyy-MM-dd', new Date())
        : today;

    const onSubmit = (data: EditRentalForm) => {
        const payload: UpdateRentalData = {
            ...(datesLocked
                ? {}
                : {
                      pickup_date: data.pickup_date || undefined,
                      pickup_time: data.pickup_time || undefined,
                      return_date: data.return_date || undefined,
                      return_time: data.return_time || undefined,
                  }),
            source: data.source || undefined,
            ...(pickupLocationLocked ? {} : { pickup_location_id: data.pickup_location_id || null }),
            ...(pickupLocationLocked ? {} : { dropoff_location_id: data.dropoff_location_id || null }),
            customer_notes: data.customer_notes || null,
            admin_notes: data.admin_notes || null,
        };

        updateMutation.mutate(
            { id: rental.id, payload },
            {
                onSuccess: () => {
                    onHide();
                },
            }
        );
    };

    const handleClose = () => {
        if (updateMutation.isPending) return;
        reset();
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Edit Rental Details</Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Row>
                        {datesLocked && (
                            <Col xs={12} className="mb-3">
                                <Alert variant="info" className="mb-0 py-2 small">
                                    <strong>Schedule locked.</strong> Dates and times cannot be changed once a rental is confirmed or active.
                                </Alert>
                            </Col>
                        )}

                        {datesLocked ? (
                            <>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Pickup Date</Form.Label>
                                        <Form.Control
                                            plaintext
                                            readOnly
                                            value={rental.pickup_date ?? '-'}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Pickup Time</Form.Label>
                                        <Form.Control
                                            plaintext
                                            readOnly
                                            value={formatTime12h(rental.pickup_time)}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Return Date</Form.Label>
                                        <Form.Control
                                            plaintext
                                            readOnly
                                            value={rental.return_date ?? '-'}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Return Time</Form.Label>
                                        <Form.Control
                                            plaintext
                                            readOnly
                                            value={formatTime12h(rental.return_time)}
                                        />
                                    </Form.Group>
                                </Col>
                            </>
                        ) : (
                            <>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>
                                            Pickup Date{' '}
                                            <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Controller
                                            name="pickup_date"
                                            control={control}
                                            rules={{ required: 'Pickup date is required' }}
                                            render={({ field }) => (
                                                <DatePickerField
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    isInvalid={!!errors.pickup_date}
                                                    placeholder="Select pickup date"
                                                    minDate={today}
                                                    excludeDateIntervals={excludeIntervals}
                                                />
                                            )}
                                        />
                                        {errors.pickup_date && (
                                            <Form.Text className="text-danger">
                                                {errors.pickup_date.message}
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>

                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>
                                            Pickup Time{' '}
                                            <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Controller
                                            name="pickup_time"
                                            control={control}
                                            rules={{ required: 'Pickup time is required' }}
                                            render={({ field }) => (
                                                <TimePickerField
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    isInvalid={!!errors.pickup_time}
                                                    placeholder="Select pickup time"
                                                />
                                            )}
                                        />
                                        {errors.pickup_time && (
                                            <Form.Text className="text-danger">
                                                {errors.pickup_time.message}
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>

                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>
                                            Return Date{' '}
                                            <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Controller
                                            name="return_date"
                                            control={control}
                                            rules={{ required: 'Return date is required' }}
                                            render={({ field }) => (
                                                <DatePickerField
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    isInvalid={!!errors.return_date}
                                                    placeholder="Select return date"
                                                    minDate={returnMinDate}
                                                    excludeDateIntervals={excludeIntervals}
                                                />
                                            )}
                                        />
                                        {errors.return_date && (
                                            <Form.Text className="text-danger">
                                                {errors.return_date.message}
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>

                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>
                                            Return Time{' '}
                                            <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Controller
                                            name="return_time"
                                            control={control}
                                            rules={{ required: 'Return time is required' }}
                                            render={({ field }) => (
                                                <TimePickerField
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    isInvalid={!!errors.return_time}
                                                    placeholder="Select return time"
                                                />
                                            )}
                                        />
                                        {errors.return_time && (
                                            <Form.Text className="text-danger">
                                                {errors.return_time.message}
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>
                            </>
                        )}

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Source</Form.Label>
                                <Form.Select {...register('source')}>
                                    <option value="website">Website</option>
                                    <option value="phone">Phone</option>
                                    <option value="walk_in">Walk-in</option>
                                    <option value="referral">Referral</option>
                                    <option value="quote_request">
                                        Quote Request
                                    </option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Pickup Location</Form.Label>
                                <Form.Select
                                    {...register('pickup_location_id')}
                                    disabled={pickupLocationLocked}
                                >
                                    <option value="">- None -</option>
                                    {pickupLocations.map(loc => {
                                        const sym = loc.branch?.currency_symbol ?? rental.currency_symbol ?? '';
                                        const charge = loc.pickup_charge ?? 0;
                                        const label = charge > 0
                                            ? `${loc.name} (+${sym}${charge.toFixed(2)})`
                                            : loc.name;
                                        return (
                                            <option key={loc.id} value={loc.id}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Drop-off Location</Form.Label>
                                <Form.Select
                                    {...register('dropoff_location_id')}
                                    disabled={pickupLocationLocked}
                                >
                                    <option value="">- None -</option>
                                    {dropoffLocations.map(loc => {
                                        const sym = loc.branch?.currency_symbol ?? rental.currency_symbol ?? '';
                                        const charge = loc.dropoff_charge ?? 0;
                                        const label = charge > 0
                                            ? `${loc.name} (+${sym}${charge.toFixed(2)})`
                                            : loc.name;
                                        return (
                                            <option key={loc.id} value={loc.id}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Customer Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Notes visible to the customer..."
                                    {...register('customer_notes')}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Admin Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Internal notes (not visible to customer)..."
                                    {...register('admin_notes')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer>
                    <div className="d-flex justify-content-end gap-2">
                        <Button
                            variant="light"
                            type="button"
                            onClick={handleClose}
                            disabled={updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Spinner size="sm" className="me-1" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
