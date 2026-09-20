import { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import type { QuoteRequest } from '@/shared/types/rental.types';
import { useGenerateQuote } from '@/shared/hooks/queries/useQuotes';
import { useVehicles } from '@/shared/hooks/queries/useVehicles';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { formatWithSymbol } from '@/shared/libs/currency';

interface Props {
    show: boolean;
    quote: QuoteRequest;
    onHide: () => void;
}

interface FormValues {
    vehicle_id: string;
    admin_notes: string;
    price_mode: 'use_vehicle_rate' | 'custom';
    custom_base_price: string;
}

export default function GenerateQuoteModal({ show, quote, onHide }: Props) {
    const generateQuote = useGenerateQuote();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';
    const { data: branchesData } = useActiveBranches();
    const quoteBranch = (branchesData?.data ?? []).find(
        (b: { id: string }) => b.id === quote.branch_id
    );
    const vehicleCurrencySymbol = quoteBranch?.currency_symbol ?? globalSymbol;
    const fmt = (n: number) => formatWithSymbol(n, vehicleCurrencySymbol);

    const { data: vehiclesData, isLoading: vehiclesLoading } = useVehicles({
        per_page: 100,
        status: 'available' as any,
    });

    const vehicles = vehiclesData?.data ?? [];

    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            vehicle_id: quote.vehicle_id ?? '',
            admin_notes: quote.admin_notes ?? '',
            price_mode: 'use_vehicle_rate',
            custom_base_price: '',
        },
    });

    // Track which vehicle is effectively in use
    const [selectedVehicle, setSelectedVehicle] = useState(
        quote.vehicle ?? null
    );

    useEffect(() => {
        if (!show) return;
        reset({
            vehicle_id: quote.vehicle_id ?? '',
            admin_notes: quote.admin_notes ?? '',
            price_mode: 'use_vehicle_rate',
            custom_base_price: '',
        });
        setSelectedVehicle(quote.vehicle ?? null);
    }, [show, quote.id, reset]);

    // Watch fields to compute derived values
    const watchVehicleId = watch('vehicle_id');
    const priceMode = watch('price_mode');

    // When a different vehicle is selected from the dropdown, update selectedVehicle
    useEffect(() => {
        if (quote.vehicle_id) return; // vehicle already assigned - dropdown not shown
        const found = vehicles.find(v => v.id === watchVehicleId) ?? null;
        if (found) {
            setSelectedVehicle({
                id: found.id,
                name: found.name,
                license_plate: found.license_plate,
                daily_rate: found.daily_rate,
                price_visible: found.price_visible ?? true,
                thumbnail: null,
            });
        } else {
            setSelectedVehicle(null);
        }
    }, [watchVehicleId, vehicles, quote.vehicle_id]);

    const rentalDays = quote.rental_days ?? 1;
    const vehicleRate = selectedVehicle?.daily_rate ?? 0;
    const vehicleRateTotal = vehicleRate * rentalDays;
    const showPriceSection =
        selectedVehicle && selectedVehicle.price_visible === false;

    const onSubmit = (values: FormValues) => {
        let adminBasePrice: number | null = null;

        if (showPriceSection) {
            if (values.price_mode === 'use_vehicle_rate') {
                // Store per-day rate; resource multiplies by rental_days
                adminBasePrice = vehicleRate;
            } else {
                const parsed = parseFloat(values.custom_base_price);
                if (!isNaN(parsed) && parsed >= 0) {
                    // Store per-day rate entered by admin
                    adminBasePrice = parsed;
                }
            }
        }

        generateQuote.mutate(
            {
                id: quote.id,
                payload: {
                    vehicle_id: values.vehicle_id || null,
                    admin_notes: values.admin_notes || null,
                    admin_base_price: adminBasePrice,
                },
            },
            { onSuccess: onHide }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Generate Quote - {quote.reference}</Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Row>
                        {/* Vehicle selector */}
                        {!quote.vehicle_id && (
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Assign Vehicle</Form.Label>
                                    {vehiclesLoading ? (
                                        <div className="d-flex align-items-center gap-2 text-muted">
                                            <Spinner size="sm" /> Loading
                                            vehicles…
                                        </div>
                                    ) : (
                                        <>
                                            <Controller
                                                name="vehicle_id"
                                                control={control}
                                                rules={{
                                                    required:
                                                        'Please select a vehicle to generate the quote.',
                                                }}
                                                render={({ field }) => (
                                                    <Form.Select
                                                        {...field}
                                                        isInvalid={
                                                            !!errors.vehicle_id
                                                        }
                                                    >
                                                        <option value="">
                                                            - Select a vehicle -
                                                        </option>
                                                        {vehicles.map(v => (
                                                            <option
                                                                key={v.id}
                                                                value={v.id}
                                                            >
                                                                {v.name} (
                                                                {
                                                                    v.license_plate
                                                                }
                                                                )
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                )}
                                            />
                                            {errors.vehicle_id && (
                                                <Form.Control.Feedback
                                                    type="invalid"
                                                    className="d-block"
                                                >
                                                    {errors.vehicle_id.message}
                                                </Form.Control.Feedback>
                                            )}
                                        </>
                                    )}
                                    {quote.vehicle_preference && (
                                        <Form.Text className="text-muted">
                                            Customer preference:{' '}
                                            {quote.vehicle_preference}
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
                        )}

                        {quote.vehicle_id && (
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Vehicle</Form.Label>
                                    <Form.Control
                                        readOnly
                                        value={`${quote.vehicle?.name ?? ''} (${quote.vehicle?.license_plate ?? ''})`}
                                    />
                                    <Form.Text className="text-muted">
                                        Vehicle already assigned. Edit from
                                        quote details to change.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        )}

                        {/* Vehicle Price section - shown when vehicle has hidden pricing */}
                        {showPriceSection && (
                            <Col md={12} className="mb-3">
                                <div
                                    className="p-3 rounded border"
                                    style={{
                                        background: '#fffbf0',
                                        borderColor: '#f0b429 !important',
                                    }}
                                >
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <i className="feather feather-tag text-warning" />
                                        <span
                                            className="fw-semibold"
                                            style={{ fontSize: 13 }}
                                        >
                                            Vehicle Price
                                        </span>
                                        <span
                                            className="badge bg-warning text-dark ms-1"
                                            style={{ fontSize: 11 }}
                                        >
                                            Price not listed publicly
                                        </span>
                                    </div>
                                    <p
                                        className="text-muted mb-3"
                                        style={{ fontSize: 12 }}
                                    >
                                        Set the base price for this quote. All
                                        charges and taxes will be calculated on
                                        top.
                                    </p>

                                    <div className="d-flex flex-column gap-2">
                                        <Form.Check
                                            type="radio"
                                            id="price-mode-vehicle"
                                            label={
                                                <span>
                                                    Use vehicle rate&nbsp;
                                                    <span
                                                        className="text-muted"
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        ({fmt(vehicleRate)}/day
                                                        × {rentalDays}{' '}
                                                        {rentalDays === 1
                                                            ? 'day'
                                                            : 'days'}{' '}
                                                        ={' '}
                                                        <strong>
                                                            {fmt(
                                                                vehicleRateTotal
                                                            )}
                                                        </strong>
                                                        )
                                                    </span>
                                                </span>
                                            }
                                            value="use_vehicle_rate"
                                            {...register('price_mode')}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="price-mode-custom"
                                            label="Enter custom base price"
                                            value="custom"
                                            {...register('price_mode')}
                                        />
                                    </div>

                                    {priceMode === 'custom' && (
                                        <div className="mt-2">
                                            <Form.Group>
                                                <Form.Label
                                                    style={{ fontSize: 12 }}
                                                >
                                                    Custom daily rate (per day)
                                                </Form.Label>
                                                <Controller
                                                    name="custom_base_price"
                                                    control={control}
                                                    rules={{
                                                        required:
                                                            priceMode ===
                                                            'custom'
                                                                ? 'Enter a daily rate.'
                                                                : false,
                                                        min: {
                                                            value: 0,
                                                            message:
                                                                'Must be 0 or more.',
                                                        },
                                                    }}
                                                    render={({ field }) => (
                                                        <>
                                                            <Form.Control
                                                                type="number"
                                                                min={0}
                                                                step="0.01"
                                                                placeholder="e.g. 200.00"
                                                                isInvalid={
                                                                    !!errors.custom_base_price
                                                                }
                                                                {...field}
                                                            />
                                                            {(() => {
                                                                const customVal =
                                                                    parseFloat(
                                                                        field.value
                                                                    );
                                                                return !isNaN(
                                                                    customVal
                                                                ) &&
                                                                    customVal >
                                                                        0 ? (
                                                                    <Form.Text className="text-muted">
                                                                        {fmt(
                                                                            customVal
                                                                        )}
                                                                        /day ×{' '}
                                                                        {
                                                                            rentalDays
                                                                        }{' '}
                                                                        {rentalDays ===
                                                                        1
                                                                            ? 'day'
                                                                            : 'days'}{' '}
                                                                        ={' '}
                                                                        <strong>
                                                                            {fmt(
                                                                                customVal *
                                                                                    rentalDays
                                                                            )}
                                                                        </strong>
                                                                    </Form.Text>
                                                                ) : null;
                                                            })()}
                                                        </>
                                                    )}
                                                />
                                                {errors.custom_base_price && (
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {
                                                            errors
                                                                .custom_base_price
                                                                .message
                                                        }
                                                    </Form.Control.Feedback>
                                                )}
                                            </Form.Group>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        )}

                        {/* Admin notes */}
                        <Col md={12} className="mb-3">
                            <Form.Group>
                                <Form.Label>Admin Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Internal notes or quote remarks…"
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
                        disabled={generateQuote.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={generateQuote.isPending}
                    >
                        {generateQuote.isPending ? (
                            <>
                                <Spinner size="sm" className="me-1" />
                                Generating…
                            </>
                        ) : (
                            'Generate Quote'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
