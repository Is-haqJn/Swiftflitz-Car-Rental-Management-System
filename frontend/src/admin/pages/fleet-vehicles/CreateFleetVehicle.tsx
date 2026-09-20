import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    Row,
    Spinner,
} from 'react-bootstrap';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaImage, FaTrash } from 'react-icons/fa6';

import {
    useFleetVehicle,
    useCreateFleetVehicle,
    useUpdateFleetVehicle,
    useDeleteFleetVehiclePhoto,
    fleetVehicleKeys,
} from '@/shared/hooks/queries/useFleetVehicles';
import { useActiveFeatures } from '@/shared/hooks/queries/useFeatures';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { useAirportPackages } from '@/shared/hooks/queries/useAirportPackages';
import { useCategories } from '@/shared/hooks/queries/useCategories';
import { useDrivers } from '@/shared/hooks/queries/useDrivers';
import { fleetVehicleService } from '@/services/fleetVehicleService';
import { useQueryClient } from '@tanstack/react-query';
import { selectAuthUser } from '@/store/slices/authSlice';
import { ROUTES } from '@/shared/routes';
import { applyServerErrors } from '@/shared/libs/utils';
import { useTitle } from '@/shared/hooks';
import DatePickerField from '@/admin/components/DatePickerField';
import toast from 'react-hot-toast';
import type { FleetVehicle } from '@/shared/types/fleetVehicle.types';

/* Schema */
const schema = z
    .object({
        branch_id: z.string().min(1, 'Branch is required'),
        make: z.string().min(1, 'Make is required'),
        model: z.string().min(1, 'Model is required'),
        year: z.string().min(1, 'Year is required'),
        color: z.string().min(1, 'Color is required'),
        license_plate: z.string().min(1, 'License plate is required'),
        seats: z.string().min(1, 'Seats is required'),
        has_insurance: z.boolean(),
        insurance_expiry_date: z.string().optional().or(z.literal('')),
        has_roadworthy: z.boolean(),
        roadworthy_expiry_date: z.string().optional().or(z.literal('')),
        features: z.array(z.string()).optional(),
        status: z.string().min(1),
        is_active: z.boolean(),
        is_featured: z.boolean(),
        description: z.string().optional().or(z.literal('')),
        notes: z.string().optional().or(z.literal('')),
        airport_enabled: z.boolean(),
        airport_packages: z.array(z.string()).optional(),
        chauffeur_enabled: z.boolean(),
        chauffeur_category_id: z.string().optional().or(z.literal('')),
        chauffeur_base_price: z.string().optional().or(z.literal('')),
        transmission: z.string().nullable().optional(),
        fuel_type: z.string().nullable().optional(),
        engine: z.string().nullable().optional(),
        is_personal_vehicle: z.boolean(),
        default_driver_id: z.string().nullable().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.is_personal_vehicle && !data.default_driver_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Personal vehicles require a default driver.',
                path: ['default_driver_id'],
            });
        }
        if (data.chauffeur_enabled) {
            if (!data.chauffeur_category_id) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'Vehicle category is required for chauffeur service.',
                    path: ['chauffeur_category_id'],
                });
            }
            if (!data.chauffeur_base_price) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Base price is required for chauffeur service.',
                    path: ['chauffeur_base_price'],
                });
            }
        }
    });

type FormData = z.infer<typeof schema>;

/* Helpers */
function safeStr(v: unknown, fallback = ''): string {
    if (v == null) return fallback;
    return String(v);
}

function vehicleToFormDefaults(v: FleetVehicle): FormData {
    const airportAssignments = (v.service_assignments ?? []).filter(
        a => a.service_type === 'airport' && a.is_active
    );
    const chauffeurAssignment = (v.service_assignments ?? []).find(
        a => a.service_type === 'chauffeur'
    );

    return {
        branch_id: v.branch_id ?? '',
        make: safeStr(v.make),
        model: safeStr(v.model),
        year: safeStr(v.year),
        color: safeStr(v.color),
        license_plate: safeStr(v.license_plate),
        seats: safeStr(v.seats, '5'),
        has_insurance: Boolean(v.has_insurance),
        insurance_expiry_date: safeStr(v.insurance_expiry_date),
        has_roadworthy: Boolean(v.has_roadworthy),
        roadworthy_expiry_date: safeStr(v.roadworthy_expiry_date),
        features: v.features ?? [],
        status: safeStr(v.status, 'available'),
        is_active: v.is_active ?? true,
        is_featured: v.is_featured ?? false,
        description: safeStr(v.description),
        notes: safeStr(v.notes),
        airport_enabled: airportAssignments.length > 0,
        airport_packages: airportAssignments
            .map(a => a.package_id)
            .filter(Boolean) as string[],
        chauffeur_enabled: !!chauffeurAssignment,
        chauffeur_category_id: safeStr(chauffeurAssignment?.category_id),
        chauffeur_base_price: chauffeurAssignment?.base_price
            ? safeStr(chauffeurAssignment.base_price)
            : '',
        transmission: v.transmission ?? '',
        fuel_type: v.fuel_type ?? '',
        engine: safeStr(v.engine),
        is_personal_vehicle: v.is_personal_vehicle ?? false,
        default_driver_id: v.default_driver_id ?? null,
    };
}

