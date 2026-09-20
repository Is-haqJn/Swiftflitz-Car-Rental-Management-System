import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';
import { publicQuoteService } from '@/services/publicQuoteService';
import { getErrorMessage } from '@/shared/libs/utils';
import {
    FaIdCard,
    FaFileArrowUp,
    FaCircleCheck,
    FaCircleXmark,
    FaTriangleExclamation,
    FaXmark,
} from 'react-icons/fa6';

type PageState = 'loading' | 'form' | 'success' | 'expired' | 'error';

function UploadCard({
    label,
    hint,
    icon,
    file,
    inputRef,
    onChange,
    onRemove,
}: {
    label: string;
    hint: string;
    icon: React.ReactNode;
    file: File | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onChange: (f: File | null) => void;
    onRemove: () => void;
}) {
    return (
        <div className="mb-4">
            <p className="fw-semibold mb-2" style={{ fontSize: 14 }}>
                {label}
            </p>

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
                    className="w-100 rounded-3 d-flex flex-column align-items-center justify-content-center py-4 gap-2"
                    style={{
                        border: '1.5px dashed #cbd5e1',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'border-color .15s, background .15s',
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
                        {hint}
                    </span>
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="d-none"
                onChange={e => onChange(e.target.files?.[0] ?? null)}
            />
        </div>
    );
}

function StatusPage({
    icon,
    title,
    message,
}: {
    icon: React.ReactNode;
    title: string;
    message: string;
}) {
    return (
        <div className="d-flex flex-column align-items-center text-center py-5 px-3">
            <div className="mb-4">{icon}</div>
            <h3 className="mb-3 fw-bold">{title}</h3>
            <p className="text-muted mb-5" style={{ maxWidth: 400 }}>
                {message}
            </p>
            <a href="/" className="site-button">
                Back to Home
            </a>
        </div>
    );
}

const ID_TYPE_OPTIONS = [
    { value: 'ghana_card', label: 'Ghana Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'voter_id', label: 'Voter ID' },
    // { value: 'drivers_license', label: "Driver's License" },
    // { value: 'nhis', label: 'NHIS Card' },
    // { value: 'other', label: 'Other' },
];

export default function ReuploadDocuments() {
    const { token } = useParams<{ token: string }>();

    const [pageState, setPageState] = useState<PageState>('loading');
    const titleStr =
        pageState === 'expired'
            ? 'Link Expired'
            : pageState === 'error'
              ? 'Invalid Link'
              : pageState === 'success'
                ? 'Documents Received'
                : 'Upload Your Documents';
    const title = useTitle(titleStr);
    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
    const [idType, setIdType] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [idDocFile, setIdDocFile] = useState<File | null>(null);
    const [passportFile, setPassportFile] = useState<File | null>(null);
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const licenseRef = useRef<HTMLInputElement>(null);
    const idDocRef = useRef<HTMLInputElement>(null);
    const passportRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!token) {
            setPageState('error');
            return;
        }

        publicQuoteService
            .getReuploadInfo(token)
            .then(res => {
                const d = res.data;
                setCustomerName(d?.name ?? '');
                setAddress(d?.address ?? '');
                setLicenseNumber(d?.license_number ?? '');
                setLicenseExpiryDate(d?.license_expiry_date ?? '');
                setIdType(d?.id_type ?? '');
                setIdNumber(d?.id_number ?? '');
                setPageState('form');
            })
            .catch((err: { response?: { status?: number } }) => {
                const status = err?.response?.status;
                if (status === 410) setPageState('expired');
                else setPageState('error');
            });
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError('');

        if (!licenseFile && !idDocFile) {
            setSubmitError(
                "Please upload at least your driver's license and ID document."
            );
            return;
        }
        if (!licenseFile) {
            setSubmitError("Please upload your driver's license (required).");
            return;
        }
        if (!idDocFile) {
            setSubmitError('Please upload your ID document (required).');
            return;
        }

        setIsSubmitting(true);
        try {
            await publicQuoteService.submitReupload(
                token!,
                licenseFile,
                idDocFile,
                {
                    address: address || undefined,
                    license_number: licenseNumber || undefined,
                    license_expiry_date: licenseExpiryDate || undefined,
                    id_type: idType || undefined,
                    id_number: idNumber || undefined,
                    passport_image: passportFile ?? undefined,
                }
            );
            setPageState('success');
        } catch (err: unknown) {
            setSubmitError(
                getErrorMessage(err, 'Something went wrong. Please try again.')
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleRemoveLicense = () => {
        setLicenseFile(null);
        if (licenseRef.current) licenseRef.current.value = '';
    };

    const handleRemoveId = () => {
        setIdDocFile(null);
        if (idDocRef.current) idDocRef.current.value = '';
    };

    const handleRemovePassport = () => {
        setPassportFile(null);
        if (passportRef.current) passportRef.current.value = '';
    };

    if (pageState === 'loading') {
        return (
            <div className="section-full p-t80 p-b50 bg-white">
                <div className="container text-center py-5">
                    <div
                        className="spinner-border text-primary"
                        role="status"
                    />
                </div>
            </div>
        );
    }

    if (pageState === 'expired') {
        return (
            <>
                {title}
                <div className="section-full p-t80 p-b50 bg-white">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-5">
                                <StatusPage
                                    icon={
                                        <FaTriangleExclamation
                                            size={52}
                                            style={{ color: '#f59e0b' }}
                                        />
                                    }
                                    title="Link Expired"
                                    message="This document reupload link has expired. Please contact us and we will send you a new one."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (pageState === 'error') {
        return (
            <>
                {title}
                <div className="section-full p-t80 p-b50 bg-white">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-5">
                                <StatusPage
                                    icon={
                                        <FaCircleXmark
                                            size={52}
                                            style={{ color: '#ef4444' }}
                                        />
                                    }
                                    title="Invalid Link"
                                    message="This link is invalid or has already been used. Please contact us if you need assistance."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (pageState === 'success') {
        return (
            <>
                {title}
                <div className="section-full p-t80 p-b50 bg-white">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-5">
                                <StatusPage
                                    icon={
                                        <FaCircleCheck
                                            size={52}
                                            style={{ color: '#22c55e' }}
                                        />
                                    }
                                    title="Documents Received!"
                                    message={`Thank you${customerName ? `, ${customerName}` : ''}. Our team will review your documents and verify your profile shortly.`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    /* Form */
    return (
        <>
            {title}

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
                    Upload Your Documents
                </h1>
                <p
                    style={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 13,
                        margin: 0,
                    }}
                >
                    Our team has requested updated identity documents. Please
                    upload below.
                </p>
            </div>

            <div style={{ background: '#f8fafc', minHeight: '60vh' }}>
                <div
                    style={{
                        maxWidth: 560,
                        margin: '0 auto',
                        padding: '0 16px 60px',
                        marginTop: -40,
                        position: 'relative',
                    }}
                >
                    <div className="col-12">
                        {/* Greeting card */}
                        <div
                            className="rounded-4 text-center p-4 mb-4"
                            style={{
                                background: '#fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,.08)',
                                borderTop: '3px solid #126dff',
                            }}
                        >
                            <div
                                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                style={{
                                    width: 56,
                                    height: 56,
                                    background: '#eff6ff',
                                }}
                            >
                                <FaFileArrowUp
                                    size={24}
                                    style={{ color: '#126dff' }}
                                />
                            </div>
                            <h4 className="fw-bold mb-1">
                                Hi{customerName ? `, ${customerName}` : ''}!
                            </h4>
                            <p
                                className="text-muted mb-0"
                                style={{ fontSize: 14 }}
                            >
                                Our team has requested updated identity
                                documents. Please upload your driver&apos;s
                                license and/or ID document below.
                            </p>
                        </div>

                        {/* Upload form card */}
                        <div
                            className="rounded-4 p-4"
                            style={{
                                background: '#fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,.08)',
                            }}
                        >
                            {submitError && (
                                <div
                                    className="alert alert-danger d-flex align-items-center gap-2 mb-4 py-2"
                                    style={{ fontSize: 13 }}
                                >
                                    <FaCircleXmark size={14} />
                                    {submitError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <p
                                        className="fw-semibold mb-3"
                                        style={{ fontSize: 13, color: '#374151' }}
                                    >
                                        Personal Information
                                    </p>

                                    <div className="mb-3">
                                        <label
                                            className="form-label"
                                            style={{ fontSize: 13 }}
                                        >
                                            Home Address
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={address}
                                            onChange={e =>
                                                setAddress(e.target.value)
                                            }
                                            placeholder="Enter your home address"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label
                                            className="form-label"
                                            style={{ fontSize: 13 }}
                                        >
                                            License Number
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={licenseNumber}
                                            onChange={e =>
                                                setLicenseNumber(e.target.value)
                                            }
                                            placeholder="Driver's license number"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label
                                            className="form-label"
                                            style={{ fontSize: 13 }}
                                        >
                                            License Expiry Date
                                        </label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={licenseExpiryDate}
                                            onChange={e =>
                                                setLicenseExpiryDate(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label
                                            className="form-label"
                                            style={{ fontSize: 13 }}
                                        >
                                            ID Type
                                        </label>
                                        <select
                                            className="form-select"
                                            value={idType}
                                            onChange={e =>
                                                setIdType(e.target.value)
                                            }
                                        >
                                            <option value="">
                                                Select ID type
                                            </option>
                                            {ID_TYPE_OPTIONS.map(opt => (
                                                <option
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label
                                            className="form-label"
                                            style={{ fontSize: 13 }}
                                        >
                                            ID Number
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={idNumber}
                                            onChange={e =>
                                                setIdNumber(e.target.value)
                                            }
                                            placeholder="ID document number"
                                        />
                                    </div>
                                </div>

                                <UploadCard
                                    label="Driver's License (required)"
                                    hint="JPG, PNG, WEBP or PDF · max 10 MB"
                                    icon={<FaIdCard size={28} />}
                                    file={licenseFile}
                                    inputRef={licenseRef}
                                    onChange={setLicenseFile}
                                    onRemove={handleRemoveLicense}
                                />

                                <UploadCard
                                    label="ID Document - Ghana Card, Passport or Voter ID (required)"
                                    hint="JPG, PNG, WEBP or PDF · max 10 MB"
                                    icon={<FaIdCard size={28} />}
                                    file={idDocFile}
                                    inputRef={idDocRef}
                                    onChange={setIdDocFile}
                                    onRemove={handleRemoveId}
                                />

                                <UploadCard
                                    label="Passport Photo (optional)"
                                    hint="JPG, PNG, WEBP or PDF · max 10 MB"
                                    icon={<FaIdCard size={28} />}
                                    file={passportFile}
                                    inputRef={passportRef}
                                    onChange={setPassportFile}
                                    onRemove={handleRemovePassport}
                                />

                                <button
                                    type="submit"
                                    className="site-button w-100 mt-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? 'Uploading...'
                                        : 'Submit Documents'}
                                </button>
                            </form>
                        </div>

                        <p
                            className="text-center text-muted mt-3"
                            style={{ fontSize: 12 }}
                        >
                            Your documents are transmitted securely and used
                            only for identity verification.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
