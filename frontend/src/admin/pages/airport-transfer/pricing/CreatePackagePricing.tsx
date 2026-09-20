import { Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateAirportPackageAssignment } from '@/shared/hooks/queries/useAirportPackageAssignments';
import { useActiveAirports } from '@/shared/hooks/queries/useAirports';
import { useAirportPackages } from '@/shared/hooks/queries/useAirportPackages';
import { ROUTES } from '@/shared/routes';
import { applyServerErrors } from '@/shared/libs/utils';
import { useTitle } from '@/shared/hooks';

/* Schema */
const pricingSchema = z.object({
    package_id: z.string().min(1, 'Package is required'),
    airport_id: z.string().min(1, 'Airport is required'),
    base_price: z.number().positive('Price must be greater than 0'),
    is_active: z.boolean(),
});

type PricingFormData = z.infer<typeof pricingSchema>;

/* Component */
export default function CreatePackagePricing() {
    const title = useTitle('Add Package Pricing');
    const navigate = useNavigate();

    const createMutation = useCreateAirportPackageAssignment();

    const { data: airportsRes } = useActiveAirports();
    const { data: packagesRes } = useAirportPackages({ per_page: 100 });
    const airports = airportsRes?.data ?? [];
    const packages = packagesRes?.data ?? [];

    const {
        register,
        handleSubmit,
        control,
        setError,
        formState: { errors },
    } = useForm<PricingFormData>({
        resolver: zodResolver(pricingSchema),
        defaultValues: { is_active: true },
    });

    const onSubmit = (data: PricingFormData) => {
        createMutation.mutate(data, {
            onSuccess: () =>
                navigate(
                    ROUTES.DASHBOARD.AIRPORT_TRANSFER.PACKAGE_PRICING.ROOT
                ),
            onError: error => applyServerErrors(error, setError),
        });
    };

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Add Package Pricing</h4>
                <p className="text-muted mb-0">
                    Assign a package to an airport and set the base price.
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {createMutation.isError && (
                    <Alert variant="danger" className="mb-3">
                        Failed to save pricing. Please check your inputs and try
                        again.
                    </Alert>
                )}

                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Pricing Details</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Package{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Controller
                                        name="package_id"
                                        control={control}
                                        render={({ field }) => (
                                            <Form.Select
                                                className="tw:h-[2.9rem]"
                                                value={field.value ?? ''}
                                                onChange={e =>
                                                    field.onChange(
                                                        e.target.value
                                                    )
                                                }
                                                isInvalid={!!errors.package_id}
                                            >
                                                <option value="">
                                                    - Select package -
                                                </option>
                                                {packages.map(pkg => (
                                                    <option
                                                        key={pkg.id}
                                                        value={pkg.id}
                                                    >
                                                        {pkg.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        )}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.package_id?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Airport{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Controller
                                        name="airport_id"
                                        control={control}
                                        render={({ field }) => (
                                            <Form.Select
                                                className="tw:h-[2.9rem]"
                                                value={field.value ?? ''}
                                                onChange={e =>
                                                    field.onChange(
                                                        e.target.value
                                                    )
                                                }
                                                isInvalid={!!errors.airport_id}
                                            >
                                                <option value="">
                                                    - Select airport -
                                                </option>
                                                {airports.map(airport => (
                                                    <option
                                                        key={airport.id}
                                                        value={airport.id}
                                                    >
                                                        {airport.name} (
                                                        {airport.city})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        )}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.airport_id?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        Base Price{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register('base_price', {
                                            valueAsNumber: true,
                                        })}
                                        isInvalid={!!errors.base_price}
                                        placeholder="0.00"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.base_price?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={3} className="d-flex align-items-end pb-1">
                                <Controller
                                    name="is_active"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="switch"
                                            id="is_active"
                                            label="Active"
                                            checked={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() =>
                            navigate(
                                ROUTES.DASHBOARD.AIRPORT_TRANSFER
                                    .PACKAGE_PRICING.ROOT
                            )
                        }
                        disabled={createMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? 'Saving...' : 'Add Pricing'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
