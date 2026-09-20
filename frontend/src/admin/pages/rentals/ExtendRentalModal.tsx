import { Fragment, useEffect } from 'react';
import {
    Alert,
    Button,
    Col,
    Form,
    Modal,
    Row,
    Spinner,
    Table,
} from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import DatePickerField from '@adminComponents/DatePickerField';
import { useQuery } from '@tanstack/react-query';
import { useExtendRental } from '@/shared/hooks/queries/useRentals';
import { formatWithSymbol } from '@/shared/libs/currency';
import { rentalService } from '@/services/rentalService';
import type { Rental } from '@/shared/types/rental.types';

interface ExtendForm {
    new_return_date: string;
    reason: string;
}

interface Props {
    show: boolean;
    onClose: () => void;
    rental: Rental;
}

export default function ExtendRentalModal({ show, onClose, rental }: Props) {
    const extendMutation = useExtendRental();

    const {
        register,
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<ExtendForm>({
        defaultValues: { new_return_date: '', reason: '' },
    });

    useEffect(() => {
        if (!show) return;
        reset({ new_return_date: '', reason: '' });
    }, [show, reset]);

    const newReturnDate = watch('new_return_date');

    const isDateValid =
        !!newReturnDate &&
        newReturnDate > rental.return_date &&
        (!rental.max_extend_date || newReturnDate <= rental.max_extend_date);

    const {
        data: previewData,
        isFetching: previewLoading,
        isError: previewError,
    } = useQuery({
        queryKey: ['rentals', rental.id, 'extend-preview', newReturnDate],
        queryFn: async () => {
            const res = await rentalService.getExtendPreview(
                rental.id,
                newReturnDate
            );
            return res.data;
        },
        enabled: isDateValid,
    });

    const preview = previewData ?? null;

    const rentalSymbol = rental.currency_symbol ?? '₵';
    const fmt = (val: number) => formatWithSymbol(val, rentalSymbol);

    const fmtDate = (val: string) => {
        const d = new Date(val + 'T00:00:00');
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const onSubmit = (data: ExtendForm) => {
        if (!isDateValid) return;
        extendMutation.mutate(
            {
                id: rental.id,
                data: {
                    new_return_date: data.new_return_date,
                    reason: data.reason || undefined,
                },
            },
            {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            }
        );
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Min date = day after current return date
    const minDate = (() => {
        const d = new Date(rental.return_date + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    })();

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Extend Rental</Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Fragment>
                        {/* Current schedule summary */}
                        <div className="mb-3 p-3 bg-light rounded">
                            <small className="text-muted d-block mb-1">
                                Current Schedule
                            </small>
                            <div className="d-flex gap-3 flex-wrap">
                                <span>
                                    <span className="text-muted">Pickup:</span>{' '}
                                    <strong>
                                        {fmtDate(rental.pickup_date)}
                                    </strong>
                                </span>
                                <span>
                                    <span className="text-muted">Return:</span>{' '}
                                    <strong>
                                        {fmtDate(rental.return_date)}
                                    </strong>
                                </span>
                                <span>
                                    <span className="text-muted">
                                        Duration:
                                    </span>{' '}
                                    <strong>
                                        {rental.rental_days} day
                                        {rental.rental_days !== 1 ? 's' : ''}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        New Return Date{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Controller
                                        name="new_return_date"
                                        control={control}
                                        rules={{
                                            required:
                                                'New return date is required',
                                        }}
                                        render={({ field }) => (
                                            <DatePickerField
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                isInvalid={
                                                    !!errors.new_return_date
                                                }
                                                minDate={
                                                    minDate
                                                        ? new Date(
                                                              minDate +
                                                                  'T00:00:00'
                                                          )
                                                        : undefined
                                                }
                                                maxDate={
                                                    rental.max_extend_date
                                                        ? new Date(
                                                              rental.max_extend_date +
                                                                  'T00:00:00'
                                                          )
                                                        : undefined
                                                }
                                                placeholder="Select new return date"
                                            />
                                        )}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.new_return_date?.message}
                                    </Form.Control.Feedback>
                                    {newReturnDate &&
                                        newReturnDate <= rental.return_date && (
                                            <Form.Text className="text-danger">
                                                Must be after the current return
                                                date (
                                                {fmtDate(rental.return_date)}).
                                            </Form.Text>
                                        )}
                                    {rental.max_extend_date && (
                                        <Form.Text className="text-warning d-block mt-1">
                                            Another booking for this vehicle
                                            starts after{' '}
                                            {fmtDate(rental.max_extend_date)}.
                                            You can only extend until{' '}
                                            {fmtDate(rental.max_extend_date)}.
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Reason{' '}
                                        <span className="text-muted fw-normal">
                                            (optional)
                                        </span>
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        maxLength={500}
                                        placeholder="Reason for extension…"
                                        {...register('reason')}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Preview */}
                        {isDateValid && (
                            <Fragment>
                                <hr />
                                {previewLoading && (
                                    <div className="d-flex align-items-center gap-2 text-muted small mb-3">
                                        <Spinner size="sm" />
                                        Calculating extension cost…
                                    </div>
                                )}

                                {previewError && (
                                    <Alert
                                        variant="danger"
                                        className="small mb-3"
                                    >
                                        Could not calculate extension cost.
                                        Please check the selected date.
                                    </Alert>
                                )}

                                {preview && !previewLoading && (
                                    <Fragment>
                                        <p className="text-muted small mb-2 fw-semibold">
                                            Extension Summary
                                        </p>

                                        {/* Date summary */}
                                        <div className="mb-3 p-3 border rounded small">
                                            <div className="d-flex flex-column gap-1">
                                                <div>
                                                    <span
                                                        className="text-muted"
                                                        style={{
                                                            width: 140,
                                                            display:
                                                                'inline-block',
                                                        }}
                                                    >
                                                        Scheduled Pickup:
                                                    </span>
                                                    <strong>
                                                        {fmtDate(
                                                            rental.pickup_date
                                                        )}
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span
                                                        className="text-muted"
                                                        style={{
                                                            width: 140,
                                                            display:
                                                                'inline-block',
                                                        }}
                                                    >
                                                        Originally Due:
                                                    </span>
                                                    <strong>
                                                        {fmtDate(
                                                            preview.original_return_date
                                                        )}
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span
                                                        className="text-muted"
                                                        style={{
                                                            width: 140,
                                                            display:
                                                                'inline-block',
                                                        }}
                                                    >
                                                        Extended To:
                                                    </span>
                                                    <strong className="text-primary">
                                                        {fmtDate(
                                                            preview.new_return_date
                                                        )}
                                                    </strong>
                                                    <span className="ms-2 badge bg-primary bg-opacity-10 text-primary">
                                                        +
                                                        {preview.extension_days}{' '}
                                                        day
                                                        {preview.extension_days !==
                                                        1
                                                            ? 's'
                                                            : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {preview.live_overdue_waived > 0 && (
                                            <Alert
                                                variant="info"
                                                className="small mb-3"
                                            >
                                                This rental is currently
                                                overdue. Extending will clear
                                                the outstanding overdue charge
                                                of{' '}
                                                <strong>
                                                    {fmt(
                                                        preview.live_overdue_waived
                                                    )}
                                                </strong>
                                                .
                                            </Alert>
                                        )}

                                        {/* Pricing breakdown */}
                                        <Table
                                            size="sm"
                                            bordered
                                            className="mb-3"
                                        >
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        Extension (
                                                        {preview.extension_days}{' '}
                                                        day
                                                        {preview.extension_days !==
                                                        1
                                                            ? 's'
                                                            : ''}{' '}
                                                        ×{' '}
                                                        {fmt(
                                                            preview.extension_days >
                                                                0
                                                                ? preview.extension_base_cost /
                                                                      preview.extension_days
                                                                : rental.daily_rate
                                                        )}
                                                        /day)
                                                    </td>
                                                    <td className="text-end">
                                                        {fmt(
                                                            preview.extension_base_cost
                                                        )}
                                                    </td>
                                                </tr>
                                                {preview.extension_extras_cost >
                                                    0 && (
                                                    <tr>
                                                        <td>
                                                            Add-ons (per-day,
                                                            extended)
                                                        </td>
                                                        <td className="text-end">
                                                            {fmt(
                                                                preview.extension_extras_cost
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                                {preview.extension_vat > 0 && (
                                                    <tr>
                                                        <td>
                                                            VAT on extension
                                                        </td>
                                                        <td className="text-end">
                                                            {fmt(
                                                                preview.extension_vat
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className="fw-semibold table-light">
                                                    <td>Extension total</td>
                                                    <td className="text-end">
                                                        {fmt(
                                                            preview.extension_total
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Previous total cost</td>
                                                    <td className="text-end">
                                                        {fmt(
                                                            preview.old_total_cost
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr className="fw-semibold">
                                                    <td>New total cost</td>
                                                    <td className="text-end">
                                                        {fmt(
                                                            preview.new_total_cost
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Amount paid</td>
                                                    <td className="text-end">
                                                        {fmt(
                                                            preview.amount_paid
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr
                                                    className={
                                                        preview.new_amount_due >
                                                        0
                                                            ? 'text-danger fw-semibold'
                                                            : 'text-success fw-semibold'
                                                    }
                                                >
                                                    <td>New amount due</td>
                                                    <td className="text-end">
                                                        {fmt(
                                                            preview.new_amount_due
                                                        )}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>

                                        {preview.new_amount_due > 0 &&
                                            preview.amount_paid >=
                                                preview.old_total_cost && (
                                                <Alert
                                                    variant="warning"
                                                    className="small mb-2"
                                                >
                                                    The customer has already
                                                    paid in full. The extension
                                                    creates a new outstanding
                                                    balance of{' '}
                                                    <strong>
                                                        {fmt(
                                                            preview.new_amount_due
                                                        )}
                                                    </strong>
                                                    . An updated invoice will
                                                    reflect this.
                                                </Alert>
                                            )}

                                        {preview.new_amount_due === 0 && (
                                            <Alert
                                                variant="success"
                                                className="small mb-2"
                                            >
                                                No additional payment required -
                                                the current balance covers the
                                                extension.
                                            </Alert>
                                        )}
                                    </Fragment>
                                )}
                            </Fragment>
                        )}
                    </Fragment>
                </Modal.Body>

                <Modal.Footer>
                    <div className="d-flex justify-content-end gap-2">
                        <Button
                            variant="light"
                            type="button"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={
                                !isDateValid ||
                                !preview ||
                                previewLoading ||
                                extendMutation.isPending
                            }
                        >
                            {extendMutation.isPending ? (
                                <Fragment>
                                    <Spinner size="sm" className="me-1" />
                                    Extending…
                                </Fragment>
                            ) : (
                                'Confirm Extension'
                            )}
                        </Button>
                    </div>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
