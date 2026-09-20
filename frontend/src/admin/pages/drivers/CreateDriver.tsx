import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
    useDriver,
    useCreateDriver,
    useUpdateDriver,
    useUploadDriverPhoto,
    useUploadDriverIdDocument,
    useUploadDriverLicensePhoto,
} from '@/shared/hooks/queries/useDrivers';
import { ROUTES } from '@/shared/routes';
import { applyServerErrors } from '@/shared/libs/utils';
import { useTitle } from '@/shared/hooks';
import { FaCamera, FaFilePdf } from 'react-icons/fa6';
import DatePickerField from '@adminComponents/DatePickerField';

/* Schema */
const driverSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    phone_number: z.string().min(1, 'Phone number is required'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    license_number: z.string().min(1, 'License number is required'),
    license_class: z.string().min(1, 'License class is required'),
    license_expiry_date: z.string().min(1, 'License expiry date is required'),
    email: z.string().email('Invalid email').or(z.literal('')).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    id_type: z
        .enum([
            'ghana_card',
            'passport',
            'voters_id',
            'drivers_license',
            'ssnit',
            'other',
        ])
        .or(z.literal(''))
        .optional(),
    id_number: z.string().optional(),
    id_expiry_date: z.string().optional(),
    license_verified: z.boolean().optional(),
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    emergency_contact_relation: z.string().optional(),
    available_for_chauffeur: z.boolean().optional(),
    available_for_airport: z.boolean().optional(),
    notes: z.string().optional(),
    is_active: z.boolean(),
});

type DriverFormData = z.infer<typeof driverSchema>;

