import { Fragment, useMemo } from 'react';
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
import { useForm } from 'react-hook-form';
import { useSwitchVehicle } from '@/shared/hooks/queries/useRentals';
import { usePricingSettings } from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';
import { useVehicles } from '@/shared/hooks/queries/useVehicles';
import type { Rental } from '@/shared/types/rental.types';

interface SwitchVehicleForm {
    vehicle_id: string;
    reason: string;
}

interface Props {
    show: boolean;
    onClose: () => void;
    rental: Rental;
}

export default function SwitchVehicleModal({ show, onClose, rental }: Props) {
    const { data: pricingData } = usePricingSettings();
    const { data: vehiclesData, isLoading: vehiclesLoading } = useVehicles({
        status: 'available',
        per_page: 100,
    });
    const switchMutation = useSwitchVehicle();

    const { register, handleSubmit, watch, reset } = useForm<SwitchVehicleForm>(
        {
            defaultValues: { vehicle_id: '', reason: '' },
        }
    );

    const selectedVehicleId = watch('vehicle_id');

    const availableVehicles = useMemo(() => {
        const list = vehiclesData?.data ?? [];
        return list.filter(v => v.id !== rental.vehicle_id);
    }, [vehiclesData, rental.vehicle_id]);

    const selectedVehicle = useMemo(
        () => availableVehicles.find(v => v.id === selectedVehicleId) ?? null,
        [availableVehicles, selectedVehicleId]
    );

    const rentalSymbol = rental.currency_symbol ?? '₵';
    const fmt = (val: number) => formatWithSymbol(val, rentalSymbol);
    const fmtVehicle = (val: number) => {
        const symbol = selectedVehicle?.branch?.currency_symbol ?? rentalSymbol;
        return formatWithSymbol(val, symbol);
    };

    const switchFee = pricingData?.data?.vehicle_switch_fee ?? 0;
    const estimatedBase = selectedVehicle
        ? selectedVehicle.daily_rate * rental.rental_days
        : null;
    const estimatedTotal =
        estimatedBase !== null
            ? estimatedBase + rental.extras_cost + switchFee
            : null;
    const diff =
        estimatedTotal !== null ? estimatedTotal - rental.total_cost : null;

    const newDeposit: number | null = selectedVehicle
        ? (selectedVehicle.security_deposit ??
          selectedVehicle.category?.security_deposit ??
          pricingData?.data?.global_security_deposit ??
          null)
        : null;

    const onSubmit = (data: SwitchVehicleForm) => {
        if (!data.vehicle_id) return;
        switchMutation.mutate(
            {
                id: rental.id,
                data: {
                    vehicle_id: data.vehicle_id,
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

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Switch Vehicle</Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Fragment>
                        {/* Current vehicle summary */}
                        <div className="mb-3 p-3 bg-light rounded">
                            <small className="text-muted d-block mb-1">
                                Current Vehicle
                            </small>
                            <strong>{rental.vehicle?.name ?? '-'}</strong>
                            <span className="text-muted ms-2">
                                {fmt(rental.daily_rate)}/day &middot;{' '}
                                {rental.rental_days} day
                                {rental.rental_days !== 1 ? 's' : ''} &middot;
                                Total {fmt(rental.total_cost)}
                            </span>
                        </div>

                        <Row>
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        New Vehicle{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    {vehiclesLoading ? (
                                        <div className="d-flex align-items-center gap-2 text-muted">
                                            <Spinner size="sm" />
                                            Loading vehicles…
                                        </div>
                                    ) : (
                                        <Form.Select
                                            {...register('vehicle_id', {
                                                required: true,
                                            })}
                                        >
                                            <option value="">
                                                Select a vehicle
                                            </option>
                                            {availableVehicles.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name} ({v.license_plate})
                                                    -{' '}
                                                    {formatWithSymbol(
                                                        v.daily_rate,
                                                        v.branch
                                                            ?.currency_symbol ??
                                                            rentalSymbol
                                                    )}
                                                    /day
                                                </option>
                                            ))}
                                        </Form.Select>
                                    )}
                                    {availableVehicles.length === 0 &&
                                        !vehiclesLoading && (
                                            <Form.Text className="text-muted">
                                                No available vehicles found.
                                            </Form.Text>
                                        )}
                                </Form.Group>
                            </Col>

                            <Col md={12} className="mb-3">
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
                                        placeholder="Reason for switching vehicle…"
                                        {...register('reason')}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Estimated price preview */}
                        {selectedVehicle && estimatedTotal !== null && (
                            <Fragment>
                                <hr />
                                <p className="text-muted small mb-2 fw-semibold">
                                    Estimated Preview
                                </p>
                                <Table size="sm" bordered className="mb-3">
                                    <tbody>
                                        <tr>
                                            <td>
                                                New daily rate ×{' '}
                                                {rental.rental_days} day
                                                {rental.rental_days !== 1
                                                    ? 's'
                                                    : ''}
                                            </td>
                                            <td className="text-end">
                                                {fmtVehicle(estimatedBase!)}
                                            </td>
                                        </tr>
                                        {rental.extras_cost > 0 && (
                                            <tr>
                                                <td>Add-ons (preserved)</td>
                                                <td className="text-end">
                                                    {fmt(rental.extras_cost)}
                                                </td>
                                            </tr>
                                        )}
                                        {switchFee > 0 && (
                                            <tr>
                                                <td>Vehicle switch fee</td>
                                                <td className="text-end">
                                                    {fmt(switchFee)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr className="fw-semibold">
                                            <td>Estimated new total</td>
                                            <td className="text-end">
                                                {fmtVehicle(estimatedTotal)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Current total</td>
                                            <td className="text-end">
                                                {fmt(rental.total_cost)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Difference</td>
                                            <td
                                                className={`text-end fw-semibold ${diff! > 0 ? 'text-danger' : diff! < 0 ? 'text-success' : ''}`}
                                            >
                                                {diff! > 0 ? '+' : ''}
                                                {fmtVehicle(diff!)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>

                                <p className="text-muted small mb-2">
                                    * Estimated preview uses daily rate × days
                                    only. Actual repricing (VAT, discounts,
                                    locations) is computed on confirmation.
                                </p>

                                {/* Refund alert */}
                                {rental.amount_paid > 0 &&
                                    estimatedTotal < rental.amount_paid && (
                                        <Alert
                                            variant="warning"
                                            className="small mb-2"
                                        >
                                            The new total is less than the
                                            amount already paid. A refund of
                                            approximately{' '}
                                            <strong>
                                                {fmt(
                                                    rental.amount_paid -
                                                        estimatedTotal
                                                )}
                                            </strong>{' '}
                                            will be prepared and will need to be
                                            settled.
                                        </Alert>
                                    )}

                                {/* Deposit alerts */}
                                {newDeposit !== null &&
                                    rental.deposit_paid > 0 &&
                                    newDeposit > rental.deposit_paid && (
                                        <Alert
                                            variant="info"
                                            className="small mb-2"
                                        >
                                            The new vehicle requires a higher
                                            security deposit (
                                            {fmtVehicle(newDeposit)}
                                            ). The current collected deposit (
                                            {fmt(rental.deposit_paid)}) will be
                                            treated as a partial deposit -
                                            collect the difference separately.
                                        </Alert>
                                    )}
                                {newDeposit !== null &&
                                    rental.deposit_paid > 0 &&
                                    newDeposit < rental.deposit_paid && (
                                        <Alert
                                            variant="info"
                                            className="small mb-0"
                                        >
                                            The new vehicle requires a lower
                                            deposit ({fmtVehicle(newDeposit)}).
                                            The full collected deposit (
                                            {fmt(rental.deposit_paid)}) will be
                                            refunded on rental completion.
                                        </Alert>
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
                                !selectedVehicleId || switchMutation.isPending
                            }
                        >
                            {switchMutation.isPending ? (
                                <Fragment>
                                    <Spinner size="sm" className="me-1" />
                                    Switching…
                                </Fragment>
                            ) : (
                                'Confirm Switch'
                            )}
                        </Button>
                    </div>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
