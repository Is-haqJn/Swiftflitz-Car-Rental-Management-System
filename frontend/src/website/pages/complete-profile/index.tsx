// Complete Profile Page - new customer fills in full details after initial booking.
// Route: /complete-profile/:token

import { useState, useEffect, useRef } from 'react';
import DatePickerField from '@adminComponents/DatePickerField';
import ReactDatePicker from 'react-datepicker';
import { format, subYears } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import '@/website/styles/sfBookingCalendar.css';
import { useParams } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';
import { publicQuoteService } from '@/services/publicQuoteService';
import {
    FaTriangleExclamation,
    FaClock,
    FaCheck,
    FaCircleCheck,
    FaFileArrowUp,
    FaIdCard,
    FaShieldHalved,
    FaXmark,
    FaCircleExclamation,
} from 'react-icons/fa6';

type PageState = 'loading' | 'form' | 'success' | 'expired' | 'error';

const ID_TYPE_OPTIONS = [
    { value: 'ghana_card', label: 'Ghana Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'voter_id', label: 'Voter ID' },
    // { value: 'drivers_license', label: "Driver's License" },
    // { value: 'nhis', label: 'NHIS Card' },
    // { value: 'other', label: 'Other' },
];

function UploadCard({
    label,
    hint,
    icon,
    file,
    inputRef,
    onChange,
    onRemove,
    required,
}: {
    label: string;
    hint: string;
    icon: React.ReactNode;
    file: File | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onChange: (f: File | null) => void;
    onRemove: () => void;
    required?: boolean;
}) {
    return (
        <div className="mb-3">
            <label className="form-label" style={{ fontSize: 13 }}>
                {label}{' '}
                {required && <span style={{ color: '#dc3545' }}>*</span>}
                <span
                    style={{
                        fontSize: 11,
                        color: '#aaa',
                        fontWeight: 400,
                        marginLeft: 6,
                    }}
                >
                    {hint}
                </span>
            </label>

            {file ? (
                <div
                    className="d-flex align-items-center gap-3 rounded-3 px-3 py-3"
                    style={{
                        border: '1.5px solid #22c55e',
                        background: '#f0fdf4',
                    }}
                >
                    <FaCircleCheck
                        size={18}
                        style={{ color: '#16a34a', flexShrink: 0 }}
                    />
                    <span
                        className="flex-grow-1 text-truncate"
                        style={{ fontSize: 13, color: '#166534' }}
                    >
                        {file.name}
                    </span>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="btn p-0 d-flex align-items-center"
                        style={{ color: '#dc2626', lineHeight: 1 }}
                        title="Remove file"
                    >
                        <FaXmark size={16} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    className="w-100 rounded-3 d-flex flex-column align-items-center justify-content-center py-3 gap-2"
                    style={{
                        border: '1.5px dashed #cbd5e1',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'border-color .15s, background .15s',
                        minHeight: 90,
                    }}
                    onMouseEnter={e => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.borderColor = '#126dff';
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = '#eff6ff';
                    }}
                    onMouseLeave={e => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.borderColor = '#cbd5e1';
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = '#f8fafc';
                    }}
                    onClick={() => inputRef.current?.click()}
                >
                    <span style={{ color: '#126dff', opacity: 0.8 }}>
                        {icon}
                    </span>
                    <span
                        className="fw-semibold"
                        style={{ fontSize: 13, color: '#334155' }}
                    >
                        Click to upload
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        JPG, PNG, PDF, WebP - max 5MB
                    </span>
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                className="d-none"
                onChange={e => onChange(e.target.files?.[0] ?? null)}
            />
        </div>
    );
}

function formatDobDisplay(dob: string): string {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const [year, month, day] = dob.split('-');
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p
            style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.7px',
                marginBottom: 12,
                marginTop: 2,
            }}
        >
            {children}
        </p>
    );
}