/* Component */
export default function CreateDriver() {
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const title = useTitle(isEdit ? 'Edit Driver' : 'Add Driver');

    const { data: driverRes, isLoading: driverLoading } = useDriver(id ?? '');
    const createMutation = useCreateDriver();
    const updateMutation = useUpdateDriver();
    const uploadPhotoMutation = useUploadDriverPhoto();
    const uploadIdDocMutation = useUploadDriverIdDocument();
    const uploadLicensePhotoMutation = useUploadDriverLicensePhoto();

    const driver = isEdit ? driverRes?.data : undefined;

    /* File state */
    const photoInputRef = useRef<HTMLInputElement>(null);
    const idDocInputRef = useRef<HTMLInputElement>(null);
    const licensePhotoInputRef = useRef<HTMLInputElement>(null);

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [idDocFile, setIdDocFile] = useState<File | null>(null);
    const [idDocPreview, setIdDocPreview] = useState<string | null>(null);
    const [idDocIsPdf, setIdDocIsPdf] = useState(false);
    const [licensePhotoFile, setLicensePhotoFile] = useState<File | null>(null);
    const [licensePhotoPreview, setLicensePhotoPreview] = useState<
        string | null
    >(null);
    const [licensePhotoIsPdf, setLicensePhotoIsPdf] = useState(false);

    /* Form */
    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        formState: { errors },
    } = useForm<DriverFormData>({
        resolver: zodResolver(driverSchema),
        defaultValues: {
            is_active: true,
            available_for_chauffeur: false,
            available_for_airport: false,
            license_verified: false,
        },
    });

    useEffect(() => {
        if (!driver) return;
        const status =
            typeof driver.status === 'string'
                ? driver.status
                : (driver.status as { value: string }).value;
        const idType =
            driver.id_type == null
                ? ''
                : typeof driver.id_type === 'string'
                  ? driver.id_type
                  : (driver.id_type as { value: string }).value;
        reset({
            first_name: driver.first_name,
            last_name: driver.last_name,
            phone_number: driver.phone_number,
            date_of_birth: driver.date_of_birth ?? '',
            license_number: driver.license_number,
            license_class: driver.license_class,
            license_expiry_date: driver.license_expiry_date,
            email: driver.email ?? '',
            address: driver.address ?? '',
            city: driver.city ?? '',
            id_type: (idType as DriverFormData['id_type']) ?? '',
            id_number: driver.id_number ?? '',
            id_expiry_date: driver.id_expiry_date ?? '',
            license_verified: driver.license_verified,
            emergency_contact_name: driver.emergency_contact_name ?? '',
            emergency_contact_phone: driver.emergency_contact_phone ?? '',
            emergency_contact_relation: driver.emergency_contact_relation ?? '',
            available_for_chauffeur: driver.available_for_chauffeur,
            available_for_airport: driver.available_for_airport,
            notes: driver.notes ?? '',
            is_active: driver.is_active,
        });
        void status;
    }, [driver?.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

    /* File handlers */
    function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }

    function removePhoto() {
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoFile(null);
        setPhotoPreview(null);
        if (photoInputRef.current) photoInputRef.current.value = '';
    }

    function handleIdDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (idDocPreview) URL.revokeObjectURL(idDocPreview);
        const isPdf = file.type === 'application/pdf';
        setIdDocFile(file);
        setIdDocIsPdf(isPdf);
        setIdDocPreview(isPdf ? null : URL.createObjectURL(file));
    }

    function removeIdDoc() {
        if (idDocPreview) URL.revokeObjectURL(idDocPreview);
        setIdDocFile(null);
        setIdDocPreview(null);
        setIdDocIsPdf(false);
        if (idDocInputRef.current) idDocInputRef.current.value = '';
    }

    function handleLicensePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (licensePhotoPreview) URL.revokeObjectURL(licensePhotoPreview);
        const isPdf = file.type === 'application/pdf';
        setLicensePhotoFile(file);
        setLicensePhotoIsPdf(isPdf);
        setLicensePhotoPreview(isPdf ? null : URL.createObjectURL(file));
    }

    function removeLicensePhoto() {
        if (licensePhotoPreview) URL.revokeObjectURL(licensePhotoPreview);
        setLicensePhotoFile(null);
        setLicensePhotoPreview(null);
        setLicensePhotoIsPdf(false);
        if (licensePhotoInputRef.current)
            licensePhotoInputRef.current.value = '';
    }

    /* Submit */
    const isPending =
        createMutation.isPending ||
        updateMutation.isPending ||
        uploadPhotoMutation.isPending ||
        uploadIdDocMutation.isPending ||
        uploadLicensePhotoMutation.isPending;

    const onSubmit = (data: DriverFormData) => {
        const payload = {
            first_name: data.first_name,
            last_name: data.last_name,
            phone_number: data.phone_number,
            date_of_birth: data.date_of_birth,
            license_number: data.license_number,
            license_class: data.license_class,
            license_expiry_date: data.license_expiry_date,
            email: data.email || undefined,
            address: data.address || undefined,
            city: data.city || undefined,
            id_type:
                (data.id_type as
                    | 'ghana_card'
                    | 'passport'
                    | 'voters_id'
                    | 'drivers_license'
                    | 'ssnit'
                    | 'other'
                    | undefined) || undefined,
            id_number: data.id_number || undefined,
            id_expiry_date: data.id_expiry_date || undefined,
            license_verified: data.license_verified,
            emergency_contact_name: data.emergency_contact_name || undefined,
            emergency_contact_phone: data.emergency_contact_phone || undefined,
            emergency_contact_relation:
                data.emergency_contact_relation || undefined,
            available_for_chauffeur: data.available_for_chauffeur,
            available_for_airport: data.available_for_airport,
            notes: data.notes || undefined,
            is_active: data.is_active,
        };

        const uploadFiles = async (driverId: string) => {
            if (photoFile) {
                await uploadPhotoMutation.mutateAsync({
                    driverId,
                    file: photoFile,
                });
            }
            if (idDocFile) {
                await uploadIdDocMutation.mutateAsync({
                    driverId,
                    file: idDocFile,
                });
            }
            if (licensePhotoFile) {
                await uploadLicensePhotoMutation.mutateAsync({
                    driverId,
                    file: licensePhotoFile,
                });
            }
            navigate(ROUTES.DASHBOARD.DRIVERS.VIEW(driverId));
        };

        if (isEdit) {
            updateMutation.mutate(
                { id: id!, payload },
                {
                    onSuccess: () => uploadFiles(id!),
                    onError: error => applyServerErrors(error, setError),
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: res => uploadFiles(res.data.id),
                onError: error => applyServerErrors(error, setError),
            });
        }
    };

    if (isEdit && driverLoading) {
        return <SettingsFormSkeleton />;
    }

    if (isEdit && !driver) {
        return <Alert variant="danger">Driver not found.</Alert>;
    }

    const existingPhoto = driver?.driver_photo ?? null;
    const existingIdDoc = driver?.id_document ?? null;
    const existingLicensePhoto = driver?.license_photo ?? null;

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>{isEdit ? 'Edit Driver' : 'Add New Driver'}</h4>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {(createMutation.isError || updateMutation.isError) && (
                    <Alert variant="danger" className="mb-3">
                        Failed to save driver. Please check your inputs and try
                        again.
                    </Alert>
                )}

                {/* Passport Photograph */}
                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Passport Photograph</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="d-flex align-items-start gap-4">
                            {/* Portrait preview box */}
                            <div
                                className="border rounded overflow-hidden flex-shrink-0 position-relative bg-light d-flex align-items-center justify-content-center"
                                style={{ width: 120, height: 160 }}
                            >
                                {photoPreview ? (
                                    <>
                                        <img
                                            src={photoPreview}
                                            alt="Passport photo"
                                            className="w-100 h-100"
                                            style={{ objectFit: 'cover' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                            style={{
                                                padding: '0.1rem 0.4rem',
                                                lineHeight: 1,
                                                fontSize: '0.75rem',
                                            }}
                                            onClick={removePhoto}
                                        >
                                            ×
                                        </button>
                                    </>
                                ) : isEdit && existingPhoto && !photoFile ? (
                                    <img
                                        src={
                                            existingPhoto.urls.thumb ??
                                            existingPhoto.urls.original
                                        }
                                        alt="Current photo"
                                        className="w-100 h-100"
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="text-center text-muted">
                                        <FaCamera size={28} className="mb-1" />
                                        <div style={{ fontSize: '0.7rem' }}>
                                            No photo
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* File input */}
                            <div className="flex-grow-1">
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Upload Passport Photo
                                    </Form.Label>
                                    <div className="text-muted small mb-2">
                                        Clear, frontal face photo on a plain
                                        background. Passport-style only.
                                    </div>
                                    <Form.Control
                                        ref={photoInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoSelect}
                                    />
                                    <Form.Text className="text-muted">
                                        JPEG, PNG, or WebP · Max 10MB
                                        {isEdit &&
                                            !photoFile &&
                                            existingPhoto && (
                                                <>
                                                    {' '}
                                                    · Select new to replace
                                                    current
                                                </>
                                            )}
                                    </Form.Text>
                                </Form.Group>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Personal Information */}
                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Personal Information</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        First Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('first_name')}
                                        isInvalid={!!errors.first_name}
                                        placeholder="e.g. Kofi"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.first_name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Last Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('last_name')}
                                        isInvalid={!!errors.last_name}
                                        placeholder="e.g. Mensah"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.last_name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Phone Number{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('phone_number')}
                                        isInvalid={!!errors.phone_number}
                                        placeholder="e.g. 0241234567"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.phone_number?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        {...register('email')}
                                        isInvalid={!!errors.email}
                                        type="email"
                                        placeholder="driver@example.com"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        Date of Birth{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Controller
                                        name="date_of_birth"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePickerField
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                isInvalid={
                                                    !!errors.date_of_birth
                                                }
                                                maxDate={new Date()}
                                                placeholder="Select date of birth"
                                            />
                                        )}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.date_of_birth?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        {...register('address')}
                                        placeholder="Street address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                        {...register('city')}
                                        placeholder="e.g. Accra"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Identity Document */}
                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Identity Document</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>ID Type</Form.Label>
                                    <Form.Select
                                        {...register('id_type')}
                                        isInvalid={!!errors.id_type}
                                        className="tw:h-[2.9rem]"
                                    >
                                        <option value="">
                                            - Select ID Type -
                                        </option>
                                        <option value="ghana_card">
                                            Ghana Card
                                        </option>
                                        <option value="passport">
                                            Passport
                                        </option>
                                        <option value="voters_id">
                                            Voters ID
                                        </option>
                                        <option value="drivers_license">
                                            Drivers License
                                        </option>
                                        <option value="ssnit">SSNIT</option>
                                        <option value="other">Other</option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.id_type?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>ID Number</Form.Label>
                                    <Form.Control
                                        {...register('id_number')}
                                        placeholder="GHA-123456789"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>ID Expiry Date</Form.Label>
                                    <Controller
                                        name="id_expiry_date"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePickerField
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                placeholder="Select ID expiry date"
                                            />
                                        )}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr className="my-3" />

                        {/* ID Document upload */}
                        <Form.Group>
                            <Form.Label className="fw-semibold">
                                Identity Document Image
                            </Form.Label>
                            <div className="text-muted small mb-2">
                                Upload a clear photo or scan of the selected ID
                                (Ghana Card, Passport, Voters ID, etc.)
                            </div>
                            <Form.Control
                                ref={idDocInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={handleIdDocSelect}
                            />
                            <Form.Text className="text-muted">
                                JPEG, PNG, WebP, or PDF · Max 10MB
                                {isEdit && !idDocFile && existingIdDoc && (
                                    <> · Select new to replace current</>
                                )}
                            </Form.Text>

                            {/* New file preview */}
                            {idDocFile && (
                                <div className="mt-2">
                                    {idDocIsPdf ? (
                                        <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                                            <FaFilePdf
                                                size={24}
                                                className="text-danger"
                                            />
                                            <span className="small text-truncate">
                                                {idDocFile.name}
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger ms-auto"
                                                onClick={removeIdDoc}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        idDocPreview && (
                                            <div
                                                className="position-relative border rounded overflow-hidden d-inline-block"
                                                style={{ maxWidth: 220 }}
                                            >
                                                <img
                                                    src={idDocPreview}
                                                    alt="ID Document"
                                                    className="w-100"
                                                    style={{
                                                        height: 140,
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                                    style={{
                                                        padding:
                                                            '0.1rem 0.4rem',
                                                        lineHeight: 1,
                                                    }}
                                                    onClick={removeIdDoc}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Existing in edit mode */}
                            {isEdit && !idDocFile && existingIdDoc && (
                                <div className="mt-2">
                                    {existingIdDoc.mime_type ===
                                    'application/pdf' ? (
                                        <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                                            <FaFilePdf
                                                size={24}
                                                className="text-danger"
                                            />
                                            <a
                                                href={
                                                    existingIdDoc.urls.original
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="small"
                                            >
                                                {existingIdDoc.file_name}
                                            </a>
                                            <span className="badge bg-secondary ms-auto">
                                                Current
                                            </span>
                                        </div>
                                    ) : (
                                        <div
                                            className="position-relative border rounded overflow-hidden d-inline-block"
                                            style={{ maxWidth: 220 }}
                                        >
                                            <img
                                                src={
                                                    existingIdDoc.urls.thumb ??
                                                    existingIdDoc.urls.original
                                                }
                                                alt="ID Document"
                                                className="w-100"
                                                style={{
                                                    height: 140,
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <span
                                                className="position-absolute top-0 start-0 m-1 badge bg-secondary"
                                                style={{ fontSize: '0.6rem' }}
                                            >
                                                Current
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Form.Group>
                    </Card.Body>
                </Card>

                {/* Driving License */}
                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Driving License</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        License Number{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('license_number')}
                                        isInvalid={!!errors.license_number}
                                        placeholder="GH-1234"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.license_number?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        License Class{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('license_class')}
                                        isInvalid={!!errors.license_class}
                                        placeholder="e.g. Class B"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.license_class?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        Expiry Date{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Controller
                                        name="license_expiry_date"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePickerField
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                isInvalid={
                                                    !!errors.license_expiry_date
                                                }
                                                placeholder="Select expiry date"
                                            />
                                        )}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.license_expiry_date?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Controller
                                    name="license_verified"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="checkbox"
                                            id="license_verified"
                                            label="Staff confirmed physical license"
                                            checked={!!field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>
                        </Row>

                        <hr className="my-3" />

                        {/* License photo upload */}
                        <Form.Group>
                            <Form.Label className="fw-semibold">
                                License Photo
                            </Form.Label>
                            <div className="text-muted small mb-2">
                                Upload a photo or scan of the physical driving
                                license for verification.
                            </div>
                            <Form.Control
                                ref={licensePhotoInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={handleLicensePhotoSelect}
                            />
                            <Form.Text className="text-muted">
                                JPEG, PNG, WebP, or PDF · Max 10MB
                                {isEdit &&
                                    !licensePhotoFile &&
                                    existingLicensePhoto && (
                                        <> · Select new to replace current</>
                                    )}
                            </Form.Text>

                            {/* New file preview */}
                            {licensePhotoFile && (
                                <div className="mt-2">
                                    {licensePhotoIsPdf ? (
                                        <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                                            <FaFilePdf
                                                size={24}
                                                className="text-danger"
                                            />
                                            <span className="small text-truncate">
                                                {licensePhotoFile.name}
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger ms-auto"
                                                onClick={removeLicensePhoto}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        licensePhotoPreview && (
                                            <div
                                                className="position-relative border rounded overflow-hidden d-inline-block"
                                                style={{ maxWidth: 220 }}
                                            >
                                                <img
                                                    src={licensePhotoPreview}
                                                    alt="License Photo"
                                                    className="w-100"
                                                    style={{
                                                        height: 140,
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                                    style={{
                                                        padding:
                                                            '0.1rem 0.4rem',
                                                        lineHeight: 1,
                                                    }}
                                                    onClick={removeLicensePhoto}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Existing in edit mode */}
                            {isEdit &&
                                !licensePhotoFile &&
                                existingLicensePhoto && (
                                    <div className="mt-2">
                                        {existingLicensePhoto.mime_type ===
                                        'application/pdf' ? (
                                            <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                                                <FaFilePdf
                                                    size={24}
                                                    className="text-danger"
                                                />
                                                <a
                                                    href={
                                                        existingLicensePhoto
                                                            .urls.original
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="small"
                                                >
                                                    {
                                                        existingLicensePhoto.file_name
                                                    }
                                                </a>
                                                <span className="badge bg-secondary ms-auto">
                                                    Current
                                                </span>
                                            </div>
                                        ) : (
                                            <div
                                                className="position-relative border rounded overflow-hidden d-inline-block"
                                                style={{ maxWidth: 220 }}
                                            >
                                                <img
                                                    src={
                                                        existingLicensePhoto
                                                            .urls.thumb ??
                                                        existingLicensePhoto
                                                            .urls.original
                                                    }
                                                    alt="License Photo"
                                                    className="w-100"
                                                    style={{
                                                        height: 140,
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                                <span
                                                    className="position-absolute top-0 start-0 m-1 badge bg-secondary"
                                                    style={{
                                                        fontSize: '0.6rem',
                                                    }}
                                                >
                                                    Current
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </Form.Group>
                    </Card.Body>
                </Card>

                {/* Emergency Contact */}
                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Emergency Contact</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        {...register('emergency_contact_name')}
                                        placeholder="Contact name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        {...register('emergency_contact_phone')}
                                        placeholder="Contact phone"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Relation</Form.Label>
                                    <Form.Control
                                        {...register(
                                            'emergency_contact_relation'
                                        )}
                                        placeholder="e.g. Spouse, Sibling"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Service Assignment */}
                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Service Assignment</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Controller
                                    name="available_for_chauffeur"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="checkbox"
                                            id="available_for_chauffeur"
                                            label="Available for Chauffeur Service"
                                            checked={!!field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>
                            <Col md={6}>
                                <Controller
                                    name="available_for_airport"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="checkbox"
                                            id="available_for_airport"
                                            label="Available for Airport Transfers"
                                            checked={!!field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Notes & Status */}
                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Notes & Status</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={10}>
                                <Form.Group>
                                    <Form.Label>Internal Notes</Form.Label>
                                    <Form.Control
                                        {...register('notes')}
                                        as="textarea"
                                        rows={3}
                                        placeholder="Staff notes about this driver..."
                                    />
                                </Form.Group>
                            </Col>
                            <Col
                                md={2}
                                className="d-flex align-items-center pb-1"
                            >
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
                        onClick={() => navigate(ROUTES.DASHBOARD.DRIVERS.ROOT)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Spinner size="sm" className="me-1" />
                                Saving...
                            </>
                        ) : isEdit ? (
                            'Save Changes'
                        ) : (
                            'Create Driver'
                        )}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
