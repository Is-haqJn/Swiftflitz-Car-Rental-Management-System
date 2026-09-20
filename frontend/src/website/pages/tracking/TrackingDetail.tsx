import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaLocationDot, FaCircleXmark, FaCalendarDays, FaCar } from 'react-icons/fa6';
import { publicQuoteService } from '@/services/publicQuoteService';
import { format, parseISO } from 'date-fns';

type TrackingData = {
    reference: string;
    status: string;
    payment_status?: string | null;
    vehicle: { name: string; image: string | null };
    pickup_date: string;
    return_date: string;
    pickup_location: string | null;
    dropoff_location: string | null;
};

const STATUS_CONFIG: Record<
    string,
    { bg: string; border: string; dot: string; label: string }
> = {
    confirmed: {
        bg: '#f0fdf4',
        border: '#86efac',
        dot: '#16a34a',
        label: 'Confirmed',
    },
    active: {
        bg: '#eef2ff',
        border: '#c7d2fe',
        dot: '#6366f1',
        label: 'Active',
    },
    overdue: {
        bg: '#fff7ed',
        border: '#fed7aa',
        dot: '#f97316',
        label: 'Overdue',
    },
    completed: {
        bg: '#f8fafc',
        border: '#cbd5e1',
        dot: '#64748b',
        label: 'Completed',
    },
    cancelled: {
        bg: '#fef2f2',
        border: '#fecaca',
        dot: '#ef4444',
        label: 'Cancelled',
    },
    returned: {
        bg: '#f0fdf4',
        border: '#86efac',
        dot: '#16a34a',
        label: 'Returned',
    },
};
const PAYMENT_BADGE: Record<string, { bg: string; label: string }> = {
    pending: { bg: '#ca8a04', label: 'Awaiting Payment' },
    partially_paid: { bg: '#ea580c', label: 'Partially Paid' },
};

const HIDE_PAYMENT_BADGE_STATUSES = ['cancelled', 'completed'];

const DEFAULT_STATUS = {
    bg: '#fefce8',
    border: '#fde68a',
    dot: '#ca8a04',
    label: 'Pending',
};

const outerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f8faff 0%, #eef2ff 60%, #f0fdf4 100%)',
    padding: '100px 16px 60px',
};