export default function CompleteProfilePage() {
    const { token } = useParams<{ token: string }>();

    const [pageState, setPageState] = useState<PageState>('loading');
    const title = useTitle('Complete Your Profile');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const [dateOfBirth, setDateOfBirth] = useState('');
    const [dobFromApi, setDobFromApi] = useState(false);
    const [altPhone, setAltPhone] = useState('');
    const [address, setAddress] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
    const [licenseImage, setLicenseImage] = useState<File | null>(null);
    const [idType, setIdType] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [idExpiryDate, setIdExpiryDate] = useState('');
    const [idDocument, setIdDocument] = useState<File | null>(null);
    const [passportImage, setPassportImage] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showLicenseConflictModal, setShowLicenseConflictModal] =
        useState(false);

    const licenseImageRef = useRef<HTMLInputElement>(null);
    const idDocumentRef = useRef<HTMLInputElement>(null);
    const passportImageRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!token) {
            setPageState('error');
            return;
        }
        publicQuoteService
            .getProfileData(token)
            .then(res => {
                setCustomerName(res.data.name);
                setCustomerEmail(res.data.email);
                setCustomerPhone(res.data.phone);
                if (res.data.date_of_birth) {
                    setDateOfBirth(res.data.date_of_birth);
                    setDobFromApi(true);
                }
                setPageState('form');
            })
            .catch((err: unknown) => {
                const status = (err as { response?: { status?: number } })
                    ?.response?.status;
                if (status === 410 || status === 404) {
                    setPageState('expired');
                } else {
                    setPageState('error');
                }
            });
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            return;
        }

        setSubmitError('');
        setIsSubmitting(true);

        const fd = new FormData();
        if (dateOfBirth) {
            fd.append('date_of_birth', dateOfBirth);
        }
        if (altPhone.trim()) {
            fd.append('alt_phone', altPhone.trim());
        }
        fd.append('address', address.trim());
        fd.append('license_number', licenseNumber.trim());
        fd.append('license_expiry_date', licenseExpiryDate);
        fd.append('id_type', idType);
        fd.append('id_number', idNumber.trim());
        fd.append('id_expiry_date', idExpiryDate);
        if (licenseImage) {
            fd.append('license_image', licenseImage);
        }
        if (idDocument) {
            fd.append('id_document', idDocument);
        }
        if (passportImage) {
            fd.append('passport_image', passportImage);
        }

        try {
            await publicQuoteService.submitProfile(token, fd);
            setPageState('success');
        } catch (err: unknown) {
            const data = (
                err as {
                    response?: {
                        data?: { license_conflict?: boolean; message?: string };
                    };
                }
            )?.response?.data;
            if (data?.license_conflict) {
                setShowLicenseConflictModal(true);
            } else {
                setSubmitError(
                    data?.message ?? 'Something went wrong. Please try again.'
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid =
        address.trim() &&
        licenseNumber.trim() &&
        licenseExpiryDate &&
        licenseImage &&
        idType &&
        idNumber.trim() &&
        idExpiryDate &&
        idDocument;

    return (
        <>
            {title}

            {/* License Conflict Modal */}
            {showLicenseConflictModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 1050,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                    }}
                    onClick={() => setShowLicenseConflictModal(false)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 12,
                            padding: '32px 28px',
                            maxWidth: 420,
                            width: '100%',
                            boxShadow: '0 20px 60px rgba(0,0,0,.2)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div
                            style={{
                                fontSize: 36,
                                marginBottom: 12,
                                textAlign: 'center',
                                color: '#f59e0b',
                            }}
                        >
                            <FaTriangleExclamation />
                        </div>
                        <h5
                            style={{
                                fontWeight: 700,
                                fontSize: 17,
                                color: '#18191d',
                                marginBottom: 12,
                                textAlign: 'center',
                            }}
                        >
                            License Already Registered
                        </h5>
                        <p
                            style={{
                                fontSize: 13,
                                color: '#555',
                                lineHeight: 1.6,
                                marginBottom: 20,
                                textAlign: 'center',
                            }}
                        >
                            This license number is already registered to another
                            account. Please contact our support team to resolve
                            this.
                        </p>
                        <div
                            style={{
                                background: '#f8f9fa',
                                borderRadius: 8,
                                padding: '12px 16px',
                                marginBottom: 20,
                                fontSize: 13,
                                color: '#374151',
                            }}
                        >
                            <div style={{ marginBottom: 4 }}>
                                <strong>Email:</strong> support@swiftflitz.com
                            </div>
                            <div>
                                <strong>Phone:</strong> +233 XX XXX XXXX
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ width: '100%' }}
                            onClick={() => setShowLicenseConflictModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Page wrapper */}
            <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
                {/* Banner */}
                <div
                    className="overlay-wraper bg-center"
                    style={{
                        background: 'url(/assets/images/banner/banner-13.jpg)',
                        padding: '40px 20px 70px',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: 40,
                            color: 'rgba(255,255,255,0.9)',
                            marginBottom: 12,
                        }}
                    >
                        <FaFileArrowUp />
                    </div>
                    <h1
                        style={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 24,
                            marginBottom: 6,
                        }}
                    >
                        Complete Your Profile
                    </h1>
                    <p
                        style={{
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: 13,
                            margin: 0,
                        }}
                    >
                        Provide the required details to finalize your rental
                        booking.
                    </p>
                </div>

                <div
                    style={{
                        maxWidth: 920,
                        margin: '0 auto',
                        padding: '0 16px 60px',
                        marginTop: -40,
                        position: 'relative',
                    }}
                >
                    {/* Loading */}
                    {pageState === 'loading' && (
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '48px 32px',
                                boxShadow: '0 4px 24px rgba(0,0,0,.08)',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                className="spinner-border text-primary mb-3"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading…
                                </span>
                            </div>
                            <p className="text-muted mb-0">
                                Loading your profile form…
                            </p>
                        </div>
                    )}

                    {/* Expired / Invalid */}
                    {(pageState === 'expired' || pageState === 'error') && (
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '56px 32px',
                                boxShadow: '0 4px 24px rgba(0,0,0,.08)',
                                textAlign: 'center',
                                maxWidth: 480,
                                margin: '0 auto',
                            }}
                        >
                            <div
                                style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    fontSize: 30,
                                    background:
                                        pageState === 'expired'
                                            ? '#fef3c7'
                                            : '#fee2e2',
                                    color:
                                        pageState === 'expired'
                                            ? '#d97706'
                                            : '#dc2626',
                                }}
                            >
                                {pageState === 'expired' ? (
                                    <FaClock />
                                ) : (
                                    <FaCircleExclamation />
                                )}
                            </div>
                            <h2
                                style={{
                                    fontWeight: 700,
                                    fontSize: 22,
                                    color: '#18191d',
                                    marginBottom: 10,
                                }}
                            >
                                {pageState === 'expired'
                                    ? 'Link Expired'
                                    : 'Invalid Link'}
                            </h2>
                            <p
                                style={{
                                    fontSize: 14,
                                    color: '#777',
                                    marginBottom: 20,
                                    lineHeight: 1.6,
                                }}
                            >
                                {pageState === 'expired'
                                    ? 'This profile completion link has expired. Please contact support to receive a new link.'
                                    : 'This link is invalid or has already been used.'}
                            </p>
                            <p
                                style={{
                                    fontSize: 13,
                                    color: '#555',
                                    marginBottom: 0,
                                }}
                            >
                                Contact us at{' '}
                                <strong>support@swiftflitz.com</strong>
                            </p>
                        </div>
                    )}

                    {/* Success */}
                    {pageState === 'success' && (
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '56px 32px',
                                boxShadow: '0 4px 24px rgba(0,0,0,.08)',
                                textAlign: 'center',
                                maxWidth: 480,
                                margin: '0 auto',
                            }}
                        >
                            <div
                                style={{
                                    width: 72,
                                    height: 72,
                                    background: '#dcfce7',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    fontSize: 30,
                                    color: '#16a34a',
                                }}
                            >
                                <FaCheck />
                            </div>
                            <h2
                                style={{
                                    fontWeight: 700,
                                    fontSize: 24,
                                    color: '#18191d',
                                    marginBottom: 10,
                                }}
                            >
                                Profile Submitted!
                            </h2>
                            <p
                                style={{
                                    fontSize: 14,
                                    color: '#555',
                                    lineHeight: 1.6,
                                    marginBottom: 20,
                                }}
                            >
                                Thank you, <strong>{customerName}</strong>! Your
                                details have been received and are under review.
                            </p>
                            <div
                                style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: 10,
                                    padding: '14px 18px',
                                    fontSize: 13,
                                    color: '#1e3a8a',
                                    lineHeight: 1.6,
                                    textAlign: 'left',
                                }}
                            >
                                Our team will verify your documents and reach
                                out if anything is needed. Your vehicle will be
                                ready for pickup on your scheduled date.
                            </div>
                        </div>
                    )}

                    {/* Profile Completion Form */}
                    {pageState === 'form' && (
                        <>
                            {/* Greeting card */}
                            <div
                                style={{
                                    background: '#fff',
                                    borderRadius: 14,
                                    padding: '16px 22px',
                                    boxShadow: '0 2px 12px rgba(0,0,0,.07)',
                                    marginBottom: 14,
                                    borderTop: '4px solid #126dff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                }}
                            >
                                <FaShieldHalved
                                    size={22}
                                    style={{ color: '#126dff', flexShrink: 0 }}
                                />
                                <div>
                                    <p
                                        style={{
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: '#18191d',
                                            marginBottom: 2,
                                        }}
                                    >
                                        Hi
                                        {customerName
                                            ? `, ${customerName}`
                                            : ''}
                                        !
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 12,
                                            color: '#64748b',
                                            margin: 0,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        Please provide your documents below.
                                        Your information is encrypted and only
                                        used for rental verification.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={e => void handleSubmit(e)}>
                                {/* Row 1: Pre-filled info (read-only) */}
                                <div
                                    style={{
                                        background: '#fff',
                                        borderRadius: 14,
                                        padding: '22px 24px',
                                        boxShadow: '0 2px 12px rgba(0,0,0,.07)',
                                        marginBottom: 14,
                                    }}
                                >
                                    <SectionLabel>Booking Details</SectionLabel>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label
                                                className="form-label"
                                                style={{
                                                    fontSize: 12,
                                                    color: '#888',
                                                }}
                                            >
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={customerName}
                                                disabled
                                                style={{
                                                    background: '#f9fafb',
                                                    color: '#6b7280',
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label
                                                className="form-label"
                                                style={{
                                                    fontSize: 12,
                                                    color: '#888',
                                                }}
                                            >
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={customerEmail}
                                                disabled
                                                style={{
                                                    background: '#f9fafb',
                                                    color: '#6b7280',
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label
                                                className="form-label"
                                                style={{
                                                    fontSize: 12,
                                                    color: '#888',
                                                }}
                                            >
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={customerPhone}
                                                disabled
                                                style={{
                                                    background: '#f9fafb',
                                                    color: '#6b7280',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Your Details - address, DOB, alt phone */}
                                <div
                                    style={{
                                        background: '#fff',
                                        borderRadius: 14,
                                        padding: '22px 24px',
                                        boxShadow: '0 2px 12px rgba(0,0,0,.07)',
                                        marginBottom: 14,
                                    }}
                                >
                                    <SectionLabel>Your Details</SectionLabel>
                                    <div className="row g-3">
                                        <div className="col-md-8">
                                            <label className="form-label">
                                                Home Address{' '}
                                                <span
                                                    style={{ color: '#dc3545' }}
                                                >
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter your home address"
                                                value={address}
                                                onChange={e =>
                                                    setAddress(e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">
                                                Additional Phone
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                placeholder="Optional"
                                                value={altPhone}
                                                onChange={e =>
                                                    setAltPhone(e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">
                                                Date of Birth
                                            </label>
                                            {dobFromApi ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formatDobDisplay(dateOfBirth)}
                                                        disabled
                                                        style={{
                                                            background: '#f9fafb',
                                                            color: '#6b7280',
                                                        }}
                                                    />
                                                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, marginBottom: 0 }}>
                                                        Contact support to update your date of birth.
                                                    </p>
                                                </>
                                            ) : (
                                                <ReactDatePicker
                                                    selected={
                                                        dateOfBirth
                                                            ? new Date(dateOfBirth)
                                                            : null
                                                    }
                                                    onChange={(d: Date | null) =>
                                                        setDateOfBirth(
                                                            d ? format(d, 'yyyy-MM-dd') : ''
                                                        )
                                                    }
                                                    showYearDropdown
                                                    dropdownMode="select"
                                                    maxDate={subYears(new Date(), 18)}
                                                    placeholderText="Date of birth (DD/MM/YYYY)"
                                                    dateFormat="dd/MM/yyyy"
                                                    className="form-control sf-datepicker-input"
                                                    calendarClassName="sf-booking-calendar"
                                                    showPopperArrow={false}
                                                    autoComplete="off"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Passport Photo */}
                                <div
                                    style={{
                                        background: '#fff',
                                        borderRadius: 14,
                                        padding: '22px 24px',
                                        boxShadow: '0 2px 12px rgba(0,0,0,.07)',
                                        marginBottom: 14,
                                    }}
                                >
                                    <SectionLabel>Passport Photo (Optional)</SectionLabel>
                                    <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                                        Upload your passport photo page if available. This helps speed up verification.
                                    </p>
                                    <UploadCard
                                        label="Passport Photo Page"
                                        hint="(JPG, PNG, PDF - max 5MB)"
                                        icon={<FaIdCard size={22} />}
                                        file={passportImage}
                                        inputRef={passportImageRef}
                                        onChange={setPassportImage}
                                        onRemove={() => setPassportImage(null)}
                                    />
                                </div>

                                {/* Row 2: Two-column - License + ID side by side */}
                                <div className="row g-3 mb-3">
                                    {/* Driver's License */}
                                    <div className="col-lg-6">
                                        <div
                                            style={{
                                                background: '#fff',
                                                borderRadius: 14,
                                                padding: '22px 24px',
                                                boxShadow:
                                                    '0 2px 12px rgba(0,0,0,.07)',
                                                height: '100%',
                                            }}
                                        >
                                            <SectionLabel>
                                                Driver's License
                                            </SectionLabel>
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    <label className="form-label">
                                                        License Number{' '}
                                                        <span
                                                            style={{
                                                                color: '#dc3545',
                                                            }}
                                                        >
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="e.g. GH-12345678"
                                                        value={licenseNumber}
                                                        onChange={e =>
                                                            setLicenseNumber(
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label">
                                                        License Expiry Date{' '}
                                                        <span
                                                            style={{
                                                                color: '#dc3545',
                                                            }}
                                                        >
                                                            *
                                                        </span>
                                                    </label>
                                                    <DatePickerField
                                                        value={
                                                            licenseExpiryDate
                                                        }
                                                        onChange={
                                                            setLicenseExpiryDate
                                                        }
                                                        placeholder="dd MMM yyyy"
                                                        minDate={new Date()}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <UploadCard
                                                        label="License Image"
                                                        hint="(JPG, PNG, PDF - max 5MB)"
                                                        icon={
                                                            <FaIdCard
                                                                size={22}
                                                            />
                                                        }
                                                        file={licenseImage}
                                                        inputRef={
                                                            licenseImageRef
                                                        }
                                                        onChange={
                                                            setLicenseImage
                                                        }
                                                        onRemove={() =>
                                                            setLicenseImage(
                                                                null
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Valid ID */}
                                    <div className="col-lg-6">
                                        <div
                                            style={{
                                                background: '#fff',
                                                borderRadius: 14,
                                                padding: '22px 24px',
                                                boxShadow:
                                                    '0 2px 12px rgba(0,0,0,.07)',
                                                height: '100%',
                                            }}
                                        >
                                            <SectionLabel>
                                                Valid ID Document
                                            </SectionLabel>
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    <label className="form-label">
                                                        ID Document Type{' '}
                                                        <span
                                                            style={{
                                                                color: '#dc3545',
                                                            }}
                                                        >
                                                            *
                                                        </span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        value={idType}
                                                        onChange={e =>
                                                            setIdType(
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    >
                                                        <option value="">
                                                            Select document type
                                                        </option>
                                                        {ID_TYPE_OPTIONS.map(
                                                            opt => (
                                                                <option
                                                                    key={
                                                                        opt.value
                                                                    }
                                                                    value={
                                                                        opt.value
                                                                    }
                                                                >
                                                                    {opt.label}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                                <div className="col-7">
                                                    <label className="form-label">
                                                        ID Number{' '}
                                                        <span
                                                            style={{
                                                                color: '#dc3545',
                                                            }}
                                                        >
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Enter your ID number"
                                                        value={idNumber}
                                                        onChange={e =>
                                                            setIdNumber(
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="col-5">
                                                    <label className="form-label">
                                                        Expiry Date{' '}
                                                        <span
                                                            style={{
                                                                color: '#dc3545',
                                                            }}
                                                        >
                                                            *
                                                        </span>
                                                    </label>
                                                    <DatePickerField
                                                        value={idExpiryDate}
                                                        onChange={
                                                            setIdExpiryDate
                                                        }
                                                        placeholder="dd MMM yyyy"
                                                        minDate={new Date()}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <UploadCard
                                                        label="ID Document"
                                                        hint="(JPG, PNG, PDF - max 5MB)"
                                                        icon={
                                                            <FaFileArrowUp
                                                                size={22}
                                                            />
                                                        }
                                                        file={idDocument}
                                                        inputRef={idDocumentRef}
                                                        onChange={setIdDocument}
                                                        onRemove={() =>
                                                            setIdDocument(null)
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Error + Submit */}
                                {submitError && (
                                    <div
                                        style={{
                                            background: '#fee2e2',
                                            border: '1px solid #fca5a5',
                                            borderRadius: 8,
                                            padding: '10px 14px',
                                            fontSize: 13,
                                            color: '#991b1b',
                                            marginBottom: 14,
                                        }}
                                    >
                                        {submitError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="site-button dark-bg"
                                    style={{
                                        width: '100%',
                                        opacity:
                                            isSubmitting || !isFormValid
                                                ? 0.6
                                                : 1,
                                        cursor:
                                            isSubmitting || !isFormValid
                                                ? 'not-allowed'
                                                : 'pointer',
                                    }}
                                    disabled={isSubmitting || !isFormValid}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                    borderWidth: 2,
                                                }}
                                            />
                                            Submitting…
                                        </>
                                    ) : (
                                        'Submit Profile Details'
                                    )}
                                </button>

                                <div
                                    className="d-flex align-items-center gap-2 justify-content-center mt-3"
                                    style={{ color: '#94a3b8', fontSize: 12 }}
                                >
                                    <FaShieldHalved size={12} />
                                    <span>
                                        Your information is securely stored and
                                        only used for rental verification.
                                    </span>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
