import { useEffect, useState } from 'react';
import { Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
    useBranch,
    useCreateBranch,
    useUpdateBranch,
    useAssignBranchManagers,
} from '@/shared/hooks/queries/useBranches';
import { useUsers } from '@/shared/hooks/queries/useUsers';
import { useActiveAirports } from '@/shared/hooks/queries/useAirports';
import { ROUTES } from '@/shared/routes';
import { applyServerErrors } from '@/shared/libs/utils';
import { ROLES } from '@/shared/config/roles';
import { useTitle } from '@/shared/hooks';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';

/* Schema */
const branchSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z
        .string()
        .max(10, 'Code must be 10 characters or fewer')
        .optional()
        .or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    email: z.string().email('Enter a valid email').optional().or(z.literal('')),
    description: z.string().optional().or(z.literal('')),
    is_active: z.boolean(),
    currency: z.string().max(10).optional().or(z.literal('')),
    currency_symbol: z.string().max(5).optional().or(z.literal('')),
    exchange_rate: z
        .number()
        .positive('Exchange rate must be greater than 0')
        .optional()
        .nullable(),
    show_converted_price: z.boolean().optional(),
    has_airport_service: z.boolean(),
    airport_id: z.string().nullable().optional(),
});

type BranchFormData = z.infer<typeof branchSchema>;