export default function TrackingDetail() {
    const { reference } = useParams<{ reference: string }>();
    const [data, setData] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [imgFailed, setImgFailed] = useState(false);

    useEffect(() => {
        if (!reference) return;
        setLoading(true);
        publicQuoteService
            .trackRental(reference)
            .then((res) => {
                setData(res.data);
                setLoading(false);
            })
            .catch(() => {
                setNotFound(true);
                setLoading(false);
            });
    }, [reference]);

    const statusCfg = data
        ? (STATUS_CONFIG[data.status] ?? DEFAULT_STATUS)
        : DEFAULT_STATUS;

    if (loading)
        return (
            <div
                style={{
                    ...outerStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        className="spinner-border text-primary"
                        style={{ width: 40, height: 40 }}
                        role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p style={{ marginTop: 16, color: '#6b7280', fontSize: 14 }}>
                        Looking up your rental...
                    </p>
                </div>
            </div>
        );

    if (notFound || !data)
        return (
            <div
                style={{
                    ...outerStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                        }}
                    >
                        <FaCircleXmark size={30} color="#fff" />
                    </div>
                    <h2
                        style={{
                            fontSize: 22,
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            marginBottom: 8,
                        }}
                    >
                        Rental Not Found
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
                        We could not find a rental with reference{' '}
                        <strong>{reference}</strong>. Please check and try again.
                    </p>
                    <Link
                        to="/track"
                        style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                            color: '#fff',
                            borderRadius: 10,
                            padding: '10px 24px',
                            fontWeight: 600,
                            fontSize: 14,
                            textDecoration: 'none',
                        }}
                    >
                        &larr; Try Another Reference
                    </Link>
                    <div style={{ marginTop: 12 }}>
                        <Link
                            to="/"
                            style={{
                                fontSize: 13,
                                color: '#9ca3af',
                                textDecoration: 'none',
                                fontWeight: 500,
                            }}
                        >
                            or go back home
                        </Link>
                    </div>
                </div>
            </div>
        );

    const fmtDate = (d: string) => {
        try {
            return format(parseISO(d), 'MMM d, yyyy');
        } catch {
            return d;
        }
    };

    return (
        <div style={outerStyle}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
                {/* Status Banner */}
                <div
                    style={{
                        background: statusCfg.bg,
                        border: `1px solid ${statusCfg.border}`,
                        borderLeft: `4px solid ${statusCfg.dot}`,
                        borderRadius: 16,
                        padding: '20px 24px',
                        marginBottom: 16,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                        }}
                    >
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: statusCfg.dot,
                                display: 'inline-block',
                                boxShadow: `0 0 0 3px ${statusCfg.dot}33`,
                            }}
                        />
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: statusCfg.dot,
                            }}
                        >
                            {statusCfg.label}
                        </span>
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            marginBottom: 4,
                            color: '#1e293b',
                        }}
                    >
                        {data.vehicle.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>{data.reference}</div>
                </div>

                {/* Journey Card */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: '0 2px 12px rgba(0,0,0,.07)',
                        marginBottom: 24,
                    }}
                >
                    {/* Vehicle image or placeholder */}
                    {(() => {
                        const paymentBadge =
                            data.payment_status &&
                            PAYMENT_BADGE[data.payment_status] &&
                            !HIDE_PAYMENT_BADGE_STATUSES.includes(data.status)
                                ? PAYMENT_BADGE[data.payment_status]
                                : null;

                        return (
                            <div style={{ position: 'relative' }}>
                                {data.vehicle.image && !imgFailed ? (
                                    <img
                                        src={data.vehicle.image}
                                        alt={data.vehicle.name}
                                        onError={() => setImgFailed(true)}
                                        style={{
                                            width: '100%',
                                            height: 220,
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '100%',
                                            height: 160,
                                            background:
                                                'linear-gradient(135deg,#eef2ff 0%,#f0fdf4 100%)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <FaCar size={32} color="#c7d2fe" />
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: '#a5b4fc',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {data.vehicle.name}
                                        </span>
                                    </div>
                                )}
                                {paymentBadge && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            background: paymentBadge.bg,
                                            color: '#fff',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: '0.05em',
                                            padding: '4px 10px',
                                            borderRadius: 20,
                                            boxShadow: '0 2px 6px rgba(0,0,0,.18)',
                                        }}
                                    >
                                        {paymentBadge.label}
                                    </span>
                                )}
                            </div>
                        );
                    })()}
                    {/* Dates */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 16,
                            padding: '24px 24px 20px',
                            borderBottom: '1px solid #f1f5f9',
                        }}
                    >
                        {[
                            {
                                label: 'Pickup Date',
                                value: fmtDate(data.pickup_date),
                            },
                            {
                                label: 'Return Date',
                                value: fmtDate(data.return_date),
                            },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        marginBottom: 4,
                                    }}
                                >
                                    <FaCalendarDays size={13} color="#6366f1" />
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#9ca3af',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                        }}
                                    >
                                        {label}
                                    </span>
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700 }}>
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Locations */}
                    {[
                        {
                            label: 'Pickup Location',
                            value: data.pickup_location,
                        },
                        {
                            label: 'Drop-off Location',
                            value: data.dropoff_location,
                        },
                    ]
                        .filter((l) => l.value)
                        .map(({ label, value }) => (
                            <div
                                key={label}
                                style={{
                                    padding: '16px 24px',
                                    borderBottom: '1px solid #f1f5f9',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 10,
                                }}
                            >
                                <FaLocationDot
                                    size={15}
                                    color="#6366f1"
                                    style={{ marginTop: 2, flexShrink: 0 }}
                                />
                                <div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#9ca3af',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            marginBottom: 2,
                                        }}
                                    >
                                        {label}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                                        {value}
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>

                {/* Back link */}
                <div style={{ textAlign: 'center' }}>
                    <Link
                        to="/track"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                            color: '#6366f1',
                            textDecoration: 'none',
                            fontWeight: 600,
                            padding: '8px 16px',
                            border: '1px solid #c7d2fe',
                            borderRadius: 8,
                            background: '#fff',
                        }}
                    >
                        &larr; Track another rental
                    </Link>
                </div>
            </div>
        </div>
    );
}