/* Component */
export default function CreateFleetVehicle() {
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const title = useTitle(isEdit ? 'Edit Chauffeured Vehicle' : 'Add Chauffeured Vehicle');

    const authUser = useSelector(selectAuthUser);
    const userBranches = authUser?.branches ?? [];
    const hasGlobalBranchAccess = !userBranches.length;

    const { data: vehicleRes, isLoading: vehicleLoading } = useFleetVehicle(
        id ?? ''
    );
    const queryClient = useQueryClient();
    const createMutation = useCreateFleetVehicle();
    const updateMutation = useUpdateFleetVehicle();
    const deletePhotoMutation = useDeleteFleetVehiclePhoto();

    const { data: activeFeatures = [], isLoading: loadingFeatures } =
        useActiveFeatures();
    const { data: branchesResponse } = useActiveBranches();
    const { data: packagesResponse, isLoading: loadingPackages } =
        useAirportPackages({ is_active: '1', per_page: 100 });
    const { data: categoriesResponse, isLoading: loadingCategories } =
        useCategories();

    const { data: driversResponse } = useDrivers({
        is_active: true,
        per_page: 200,
    });
    const drivers = driversResponse?.data ?? [];

    const allBranches = branchesResponse?.data ?? [];
    const branchOptions = hasGlobalBranchAccess ? allBranches : userBranches;
    const airportPackages = packagesResponse?.data ?? [];
    const categories = categoriesResponse?.data ?? [];

    const vehicle = isEdit ? vehicleRes?.data : undefined;

    /* Photo state */
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
    const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

    /* Form */
    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            branch_id: '',
            make: '',
            model: '',
            year: String(new Date().getFullYear()),
            color: '',
            license_plate: '',
            seats: '5',
            has_insurance: true,
            insurance_expiry_date: '',
            has_roadworthy: true,
            roadworthy_expiry_date: '',
            features: [],
            status: 'available',
            is_active: true,
            is_featured: false,
            description: '',
            notes: '',
            airport_enabled: false,
            airport_packages: [],
            chauffeur_enabled: false,
            chauffeur_category_id: '',
            chauffeur_base_price: '',
            transmission: '',
            fuel_type: '',
            engine: '',
            is_personal_vehicle: false,
            default_driver_id: null,
        },
    });

    const selectedFeatures = useWatch({
        control,
        name: 'features',
        defaultValue: [],
    });
    const hasInsurance = useWatch({ control, name: 'has_insurance' });
    const hasRoadworthy = useWatch({ control, name: 'has_roadworthy' });
    const airportEnabled = useWatch({ control, name: 'airport_enabled' });
    const chauffeurEnabled = useWatch({ control, name: 'chauffeur_enabled' });
    const selectedPackages = useWatch({
        control,
        name: 'airport_packages',
        defaultValue: [],
    });
    const isPersonalVehicle = useWatch({
        control,
        name: 'is_personal_vehicle',
    });

    /* Auto-fill branch */
    useEffect(() => {
        if (!isEdit && !hasGlobalBranchAccess && userBranches.length === 1) {
            setValue('branch_id', userBranches[0].id);
        }
    }, [authUser?.id, isEdit, hasGlobalBranchAccess]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Pre-fill edit form */
    useEffect(() => {
        if (vehicle) {
            reset(vehicleToFormDefaults(vehicle));
        }
    }, [vehicle?.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Feature toggle */
    const toggleFeature = (name: string) => {
        const curr = selectedFeatures ?? [];
        setValue(
            'features',
            curr.includes(name) ? curr.filter(f => f !== name) : [...curr, name]
        );
    };

    /* Package toggle */
    const togglePackage = (pkgId: string) => {
        const curr = selectedPackages ?? [];
        setValue(
            'airport_packages',
            curr.includes(pkgId)
                ? curr.filter(p => p !== pkgId)
                : [...curr, pkgId]
        );
    };

    /* Photo handlers */
    const handlePhotoSelect = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        e.target.value = '';

        if (isEdit && vehicle) {
            // Upload all at once, single toast when done
            setIsUploadingPhotos(true);
            try {
                await Promise.all(
                    files.map(f =>
                        fleetVehicleService.uploadPhoto(vehicle.id, f)
                    )
                );
                queryClient.invalidateQueries({
                    queryKey: fleetVehicleKeys.detail(vehicle.id),
                });
                toast.success(
                    files.length === 1
                        ? 'Photo uploaded successfully'
                        : `${files.length} photos uploaded successfully`
                );
            } catch {
                toast.error('Failed to upload photo(s).');
            } finally {
                setIsUploadingPhotos(false);
            }
        } else {
            // Create mode: queue for upload after save
            const newPreviews = files.map(f => URL.createObjectURL(f));
            setPendingPhotos(prev => [...prev, ...files]);
            setPendingPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removePendingPhoto = (index: number) => {
        URL.revokeObjectURL(pendingPreviews[index]);
        setPendingPhotos(prev => prev.filter((_, i) => i !== index));
        setPendingPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleDeleteExistingPhoto = (mediaId: string) => {
        if (!vehicle) return;
        deletePhotoMutation.mutate({ vehicleId: vehicle.id, mediaId });
    };

    /* Submit */
    const onSubmit = async (data: FormData) => {
        try {
            const payload = {
                branch_id: data.branch_id,
                make: data.make.trim(),
                model: data.model.trim(),
                year: Number(data.year),
                color: data.color.trim(),
                license_plate: data.license_plate.trim(),
                seats: Number(data.seats),
                has_insurance: data.has_insurance,
                insurance_expiry_date: data.insurance_expiry_date || undefined,
                has_roadworthy: data.has_roadworthy,
                roadworthy_expiry_date:
                    data.roadworthy_expiry_date || undefined,
                features: data.features?.length ? data.features : undefined,
                status: data.status as FleetVehicle['status'],
                is_active: data.is_active,
                is_featured: data.is_featured,
                description: data.description?.trim() || undefined,
                notes: data.notes?.trim() || undefined,
                airport_packages: data.airport_enabled
                    ? (data.airport_packages ?? [])
                    : [],
                chauffeur_service:
                    data.chauffeur_enabled &&
                    data.chauffeur_category_id &&
                    data.chauffeur_base_price
                        ? {
                              category_id: data.chauffeur_category_id,
                              base_price: Number(data.chauffeur_base_price),
                          }
                        : null,
                transmission:
                    (data.transmission as
                        | 'automatic'
                        | 'manual'
                        | 'semi-automatic'
                        | null) || null,
                fuel_type:
                    (data.fuel_type as
                        | 'petrol'
                        | 'diesel'
                        | 'electric'
                        | 'hybrid'
                        | null) || null,
                engine: data.engine?.trim() || null,
                is_personal_vehicle: data.is_personal_vehicle,
                default_driver_id: data.default_driver_id || null,
            };

            const res =
                isEdit && vehicle
                    ? await updateMutation.mutateAsync({
                          id: vehicle.id,
                          payload,
                      })
                    : await createMutation.mutateAsync(payload);

            const saved = res.data;

            // Upload pending photos (create mode) - single toast after all done
            if (pendingPhotos.length) {
                await Promise.all(
                    pendingPhotos.map(f =>
                        fleetVehicleService.uploadPhoto(saved.id, f)
                    )
                );
                queryClient.invalidateQueries({
                    queryKey: fleetVehicleKeys.detail(saved.id),
                });
                toast.success(
                    pendingPhotos.length === 1
                        ? 'Photo uploaded successfully'
                        : `${pendingPhotos.length} photos uploaded successfully`
                );
            }

            navigate(ROUTES.DASHBOARD.FLEET_VEHICLES.VIEW(saved.id));
        } catch (err) {
            applyServerErrors(err, setError);
        }
    };

    const isSaving =
        isSubmitting ||
        createMutation.isPending ||
        updateMutation.isPending ||
        isUploadingPhotos;

    if (isEdit && vehicleLoading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    const existingPhotos = vehicle?.photos ?? [];

    /* Render */
    return (
        <>
            {title}
            <div className="pb-4">
                <Form noValidate onSubmit={handleSubmit(onSubmit)}>
                    {Object.keys(errors).length > 0 && (
                        <Alert variant="danger" className="mb-3">
                            Please fix the highlighted errors before submitting.
                        </Alert>
                    )}

                    <Row>
                        {/* Main Column */}
                        <Col xl={8}>
                            {/* Vehicle Information */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">
                                        Vehicle Information
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                ROUTES.DASHBOARD.FLEET_VEHICLES
                                                    .ROOT
                                            )
                                        }
                                    >
                                        All Chauffeured Fleet
                                    </Button>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        <Row>
                                            {/* Branch */}
                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Branch{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    {!hasGlobalBranchAccess &&
                                                    userBranches.length ===
                                                        1 ? (
                                                        <Form.Control
                                                            readOnly
                                                            value={
                                                                userBranches[0]
                                                                    .name
                                                            }
                                                        />
                                                    ) : (
                                                        <Form.Select
                                                            className="tw:h-[2.9rem]"
                                                            {...register(
                                                                'branch_id'
                                                            )}
                                                            isInvalid={
                                                                !!errors.branch_id
                                                            }
                                                        >
                                                            <option value="">
                                                                Select branch
                                                            </option>
                                                            {branchOptions.map(
                                                                b => (
                                                                    <option
                                                                        key={
                                                                            b.id
                                                                        }
                                                                        value={
                                                                            b.id
                                                                        }
                                                                    >
                                                                        {b.name}
                                                                    </option>
                                                                )
                                                            )}
                                                        </Form.Select>
                                                    )}
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.branch_id
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            {/* Make */}
                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Make{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register('make')}
                                                        isInvalid={
                                                            !!errors.make
                                                        }
                                                        placeholder="e.g. Toyota"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.make?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            {/* Model */}
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Model{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register('model')}
                                                        isInvalid={
                                                            !!errors.model
                                                        }
                                                        placeholder="e.g. Corolla"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.model?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            {/* Year */}
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Year{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register('year')}
                                                        isInvalid={
                                                            !!errors.year
                                                        }
                                                        min={1900}
                                                        max={2035}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.year?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            {/* Color */}
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Color{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register('color')}
                                                        isInvalid={
                                                            !!errors.color
                                                        }
                                                        placeholder="e.g. White"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.color?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            {/* License Plate */}
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        License Plate{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register(
                                                            'license_plate'
                                                        )}
                                                        isInvalid={
                                                            !!errors.license_plate
                                                        }
                                                        placeholder="e.g. GR-1234-24"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors.license_plate
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            {/* Seats */}
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Seats{' '}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register('seats')}
                                                        isInvalid={
                                                            !!errors.seats
                                                        }
                                                        min={1}
                                                        max={50}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.seats?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>

                                            {/* Transmission */}
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Transmission
                                                    </Form.Label>
                                                    <Form.Select
                                                        className="tw:h-[2.9rem]"
                                                        {...register(
                                                            'transmission'
                                                        )}
                                                    >
                                                        <option value="">
                                                            - Not specified -
                                                        </option>
                                                        <option value="automatic">
                                                            Automatic
                                                        </option>
                                                        <option value="manual">
                                                            Manual
                                                        </option>
                                                        <option value="semi-automatic">
                                                            Semi-Automatic
                                                        </option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>

                                            {/* Fuel Type */}
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Fuel Type
                                                    </Form.Label>
                                                    <Form.Select
                                                        className="tw:h-[2.9rem]"
                                                        {...register(
                                                            'fuel_type'
                                                        )}
                                                    >
                                                        <option value="">
                                                            - Not specified -
                                                        </option>
                                                        <option value="petrol">
                                                            Petrol
                                                        </option>
                                                        <option value="diesel">
                                                            Diesel
                                                        </option>
                                                        <option value="electric">
                                                            Electric
                                                        </option>
                                                        <option value="hybrid">
                                                            Hybrid
                                                        </option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>

                                            {/* Engine */}
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Engine
                                                    </Form.Label>
                                                    <Form.Control
                                                        {...register('engine')}
                                                        placeholder="e.g. 3.0L V6"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">Documents</div>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        <Row>
                                            {/* Insurance */}
                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <Controller
                                                            name="has_insurance"
                                                            control={control}
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="has_insurance"
                                                                    label="Has Valid Insurance"
                                                                    checked={
                                                                        field.value
                                                                    }
                                                                    onChange={e => {
                                                                        field.onChange(
                                                                            e
                                                                        );
                                                                        if (
                                                                            !e
                                                                                .target
                                                                                .checked
                                                                        )
                                                                            setValue(
                                                                                'insurance_expiry_date',
                                                                                ''
                                                                            );
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    {hasInsurance && (
                                                        <>
                                                            <Form.Label className="small text-muted">
                                                                Insurance Expiry
                                                                Date
                                                            </Form.Label>
                                                            <Controller
                                                                name="insurance_expiry_date"
                                                                control={
                                                                    control
                                                                }
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <DatePickerField
                                                                        value={
                                                                            field.value ??
                                                                            ''
                                                                        }
                                                                        onChange={
                                                                            field.onChange
                                                                        }
                                                                        isInvalid={
                                                                            !!errors.insurance_expiry_date
                                                                        }
                                                                        placeholder="Select expiry date"
                                                                    />
                                                                )}
                                                            />
                                                        </>
                                                    )}
                                                </Form.Group>
                                            </Col>

                                            {/* Roadworthy */}
                                            <Col md={6} className="mb-3">
                                                <Form.Group>
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <Controller
                                                            name="has_roadworthy"
                                                            control={control}
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="has_roadworthy"
                                                                    label="Has Roadworthy Cert"
                                                                    checked={
                                                                        field.value
                                                                    }
                                                                    onChange={e => {
                                                                        field.onChange(
                                                                            e
                                                                        );
                                                                        if (
                                                                            !e
                                                                                .target
                                                                                .checked
                                                                        )
                                                                            setValue(
                                                                                'roadworthy_expiry_date',
                                                                                ''
                                                                            );
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    {hasRoadworthy && (
                                                        <>
                                                            <Form.Label className="small text-muted">
                                                                Roadworthy
                                                                Expiry Date
                                                            </Form.Label>
                                                            <Controller
                                                                name="roadworthy_expiry_date"
                                                                control={
                                                                    control
                                                                }
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <DatePickerField
                                                                        value={
                                                                            field.value ??
                                                                            ''
                                                                        }
                                                                        onChange={
                                                                            field.onChange
                                                                        }
                                                                        isInvalid={
                                                                            !!errors.roadworthy_expiry_date
                                                                        }
                                                                        placeholder="Select expiry date"
                                                                    />
                                                                )}
                                                            />
                                                        </>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>

                            {/* Service Assignments */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">
                                        Service Assignments
                                    </div>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        {/* Airport Service */}
                                        <Card className="mb-3">
                                            <Card.Header className="d-flex align-items-center justify-content-between py-2">
                                                <div className="fw-semibold d-flex align-items-center gap-2">
                                                    <Badge
                                                        bg="warning"
                                                        text="dark"
                                                    >
                                                        Airport
                                                    </Badge>
                                                    Airport Transfer Service
                                                </div>
                                                <Controller
                                                    name="airport_enabled"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Check
                                                            type="switch"
                                                            id="airport_enabled"
                                                            checked={
                                                                field.value
                                                            }
                                                            onChange={
                                                                field.onChange
                                                            }
                                                        />
                                                    )}
                                                />
                                            </Card.Header>
                                            {airportEnabled && (
                                                <Card.Body>
                                                    <Form.Label className="small fw-semibold text-muted mb-2">
                                                        Select Packages
                                                    </Form.Label>
                                                    {loadingPackages ? (
                                                        <div className="text-center py-2 text-muted small">
                                                            <Spinner
                                                                animation="border"
                                                                size="sm"
                                                                className="me-1"
                                                            />
                                                            Loading packages...
                                                        </div>
                                                    ) : airportPackages.length ===
                                                      0 ? (
                                                        <p className="text-muted small mb-0">
                                                            No active airport
                                                            packages available.
                                                        </p>
                                                    ) : (
                                                        <Row>
                                                            {airportPackages.map(
                                                                pkg => (
                                                                    <Col
                                                                        md={6}
                                                                        key={
                                                                            pkg.id
                                                                        }
                                                                        className="mb-2"
                                                                    >
                                                                        <Form.Check
                                                                            type="checkbox"
                                                                            id={`pkg-${pkg.id}`}
                                                                            label={
                                                                                pkg.name
                                                                            }
                                                                            checked={
                                                                                selectedPackages?.includes(
                                                                                    pkg.id
                                                                                ) ??
                                                                                false
                                                                            }
                                                                            onChange={() =>
                                                                                togglePackage(
                                                                                    pkg.id
                                                                                )
                                                                            }
                                                                        />
                                                                    </Col>
                                                                )
                                                            )}
                                                        </Row>
                                                    )}
                                                    {(selectedPackages?.length ??
                                                        0) > 0 && (
                                                        <Form.Text className="text-muted">
                                                            {
                                                                selectedPackages?.length
                                                            }{' '}
                                                            package
                                                            {selectedPackages?.length !==
                                                            1
                                                                ? 's'
                                                                : ''}{' '}
                                                            selected
                                                        </Form.Text>
                                                    )}
                                                </Card.Body>
                                            )}
                                        </Card>

                                        {/* Chauffeur Service */}
                                        <Card className="mb-3">
                                            <Card.Header className="d-flex align-items-center justify-content-between py-2">
                                                <div className="fw-semibold d-flex align-items-center gap-2">
                                                    <Badge
                                                        bg="info"
                                                        text="dark"
                                                    >
                                                        Chauffeur
                                                    </Badge>
                                                    Chauffeur Service
                                                    <Badge
                                                        bg="secondary"
                                                        className="ms-1 fw-normal"
                                                        style={{
                                                            fontSize: '0.7em',
                                                        }}
                                                    >
                                                        placeholder
                                                    </Badge>
                                                </div>
                                                <Controller
                                                    name="chauffeur_enabled"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Check
                                                            type="switch"
                                                            id="chauffeur_enabled"
                                                            checked={
                                                                field.value
                                                            }
                                                            onChange={
                                                                field.onChange
                                                            }
                                                        />
                                                    )}
                                                />
                                            </Card.Header>
                                            {chauffeurEnabled && (
                                                <Card.Body>
                                                    <Row>
                                                        <Col
                                                            md={6}
                                                            className="mb-3"
                                                        >
                                                            <Form.Group>
                                                                <Form.Label>
                                                                    Vehicle
                                                                    Category
                                                                </Form.Label>
                                                                <Form.Select
                                                                    className="tw:h-[2.9rem]"
                                                                    {...register(
                                                                        'chauffeur_category_id'
                                                                    )}
                                                                    disabled={
                                                                        loadingCategories
                                                                    }
                                                                    isInvalid={
                                                                        !!errors.chauffeur_category_id
                                                                    }
                                                                >
                                                                    <option value="">
                                                                        {loadingCategories
                                                                            ? 'Loading...'
                                                                            : 'Select category'}
                                                                    </option>
                                                                    {categories.map(
                                                                        cat => (
                                                                            <option
                                                                                key={
                                                                                    cat.id
                                                                                }
                                                                                value={
                                                                                    cat.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    cat.name
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </Form.Select>
                                                                <Form.Control.Feedback type="invalid">
                                                                    {
                                                                        errors
                                                                            .chauffeur_category_id
                                                                            ?.message
                                                                    }
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col
                                                            md={6}
                                                            className="mb-3"
                                                        >
                                                            <Form.Group>
                                                                <Form.Label>
                                                                    Base Price
                                                                </Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    {...register(
                                                                        'chauffeur_base_price'
                                                                    )}
                                                                    placeholder="0.00"
                                                                    step="0.01"
                                                                    min={0}
                                                                    isInvalid={
                                                                        !!errors.chauffeur_base_price
                                                                    }
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {
                                                                        errors
                                                                            .chauffeur_base_price
                                                                            ?.message
                                                                    }
                                                                </Form.Control.Feedback>
                                                                <Form.Text className="text-muted">
                                                                    Base rate
                                                                    for
                                                                    chauffeur
                                                                    service (not
                                                                    yet wired to
                                                                    bookings).
                                                                </Form.Text>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            )}
                                        </Card>

                                        {/* Driver Assignment */}
                                        <Card>
                                            <Card.Header className="d-flex align-items-center justify-content-between py-2">
                                                <div className="fw-semibold d-flex align-items-center gap-2">
                                                    <Badge bg="success">
                                                        Driver
                                                    </Badge>
                                                    Driver Assignment
                                                </div>
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="mb-3">
                                                    <Controller
                                                        name="is_personal_vehicle"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Form.Check
                                                                type="switch"
                                                                id="is_personal_vehicle"
                                                                label="Personal vehicle (driver owns this vehicle)"
                                                                checked={
                                                                    field.value
                                                                }
                                                                onChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        )}
                                                    />
                                                    {isPersonalVehicle && (
                                                        <Form.Text className="text-warning d-block mt-1">
                                                            When the assigned
                                                            driver is
                                                            unavailable, this
                                                            vehicle cannot be
                                                            booked.
                                                        </Form.Text>
                                                    )}
                                                </div>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Default Driver
                                                        {isPersonalVehicle && (
                                                            <span className="text-danger ms-1">
                                                                *
                                                            </span>
                                                        )}
                                                    </Form.Label>
                                                    <Controller
                                                        name="default_driver_id"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Form.Select
                                                                className="tw:h-[2.9rem]"
                                                                value={
                                                                    field.value ??
                                                                    ''
                                                                }
                                                                onChange={e =>
                                                                    field.onChange(
                                                                        e.target
                                                                            .value ||
                                                                            null
                                                                    )
                                                                }
                                                                isInvalid={
                                                                    !!errors.default_driver_id
                                                                }
                                                            >
                                                                <option value="">
                                                                    - No default
                                                                    driver -
                                                                </option>
                                                                {drivers.map(
                                                                    d => (
                                                                        <option
                                                                            key={
                                                                                d.id
                                                                            }
                                                                            value={
                                                                                d.id
                                                                            }
                                                                        >
                                                                            {
                                                                                d.full_name
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </Form.Select>
                                                        )}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {
                                                            errors
                                                                .default_driver_id
                                                                ?.message
                                                        }
                                                    </Form.Control.Feedback>
                                                    <Form.Text className="text-muted">
                                                        {isPersonalVehicle
                                                            ? 'Required. Only this driver can be assigned to this vehicle.'
                                                            : 'Optional. Auto-assigned when this vehicle is booked if available.'}
                                                    </Form.Text>
                                                </Form.Group>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        {/* end col-xl-8 */}

                        {/* Sidebar Column */}
                        <Col xl={4}>
                            {/* Photos */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">Photos</div>
                                    <Button
                                        type="button"
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() =>
                                            photoInputRef.current?.click()
                                        }
                                        disabled={isUploadingPhotos}
                                    >
                                        {isUploadingPhotos ? (
                                            <Spinner
                                                animation="border"
                                                size="sm"
                                            />
                                        ) : (
                                            '+ Add Photo'
                                        )}
                                    </Button>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        <input
                                            ref={photoInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            multiple
                                            className="d-none"
                                            onChange={handlePhotoSelect}
                                        />

                                        {/* Existing photos (edit mode) */}
                                        {existingPhotos.length > 0 && (
                                            <Row className="g-2 mb-2">
                                                {existingPhotos.map(photo => (
                                                    <Col
                                                        xs={6}
                                                        key={photo.id}
                                                        className="position-relative"
                                                    >
                                                        <img
                                                            src={
                                                                photo.urls.thumb
                                                            }
                                                            alt="vehicle"
                                                            className="w-100 rounded"
                                                            style={{
                                                                height: 90,
                                                                objectFit:
                                                                    'cover',
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="danger"
                                                            size="sm"
                                                            className="position-absolute top-0 end-0 m-1 p-1"
                                                            style={{
                                                                lineHeight: 1,
                                                            }}
                                                            onClick={() =>
                                                                handleDeleteExistingPhoto(
                                                                    photo.id
                                                                )
                                                            }
                                                            disabled={
                                                                deletePhotoMutation.isPending
                                                            }
                                                        >
                                                            <FaTrash
                                                                size={10}
                                                            />
                                                        </Button>
                                                    </Col>
                                                ))}
                                            </Row>
                                        )}

                                        {/* Pending photos (create mode) */}
                                        {pendingPreviews.length > 0 && (
                                            <Row className="g-2 mb-2">
                                                {pendingPreviews.map(
                                                    (src, i) => (
                                                        <Col
                                                            xs={6}
                                                            key={i}
                                                            className="position-relative"
                                                        >
                                                            <img
                                                                src={src}
                                                                alt="preview"
                                                                className="w-100 rounded"
                                                                style={{
                                                                    height: 90,
                                                                    objectFit:
                                                                        'cover',
                                                                }}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="danger"
                                                                size="sm"
                                                                className="position-absolute top-0 end-0 m-1 p-1"
                                                                style={{
                                                                    lineHeight: 1,
                                                                }}
                                                                onClick={() =>
                                                                    removePendingPhoto(
                                                                        i
                                                                    )
                                                                }
                                                            >
                                                                <FaTrash
                                                                    size={10}
                                                                />
                                                            </Button>
                                                        </Col>
                                                    )
                                                )}
                                            </Row>
                                        )}

                                        {existingPhotos.length === 0 &&
                                            pendingPreviews.length === 0 && (
                                                <div
                                                    className="border rounded d-flex align-items-center justify-content-center text-muted"
                                                    style={{ height: 90 }}
                                                    role="button"
                                                    onClick={() =>
                                                        photoInputRef.current?.click()
                                                    }
                                                >
                                                    <div className="text-center small">
                                                        <FaImage
                                                            size={20}
                                                            className="mb-1 d-block mx-auto"
                                                        />
                                                        Click to add photos
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">Features</div>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        <div
                                            className="border rounded p-3"
                                            style={{
                                                maxHeight: '250px',
                                                overflowY: 'auto',
                                            }}
                                        >
                                            <Row>
                                                {loadingFeatures ? (
                                                    <div className="text-center py-3 text-muted">
                                                        <Spinner
                                                            animation="border"
                                                            size="sm"
                                                            className="me-2"
                                                        />
                                                        Loading features...
                                                    </div>
                                                ) : activeFeatures.length ===
                                                  0 ? (
                                                    <div className="text-center py-3 text-muted small">
                                                        No features available.
                                                    </div>
                                                ) : (
                                                    activeFeatures.map(f => (
                                                        <Col
                                                            md={6}
                                                            key={f.id}
                                                            className="mb-2"
                                                        >
                                                            <Form.Check
                                                                type="checkbox"
                                                                id={`feat-${f.id}`}
                                                                label={f.name}
                                                                checked={
                                                                    selectedFeatures?.includes(
                                                                        f.name
                                                                    ) ?? false
                                                                }
                                                                onChange={() =>
                                                                    toggleFeature(
                                                                        f.name
                                                                    )
                                                                }
                                                            />
                                                        </Col>
                                                    ))
                                                )}
                                            </Row>
                                        </div>
                                        <Form.Text className="text-muted">
                                            {selectedFeatures?.length ?? 0}{' '}
                                            feature
                                            {selectedFeatures?.length !== 1
                                                ? 's'
                                                : ''}{' '}
                                            selected
                                        </Form.Text>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Notes */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="content-title">
                                    <div className="cpa">
                                        Status &amp; Notes
                                    </div>
                                </div>
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body">
                                        <Row>
                                            <Col md={12} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Status
                                                    </Form.Label>
                                                    <Form.Select
                                                        className="tw:h-[2.9rem]"
                                                        {...register('status')}
                                                        isInvalid={
                                                            !!errors.status
                                                        }
                                                    >
                                                        <option value="available">
                                                            Available
                                                        </option>
                                                        <option value="on_trip">
                                                            On Trip
                                                        </option>
                                                        <option value="maintenance">
                                                            Maintenance
                                                        </option>
                                                        <option value="inactive">
                                                            Inactive
                                                        </option>
                                                        <option value="retired">
                                                            Retired
                                                        </option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>

                                            <Col md={12} className="mb-3">
                                                <Controller
                                                    name="is_active"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Check
                                                            type="switch"
                                                            id="is_active"
                                                            label="Active"
                                                            checked={
                                                                field.value
                                                            }
                                                            onChange={
                                                                field.onChange
                                                            }
                                                        />
                                                    )}
                                                />
                                            </Col>

                                            <Col md={12} className="mb-3">
                                                <Controller
                                                    name="is_featured"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Form.Check
                                                            type="switch"
                                                            id="is_featured"
                                                            label="Featured on Homepage"
                                                            checked={
                                                                field.value
                                                            }
                                                            onChange={
                                                                field.onChange
                                                            }
                                                        />
                                                    )}
                                                />
                                                <Form.Text muted>
                                                    Show this vehicle in the
                                                    featured chauffeur fleet
                                                    section on the homepage.
                                                </Form.Text>
                                            </Col>

                                            <Col md={12} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>
                                                        Description
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={4}
                                                        {...register(
                                                            'description'
                                                        )}
                                                        placeholder="Describe this vehicle for customers..."
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Notes
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        {...register('notes')}
                                                        placeholder="Optional notes about this vehicle..."
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="filter cm-content-box box-primary mb-3">
                                <div className="cm-content-body form excerpt">
                                    <div className="card-body d-flex justify-content-end gap-2">
                                        <Button
                                            variant="light"
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    ROUTES.DASHBOARD
                                                        .FLEET_VEHICLES.ROOT
                                                )
                                            }
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Spinner
                                                        animation="border"
                                                        size="sm"
                                                        className="me-1"
                                                    />
                                                    Saving...
                                                </>
                                            ) : isEdit ? (
                                                'Update Vehicle'
                                            ) : (
                                                'Create Vehicle'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        {/* end col-xl-4 */}
                    </Row>
                </Form>
            </div>
        </>
    );
}