/* Component */
export default function CreateBranch() {
    const title = useTitle('Add Branch');
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const { data: branchRes, isLoading: branchLoading } = useBranch(id ?? '');
    const createMutation = useCreateBranch();
    const updateMutation = useUpdateBranch();
    const assignManagersMutation = useAssignBranchManagers();
    const { data: usersRes } = useUsers({ per_page: 100 });
    const { data: activeAirportsRes } = useActiveAirports();
    const activeAirports = activeAirportsRes?.data ?? [];

    const branch = isEdit ? branchRes?.data : undefined;
    const allManagers = (usersRes?.data ?? []).filter(u =>
        u.roles?.some(r => r.name === ROLES.MANAGER)
    );

    const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);

    useEffect(() => {
        if (branch?.managers) {
            setSelectedManagerIds(branch.managers.map(m => String(m.id)));
        }
    }, [branch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const isPending = createMutation.isPending || updateMutation.isPending;

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        setError,
        formState: { errors },
    } = useForm<BranchFormData>({
        resolver: zodResolver(branchSchema),
        defaultValues: { is_active: true, has_airport_service: false },
    });

    const { data: generalSettingsRes } = useGeneralSettings();
    const globalCurrency = generalSettingsRes?.data?.currency ?? 'GHS';

    const hasAirportService = watch('has_airport_service');
    const watchedCurrency = watch('currency');
    const watchedCurrencySymbol = watch('currency_symbol');
    const watchedExchangeRate = watch('exchange_rate');
    const showExchangeRateSection =
        !!watchedCurrency && !!watchedCurrencySymbol;

    useEffect(() => {
        if (!hasAirportService) {
            setValue('airport_id', null);
        }
    }, [hasAirportService, setValue]);

    useEffect(() => {
        if (branch) {
            reset({
                name: branch.name,
                code: branch.code ?? '',
                address: branch.address ?? '',
                phone: branch.phone ?? '',
                email: branch.email ?? '',
                description: branch.description ?? '',
                is_active: branch.is_active,
                currency: branch.currency ?? '',
                currency_symbol: branch.currency_symbol ?? '',
                exchange_rate: branch.exchange_rate ?? undefined,
                show_converted_price: branch.show_converted_price ?? true,
                has_airport_service: branch.has_airport_service ?? false,
                airport_id: branch.airport_id ?? null,
            });
        }
    }, [branch?.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

    const onSubmit = (data: BranchFormData) => {
        if (showExchangeRateSection && !data.exchange_rate) {
            setError('exchange_rate', {
                message:
                    'Exchange rate is required when using a different currency',
            });
            return;
        }

        const payload = {
            name: data.name,
            code: data.code || undefined,
            address: data.address || undefined,
            phone: data.phone || undefined,
            email: data.email || undefined,
            description: data.description || undefined,
            is_active: data.is_active,
            currency: data.currency || null,
            currency_symbol: data.currency_symbol || null,
            exchange_rate: showExchangeRateSection
                ? (data.exchange_rate ?? null)
                : null,
            show_converted_price: showExchangeRateSection
                ? (data.show_converted_price ?? true)
                : true,
            has_airport_service: data.has_airport_service,
            airport_id: data.has_airport_service
                ? data.airport_id || null
                : null,
        };

        if (isEdit) {
            updateMutation.mutate(
                { id: id!, payload },
                {
                    onSuccess: () => navigate(ROUTES.DASHBOARD.BRANCHES.ROOT),
                    onError: error => applyServerErrors(error, setError),
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => navigate(ROUTES.DASHBOARD.BRANCHES.ROOT),
                onError: error => applyServerErrors(error, setError),
            });
        }
    };

    const handleSaveManagers = () => {
        assignManagersMutation.mutate({
            id: id!,
            userIds: selectedManagerIds,
        });
    };

    const handleToggleManager = (userId: string | number) => {
        const uid = String(userId);
        setSelectedManagerIds(prev =>
            prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
        );
    };

    if (isEdit && branchLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    if (isEdit && !branch) {
        return <Alert variant="danger">Branch not found.</Alert>;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>{isEdit ? 'Edit Branch' : 'Add Branch'}</h4>
                <p className="text-muted mb-0">
                    {isEdit
                        ? 'Update branch information and manage assigned managers.'
                        : 'Create a new branch location for your fleet.'}
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {(createMutation.isError || updateMutation.isError) && (
                    <Alert variant="danger" className="mb-3">
                        Failed to save branch. Please check your inputs and try
                        again.
                    </Alert>
                )}

                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Branch Information</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Branch Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('name')}
                                        isInvalid={!!errors.name}
                                        placeholder="e.g. Accra Headquarters"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Branch Code</Form.Label>
                                    <Form.Control
                                        {...register('code')}
                                        isInvalid={!!errors.code}
                                        placeholder="e.g. ACC"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.code?.message}
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
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        {...register('address')}
                                        placeholder="Physical address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        {...register('phone')}
                                        isInvalid={!!errors.phone}
                                        placeholder="+233 XX XXX XXXX"
                                    />
                                    <Form.Text className="text-muted">
                                        Shown on the public contact page
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.phone?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        {...register('email')}
                                        isInvalid={!!errors.email}
                                        placeholder="branch@example.com"
                                    />
                                    <Form.Text className="text-muted">
                                        Shown on the public contact page
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        {...register('description')}
                                        placeholder="Optional notes about this branch"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Currency Code</Form.Label>
                                    <Form.Control
                                        {...register('currency')}
                                        isInvalid={!!errors.currency}
                                        placeholder="e.g. NGN"
                                    />
                                    <Form.Text className="text-muted">
                                        Leave blank to use General Settings
                                        default
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.currency?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Currency Symbol</Form.Label>
                                    <Form.Control
                                        {...register('currency_symbol')}
                                        isInvalid={!!errors.currency_symbol}
                                        placeholder="e.g. ₦"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.currency_symbol?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            {showExchangeRateSection && (
                                <>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>
                                                Exchange Rate{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.000001"
                                                min="0.000001"
                                                placeholder="e.g. 0.0082"
                                                {...register('exchange_rate', {
                                                    setValueAs: v =>
                                                        v === '' ||
                                                        v === null ||
                                                        v === undefined
                                                            ? null
                                                            : Number(v),
                                                })}
                                                isInvalid={
                                                    !!errors.exchange_rate
                                                }
                                            />
                                            <Form.Text className="text-muted">
                                                {watchedExchangeRate
                                                    ? `1 ${watchedCurrency} = ${watchedExchangeRate} ${globalCurrency}`
                                                    : `Rate to convert 1 ${watchedCurrency} to ${globalCurrency}`}
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.exchange_rate?.message}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col
                                        md={3}
                                        className="d-flex align-items-center"
                                    >
                                        <Controller
                                            name="show_converted_price"
                                            control={control}
                                            render={({ field }) => (
                                                <Form.Check
                                                    type="switch"
                                                    id="show_converted_price"
                                                    label="Show converted price on listings"
                                                    checked={
                                                        field.value ?? true
                                                    }
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </Col>
                                </>
                            )}
                            <Col md={12}>
                                <hr className="my-1" />
                            </Col>
                            <Col md={3} className="d-flex align-items-center">
                                <Controller
                                    name="has_airport_service"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="switch"
                                            id="has_airport_service"
                                            label="Has Airport Service"
                                            checked={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>
                            {hasAirportService && (
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label>Linked Airport</Form.Label>
                                        <Form.Select
                                            {...register('airport_id')}
                                            isInvalid={!!errors.airport_id}
                                        >
                                            <option value="">
                                                Select airport…
                                            </option>
                                            {activeAirports.map(airport => (
                                                <option
                                                    key={airport.id}
                                                    value={airport.id}
                                                >
                                                    {airport.name} -{' '}
                                                    {airport.city},{' '}
                                                    {airport.country}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.airport_id?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate(ROUTES.DASHBOARD.BRANCHES.ROOT)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isPending}
                    >
                        {isPending
                            ? 'Saving...'
                            : isEdit
                              ? 'Save Changes'
                              : 'Create Branch'}
                    </Button>
                </div>
            </Form>

            {/* Assign Managers (edit mode only) */}
            {isEdit && (
                <Card className="mt-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0">Assigned Managers</h5>
                            <small className="text-muted">
                                Managers assigned to this branch will only see
                                vehicles belonging to it.
                            </small>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        {allManagers.length === 0 ? (
                            <p className="text-muted mb-0 small">
                                No manager-role users found.
                            </p>
                        ) : (
                            <Row className="g-2 mb-3">
                                {allManagers.map(user => (
                                    <Col key={user.id} md={4} xl={3}>
                                        <Form.Check
                                            type="checkbox"
                                            id={`manager-${user.id}`}
                                            label={user.name}
                                            checked={selectedManagerIds.includes(
                                                String(user.id)
                                            )}
                                            onChange={() =>
                                                handleToggleManager(user.id)
                                            }
                                        />
                                    </Col>
                                ))}
                            </Row>
                        )}
                        <div className="d-flex justify-content-end">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSaveManagers}
                                disabled={assignManagersMutation.isPending}
                            >
                                {assignManagersMutation.isPending
                                    ? 'Saving...'
                                    : 'Save Manager Assignment'}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
}
