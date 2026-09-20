import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import TimePickerField from '@adminComponents/TimePickerField';
import type { QuoteRequest } from '@/shared/types/rental.types';
import type { Customer } from '@/shared/types/customer.types';
import { useConvertQuote } from '@/shared/hooks/queries/useQuotes';
import { useCustomers } from '@/shared/hooks/queries/useCustomers';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import { ROUTES } from '@/shared/routes';

interface Props {
    show: boolean;
    quote: QuoteRequest;
    onHide: () => void;
}

interface FormValues {
    customer_id: string;
    pickup_time: string;
    return_time: string;
    dropoff_location_id: string;
    amount_paid: string;
    admin_notes: string;
}

export default function ConvertQuoteModal({ show, quote, onHide }: Props) {
    const navigate = useNavigate();
    const convertQuote = useConvertQuote();
    const fmt = useFormatCurrency();
    const [customerSearch, setCustomerSearch] = useState('');

    const { data: customersData, isLoading: customersLoading } = useCustomers({
        'filter[search]': customerSearch || undefined,
        per_page: 50,
    } as any);

    const customers = customersData?.data ?? [];

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            customer_id: quote.customer_id ?? '',
            pickup_time: '09:00',
            return_time: '09:00',
            dropoff_location_id: '',
            amount_paid: '',
            admin_notes: quote.admin_notes ?? '',
        },
    });

    useEffect(() => {
        if (!show) return;
        reset({
            customer_id: quote.customer_id ?? '',
            pickup_time: '09:00',
            return_time: '09:00',
            dropoff_location_id: '',
            amount_paid: '',
            admin_notes: quote.admin_notes ?? '',
        });
        setCustomerSearch('');
    }, [show, quote.id, reset]);

    const onSubmit = (values: FormValues) => {
        convertQuote.mutate(
            {
                id: quote.id,
                payload: {
                    customer_id: values.customer_id,
                    pickup_time: values.pickup_time || undefined,
                    return_time: values.return_time || undefined,
                    dropoff_location_id: values.dropoff_location_id || null,
                    amount_paid: values.amount_paid
                        ? parseFloat(values.amount_paid)
                        : null,
                    admin_notes: values.admin_notes || null,
                },
            },
            {
                onSuccess: res => {
                    onHide();
                    navigate(ROUTES.DASHBOARD.RENTALS.VIEW(res.data.id));
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Convert to Rental - {quote.reference}</Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Row>
                        {/* Quote summary */}
                        {quote.pricing && (
                            <Col md={12} className="mb-3">
                                <div className="p-3 bg-light rounded small">
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">
                                            Vehicle
                                        </span>
                                        <span className="fw-semibold">
                                            {quote.vehicle?.name ?? '-'}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between mt-1">
                                        <span className="text-muted">
                                            Duration
                                        </span>
                                        <span>
                                            {quote.pricing.rental_days} day
                                            {quote.pricing.rental_days !== 1
                                                ? 's'
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between mt-1 fw-bold">
                                        <span>Total cost</span>
                                        <span>
                                            {fmt(quote.pricing.total_cost)}
                                        </span>
                                    </div>
                                    {quote.pricing.security_deposit_amount >
                                        0 && (
                                        <div className="d-flex justify-content-between mt-1 text-muted">
                                            <span>Security deposit</span>
                                            <span>
                                                {fmt(
                                                    quote.pricing
                                                        .security_deposit_amount
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        )}

                        {/* Customer selector */}
                        <Col md={12} className="mb-3">
                            <Form.Group>
                                <Form.Label>
                                    Customer{' '}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Search customer…"
                                    value={customerSearch}
                                    onChange={e =>
                                        setCustomerSearch(e.target.value)
                                    }
                                    className="mb-1"
                                    size="sm"
                                />
                                <Controller
                                    name="customer_id"
                                    control={control}
                                    rules={{ required: 'Customer is required' }}
                                    render={({ field }) => (
                                        <Form.Select
                                            {...field}
                                            isInvalid={!!errors.customer_id}
                                            disabled={customersLoading}
                                        >
                                            <option value="">
                                                {customersLoading
                                                    ? 'Loading…'
                                                    : '- Select customer -'}
                                            </option>
                                            {customers.map((c: Customer) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} - {c.email}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    )}
                                />
                                {errors.customer_id && (
                                    <Form.Control.Feedback type="invalid">
                                        {errors.customer_id.message}
                                    </Form.Control.Feedback>
                                )}
                                {quote.customer && (
                                    <Form.Text className="text-muted">
                                        Quote submitted by: {quote.name} (
                                        {quote.email})
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </Col>

                        {/* Times */}
                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Pickup Time</Form.Label>
                                <Controller
                                    name="pickup_time"
                                    control={control}
                                    render={({ field }) => (
                                        <TimePickerField
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                            placeholder="Select pickup time"
                                        />
                                    )}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Return Time</Form.Label>
                                <Controller
                                    name="return_time"
                                    control={control}
                                    render={({ field }) => (
                                        <TimePickerField
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                            placeholder="Select return time"
                                        />
                                    )}
                                />
                            </Form.Group>
                        </Col>

                        {/* Initial payment */}
                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Initial Payment</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    placeholder="0.00"
                                    {...register('amount_paid')}
                                />
                            </Form.Group>
                        </Col>

                        {/* Admin notes */}
                        <Col md={12} className="mb-3">
                            <Form.Group>
                                <Form.Label>Admin Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    {...register('admin_notes')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer className="d-flex justify-content-end gap-2">
                    <Button
                        variant="light"
                        onClick={onHide}
                        disabled={convertQuote.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={convertQuote.isPending}
                    >
                        {convertQuote.isPending ? (
                            <>
                                <Spinner size="sm" className="me-1" />
                                Converting…
                            </>
                        ) : (
                            'Convert to Rental'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
