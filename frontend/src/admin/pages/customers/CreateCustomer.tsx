// CreateCustomer.tsx
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useEffect, useRef, useState } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import type {
    Customer,
    CreateCustomerData,
} from '@/shared/types/customer.types';
import {
    useCreateCustomer,
    useUpdateCustomer,
    useUploadCustomerDocument,
} from '@/shared/hooks/queries/useCustomers';
import {
    createCustomerSchema,
    type CreateCustomerFormData,
} from '@/shared/libs/customerValidation';
import DatePickerField from '@/admin/components/DatePickerField';
import { applyServerErrors, safeStr } from '@/shared/libs/utils';

/* Props */
interface CustomerFormProps {
    customer?: Customer | null;
    onSuccess?: (customer: Customer) => void;
    onCancel?: () => void;
}

/* Helper: Convert Customer to form defaults */
function customerToFormDefaults(customer: Customer): CreateCustomerFormData {
    return {
        name: safeStr(customer.name),
        email: safeStr(customer.email),
        phone: safeStr(customer.phone),
        alt_phone: safeStr(customer.alt_phone),
        address: safeStr(customer.address),
        date_of_birth: customer.date_of_birth
            ? customer.date_of_birth.substring(0, 10)
            : '',
        license_number: safeStr(customer.license_number),
        license_expiry_date: customer.license_expiry_date
            ? customer.license_expiry_date.substring(0, 10)
            : '',
        id_type: customer.id_type as CreateCustomerFormData['id_type'],
        id_number: safeStr(customer.id_number),
        emergency_contact: customer.emergency_contact ?? undefined,
        notes: safeStr(customer.notes),
        is_blacklisted: Boolean(customer.is_blacklisted),
        blacklist_reason: safeStr(customer.blacklist_reason),
    };
}

/* Main Component */
export default function CreateCustomer({
    customer,
    onSuccess,
    onCancel,
}: CustomerFormProps) {
    const navigate = useNavigate();
    const isEditing = Boolean(customer);

    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();
    const uploadMutation = useUploadCustomerDocument();

    /* File state */
    // Hold selected files in state; uploaded after customer saved

    const licenseInputRef = useRef<HTMLInputElement>(null);
    const idInputRef = useRef<HTMLInputElement>(null);
    const passportInputRef = useRef<HTMLInputElement>(null);

    const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
    const [licensePreviews, setLicensePreviews] = useState<string[]>([]);
    const [idFile, setIdFile] = useState<File | null>(null);
    const [idPreview, setIdPreview] = useState<string>('');
    const [passportFile, setPassportFile] = useState<File | null>(null);
    const [passportPreview, setPassportPreview] = useState<string>('');

    const handleLicenseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        const previews = selected.map(f => URL.createObjectURL(f));
        setLicenseFiles(prev => [...prev, ...selected]);
        setLicensePreviews(prev => [...prev, ...previews]);
        setDocError(null);
        if (licenseInputRef.current) licenseInputRef.current.value = '';
    };

    const removeLicenseFile = (index: number) => {
        URL.revokeObjectURL(licensePreviews[index]);
        setLicenseFiles(prev => prev.filter((_, i) => i !== index));
        setLicensePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (idPreview) URL.revokeObjectURL(idPreview);
        setIdFile(file);
        setIdPreview(URL.createObjectURL(file));
        setDocError(null);
        if (idInputRef.current) idInputRef.current.value = '';
    };

    const removeIdFile = () => {
        if (idPreview) URL.revokeObjectURL(idPreview);
        setIdFile(null);
        setIdPreview('');
    };

    const handlePassportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (passportPreview) URL.revokeObjectURL(passportPreview);
        setPassportFile(file);
        setPassportPreview(URL.createObjectURL(file));
        if (passportInputRef.current) passportInputRef.current.value = '';
    };

    const removePassportFile = () => {
        if (passportPreview) URL.revokeObjectURL(passportPreview);
        setPassportFile(null);
        setPassportPreview('');
    };

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [docError, setDocError] = useState<string | null>(null);

    /* React Hook Form */
    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CreateCustomerFormData>({
        resolver: zodResolver(createCustomerSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            alt_phone: '',
            address: '',
            date_of_birth: '',
            license_number: '',
            license_expiry_date: '',
            id_type: undefined,
            id_number: '',
            emergency_contact: undefined,
            notes: '',
            is_blacklisted: false,
            blacklist_reason: '',
        },
    });

    const isBlacklisted = watch('is_blacklisted');

    /* Pre-fill form when editing */
    useEffect(() => {
        if (customer) {
            reset(customerToFormDefaults(customer));
        }
    }, [customer, reset]);

    /* Submit */
    const onSubmit = async (data: CreateCustomerFormData) => {
        // On create, both documents are mandatory
        if (!isEditing && (licenseFiles.length === 0 || !idFile)) {
            const msg =
                licenseFiles.length === 0 && !idFile
                    ? "Driver's license and ID document are required."
                    : licenseFiles.length === 0
                      ? "Driver's license image is required."
                      : 'ID document image is required.';
            toast.error(msg);
            setDocError(msg);
            return;
        }
        setDocError(null);
        try {
            const payload: CreateCustomerData = {
                name: data.name.trim(),
                email: data.email.trim(),
                phone: data.phone.trim(),
                alt_phone: data.alt_phone?.trim() || undefined,
                address: data.address.trim(),
                date_of_birth: data.date_of_birth || undefined,
                license_number: data.license_number.trim(),
                license_expiry_date: data.license_expiry_date,
                id_type: data.id_type,
                id_number: data.id_number.trim(),
                emergency_contact:
                    data.emergency_contact?.name?.trim() &&
                    data.emergency_contact?.phone?.trim() &&
                    data.emergency_contact?.relationship?.trim()
                        ? {
                              name: data.emergency_contact.name.trim(),
                              phone: data.emergency_contact.phone.trim(),
                              relationship:
                                  data.emergency_contact.relationship.trim(),
                          }
                        : undefined,
                notes: data.notes?.trim() || undefined,
                is_blacklisted: data.is_blacklisted,
                blacklist_reason: data.is_blacklisted
                    ? data.blacklist_reason?.trim() || undefined
                    : undefined,
            };

            const res =
                isEditing && customer
                    ? await updateMutation.mutateAsync({
                          id: customer.id,
                          payload,
                      })
                    : await createMutation.mutateAsync(payload);

            const savedCustomer = res.data;
            const customerId = savedCustomer.id;

            // Upload license images (front + back) after customer is saved
            for (const file of licenseFiles) {
                await uploadMutation.mutateAsync({
                    customerId,
                    collection: 'license',
                    file,
                });
            }

            // Upload ID document after customer is saved
            if (idFile) {
                await uploadMutation.mutateAsync({
                    customerId,
                    collection: 'id_document',
                    file: idFile,
                });
            }

            // Upload passport after customer is saved (optional)
            if (passportFile) {
                await uploadMutation.mutateAsync({
                    customerId,
                    collection: 'passport',
                    file: passportFile,
                });
            }

            if (onSuccess) {
                onSuccess(savedCustomer);
            } else {
                navigate(`/management/customers}`);
            }
        } catch (err) {
            applyServerErrors(err, setError);
            if (axios.isAxiosError(err)) {
                const message = err.response?.data?.message;
                setSubmitError(
                    message || 'Something went wrong. Please try again.'
                );
            } else {
                setSubmitError('Something went wrong. Please try again.');
            }
            console.error('Save failed:', err);
        }
    };

    const isSaving =
        isSubmitting ||
        createMutation.isPending ||
        updateMutation.isPending ||
        uploadMutation.isPending;

    /* Render */
    return (
        <div className="pb-4">
            <Form onSubmit={handleSubmit(onSubmit)}>
                {/* Personal Information */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>Personal Information</Card.Title>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => navigate('/management/customers')}
                        >
                            All Customers
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Full Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('name')}
                                        isInvalid={!!errors.name}
                                        placeholder="e.g. John Doe"
                                    />
                                    {errors.name && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.name.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Email Address{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        {...register('email')}
                                        isInvalid={!!errors.email}
                                        placeholder="e.g. john@example.com"
                                    />
                                    {errors.email && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.email.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Phone Number{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('phone')}
                                        isInvalid={!!errors.phone}
                                        placeholder="e.g. +233 24 000 0000"
                                    />
                                    {errors.phone && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.phone.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Alternate Phone</Form.Label>
                                    <Form.Control
                                        {...register('alt_phone')}
                                        isInvalid={!!errors.alt_phone}
                                        placeholder="Optional"
                                    />
                                    {errors.alt_phone && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.alt_phone.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Date of Birth</Form.Label>
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
                                                placeholder="Select date of birth"
                                                maxDate={new Date()}
                                            />
                                        )}
                                    />
                                    {errors.date_of_birth && (
                                        <div className="invalid-feedback d-block">
                                            {errors.date_of_birth.message}
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Address{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        {...register('address')}
                                        isInvalid={!!errors.address}
                                        placeholder="e.g. 12 Accra Road, East Legon, Accra"
                                    />
                                    {errors.address && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.address.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* License & ID */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>License & Identification</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        License Number{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('license_number')}
                                        isInvalid={!!errors.license_number}
                                        placeholder="e.g. DL-1234567"
                                    />
                                    {errors.license_number && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.license_number.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        License Expiry Date{' '}
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
                                                minDate={new Date()}
                                            />
                                        )}
                                    />
                                    {errors.license_expiry_date && (
                                        <div className="invalid-feedback d-block">
                                            {errors.license_expiry_date.message}
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        ID Type{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Select
                                        className="tw:h-[2.9rem]"
                                        {...register('id_type')}
                                        isInvalid={!!errors.id_type}
                                    >
                                        <option value="">
                                            Select an ID type
                                        </option>
                                        <option value="ghana_card">
                                            Ghana Card
                                        </option>
                                        <option value="passport">
                                            Passport
                                        </option>
                                        <option value="voter_id">
                                            Voter ID
                                        </option>
                                    </Form.Select>
                                    {errors.id_type && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.id_type.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        ID Number{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('id_number')}
                                        isInvalid={!!errors.id_number}
                                        placeholder="e.g. GHA-000000000-0"
                                    />
                                    {errors.id_number && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.id_number.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Document Uploads */}
                <Card className={`mb-4${docError ? ' border-danger' : ''}`}>
                    <Card.Header>
                        <Card.Title>Upload Documents</Card.Title>
                        <small className="text-muted">
                            Required before customer can rent a vehicle
                        </small>
                    </Card.Header>
                    <Card.Body>
                        {docError && (
                            <Alert variant="danger" className="mb-3 py-2">
                                {docError}
                            </Alert>
                        )}
                        {/* Driver's License */}
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                                Driver's License{' '}
                                <span className="text-danger">*</span>
                            </Form.Label>
                            <div className="text-muted small mb-2">
                                Upload both the front and back of the license.
                            </div>
                            <Form.Control
                                ref={licenseInputRef}
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleLicenseSelect}
                            />
                            <Form.Text className="text-muted">
                                JPEG, PNG, or WebP · Max 5MB each
                                {isEditing &&
                                    licenseFiles.length === 0 &&
                                    (customer?.license_images?.length ?? 0) >
                                        0 && (
                                        <>
                                            {' '}
                                            · Select new files to replace
                                            existing
                                        </>
                                    )}
                            </Form.Text>

                            {/* Existing license images (edit mode, no new files chosen yet) */}
                            {isEditing &&
                                licenseFiles.length === 0 &&
                                customer?.license_images &&
                                customer.license_images.length > 0 && (
                                    <Row className="g-2 mt-2">
                                        {customer.license_images.map(doc => (
                                            <Col
                                                key={doc.id}
                                                xs={6}
                                                sm={4}
                                                md={3}
                                            >
                                                <div className="position-relative border rounded overflow-hidden">
                                                    <img
                                                        src={
                                                            doc.urls.thumb ??
                                                            doc.urls.original
                                                        }
                                                        alt={doc.file_name}
                                                        className="w-100"
                                                        style={{
                                                            height: '110px',
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
                                                    <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white px-1">
                                                        <small
                                                            className="d-block text-truncate"
                                                            style={{
                                                                fontSize:
                                                                    '0.65rem',
                                                            }}
                                                        >
                                                            {doc.file_name}
                                                        </small>
                                                    </div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}

                            {/* New license file previews */}
                            {licensePreviews.length > 0 && (
                                <Row className="g-2 mt-2">
                                    {licensePreviews.map((url, i) => (
                                        <Col key={i} xs={6} sm={4} md={3}>
                                            <div className="position-relative border rounded overflow-hidden">
                                                <img
                                                    src={url}
                                                    alt={`License ${i + 1}`}
                                                    className="w-100"
                                                    style={{
                                                        height: '110px',
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
                                                    onClick={() =>
                                                        removeLicenseFile(i)
                                                    }
                                                >
                                                    ×
                                                </button>
                                                <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white px-1">
                                                    <small
                                                        className="d-block text-truncate"
                                                        style={{
                                                            fontSize: '0.65rem',
                                                        }}
                                                    >
                                                        {licenseFiles[i].name}
                                                    </small>
                                                </div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </Form.Group>

                        <hr className="my-3" />

                        {/* Valid ID */}
                        <Form.Group>
                            <Form.Label className="fw-semibold">
                                Valid ID Document{' '}
                                <span className="text-danger">*</span>
                            </Form.Label>
                            <div className="text-muted small mb-2">
                                Upload a clear photo of the ID matching the type
                                selected above (Ghana Card, Passport, or Voter
                                ID).
                            </div>
                            <Form.Control
                                ref={idInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleIdSelect}
                            />
                            <Form.Text className="text-muted">
                                JPEG, PNG, or WebP · Max 5MB
                                {isEditing &&
                                    !idFile &&
                                    (customer?.id_document_images?.length ??
                                        0) > 0 && (
                                        <>
                                            {' '}
                                            · Select a new file to replace
                                            existing
                                        </>
                                    )}
                            </Form.Text>

                            {/* Existing ID document (edit mode, no new file chosen yet) */}
                            {isEditing &&
                                !idFile &&
                                customer?.id_document_images &&
                                customer.id_document_images.length > 0 && (
                                    <Row className="g-2 mt-2">
                                        {customer.id_document_images.map(
                                            doc => (
                                                <Col
                                                    key={doc.id}
                                                    xs={6}
                                                    sm={4}
                                                    md={3}
                                                >
                                                    <div className="position-relative border rounded overflow-hidden">
                                                        <img
                                                            src={
                                                                doc.urls
                                                                    .thumb ??
                                                                doc.urls
                                                                    .original
                                                            }
                                                            alt={doc.file_name}
                                                            className="w-100"
                                                            style={{
                                                                height: '110px',
                                                                objectFit:
                                                                    'cover',
                                                            }}
                                                        />
                                                        <span
                                                            className="position-absolute top-0 start-0 m-1 badge bg-secondary"
                                                            style={{
                                                                fontSize:
                                                                    '0.6rem',
                                                            }}
                                                        >
                                                            Current
                                                        </span>
                                                        <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white px-1">
                                                            <small
                                                                className="d-block text-truncate"
                                                                style={{
                                                                    fontSize:
                                                                        '0.65rem',
                                                                }}
                                                            >
                                                                {doc.file_name}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </Col>
                                            )
                                        )}
                                    </Row>
                                )}

                            {/* New ID file preview */}
                            {idPreview && (
                                <Row className="g-2 mt-2">
                                    <Col xs={6} sm={4} md={3}>
                                        <div className="position-relative border rounded overflow-hidden">
                                            <img
                                                src={idPreview}
                                                alt="ID Document"
                                                className="w-100"
                                                style={{
                                                    height: '110px',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                                style={{
                                                    padding: '0.1rem 0.4rem',
                                                    lineHeight: 1,
                                                }}
                                                onClick={removeIdFile}
                                            >
                                                ×
                                            </button>
                                            <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white px-1">
                                                <small
                                                    className="d-block text-truncate"
                                                    style={{
                                                        fontSize: '0.65rem',
                                                    }}
                                                >
                                                    {idFile?.name}
                                                </small>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Form.Group>

                        <hr className="my-3" />

                        {/* Passport */}
                        <Form.Group>
                            <Form.Label className="fw-semibold">
                                Passport Image{' '}
                                <span className="text-muted fw-normal">
                                    (Optional)
                                </span>
                            </Form.Label>
                            <Form.Control
                                ref={passportInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={handlePassportSelect}
                            />
                            <Form.Text className="text-muted">
                                JPEG, PNG, WebP, or PDF · Max 5MB
                                {isEditing &&
                                    !passportFile &&
                                    (customer?.passport_images?.length ?? 0) >
                                        0 && (
                                        <>
                                            {' '}
                                            · Select a new file to replace
                                            existing
                                        </>
                                    )}
                            </Form.Text>

                            {/* Existing passport (edit mode) */}
                            {isEditing &&
                                !passportFile &&
                                customer?.passport_images &&
                                customer.passport_images.length > 0 && (
                                    <Row className="g-2 mt-2">
                                        {customer.passport_images.map(doc => (
                                            <Col
                                                key={doc.id}
                                                xs={6}
                                                sm={4}
                                                md={3}
                                            >
                                                <div className="position-relative border rounded overflow-hidden">
                                                    <img
                                                        src={
                                                            doc.urls.thumb ??
                                                            doc.urls.original
                                                        }
                                                        alt={doc.file_name}
                                                        className="w-100"
                                                        style={{
                                                            height: '110px',
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
                                                    <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white px-1">
                                                        <small
                                                            className="d-block text-truncate"
                                                            style={{
                                                                fontSize:
                                                                    '0.65rem',
                                                            }}
                                                        >
                                                            {doc.file_name}
                                                        </small>
                                                    </div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}

                            {/* New passport preview */}
                            {passportPreview && (
                                <Row className="g-2 mt-2">
                                    <Col xs={6} sm={4} md={3}>
                                        <div className="position-relative border rounded overflow-hidden">
                                            <img
                                                src={passportPreview}
                                                alt="Passport"
                                                className="w-100"
                                                style={{
                                                    height: '110px',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                                style={{
                                                    padding: '0.1rem 0.4rem',
                                                    lineHeight: 1,
                                                }}
                                                onClick={removePassportFile}
                                            >
                                                ×
                                            </button>
                                            <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white px-1">
                                                <small
                                                    className="d-block text-truncate"
                                                    style={{
                                                        fontSize: '0.65rem',
                                                    }}
                                                >
                                                    {passportFile?.name}
                                                </small>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Form.Group>
                    </Card.Body>
                </Card>

                {/* Emergency Contact */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>
                            Emergency Contact{' '}
                            <span className="text-muted fw-normal fs-6">
                                (Optional)
                            </span>
                        </Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Contact Name</Form.Label>
                                    <Form.Control
                                        {...register('emergency_contact.name')}
                                        isInvalid={
                                            !!errors.emergency_contact?.name
                                        }
                                        placeholder="e.g. Jane Doe"
                                    />
                                    {errors.emergency_contact?.name && (
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.emergency_contact.name
                                                    .message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Contact Phone</Form.Label>
                                    <Form.Control
                                        {...register('emergency_contact.phone')}
                                        isInvalid={
                                            !!errors.emergency_contact?.phone
                                        }
                                        placeholder="e.g. +233 20 000 0000"
                                    />
                                    {errors.emergency_contact?.phone && (
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.emergency_contact.phone
                                                    .message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Relationship</Form.Label>
                                    <Form.Control
                                        {...register(
                                            'emergency_contact.relationship'
                                        )}
                                        isInvalid={
                                            !!errors.emergency_contact
                                                ?.relationship
                                        }
                                        placeholder="e.g. Spouse, Parent, Sibling"
                                    />
                                    {errors.emergency_contact?.relationship && (
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.emergency_contact
                                                    .relationship.message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Additional Information */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>Additional Information</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        {...register('notes')}
                                        placeholder="Any additional notes about this customer..."
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12} className="mb-3">
                                <Controller
                                    name="is_blacklisted"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="switch"
                                            id="is_blacklisted"
                                            label="Blacklist this customer"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="text-danger"
                                        />
                                    )}
                                />
                            </Col>

                            {isBlacklisted && (
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label>
                                            Reason for Blacklisting{' '}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            {...register('blacklist_reason')}
                                            isInvalid={
                                                !!errors.blacklist_reason
                                            }
                                            placeholder="e.g. Returned vehicle with undisclosed damage..."
                                        />
                                        {errors.blacklist_reason && (
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.blacklist_reason
                                                        .message
                                                }
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                    </Card.Body>
                </Card>

                {/* Submit Error */}
                {submitError && (
                    <Alert
                        variant="danger"
                        className="mb-3"
                        onClose={() => setSubmitError(null)}
                        dismissible
                    >
                        {submitError}
                    </Alert>
                )}

                {/* Form Actions */}
                <div className="d-flex justify-content-end gap-2">
                    {onCancel && (
                        <Button
                            variant="light"
                            type="button"
                            onClick={onCancel}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button variant="primary" type="submit" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                />
                                {uploadMutation.isPending
                                    ? 'Uploading Documents...'
                                    : 'Saving...'}
                            </>
                        ) : isEditing ? (
                            'Update Customer'
                        ) : (
                            'Create Customer'
                        )}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
