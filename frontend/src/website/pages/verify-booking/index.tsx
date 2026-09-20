// Verify Booking Page - customer clicks the emailed verification link and lands here.
// Route: /verify-booking/:token
// This page marks the token as verified; the original booking tab detects it via polling.

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';
import { publicQuoteService } from '@/services/publicQuoteService';
import { FaCheck, FaClock, FaXmark } from 'react-icons/fa6';

type PageState = 'loading' | 'confirmed' | 'expired' | 'error';

export default function VerifyBookingPage() {
    const { token } = useParams<{ token: string }>();
    const [pageState, setPageState] = useState<PageState>('loading');
    const [customerName, setCustomerName] = useState<string | null>(null);
    const title = useTitle('Identity Confirmed');

    useEffect(() => {
        if (!token) {
            setPageState('error');
            return;
        }
        publicQuoteService
            .confirmVerification(token)
            .then(res => {
                setCustomerName(res.data?.customer_name ?? null);
                setPageState('confirmed');
            })
            .catch((err: unknown) => {
                const status = (err as { response?: { status?: number } })
                    ?.response?.status;
                if (status === 410) {
                    setPageState('expired');
                } else {
                    setPageState('error');
                }
            });
    }, [token]);

    return (
        <>
            {title}
            <div
                style={{
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 16px',
                }}
            >
                <div
                    style={{
                        maxWidth: 480,
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    {pageState === 'loading' && (
                        <>
                            <div
                                className="spinner-border text-primary mb-3"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Verifying…
                                </span>
                            </div>
                            <p className="text-muted">
                                Verifying your identity…
                            </p>
                        </>
                    )}

                    {pageState === 'confirmed' && (
                        <div
                            style={{
                                background: '#fff',
                                border: '1px solid #e9ecef',
                                borderRadius: 16,
                                padding: '48px 40px',
                                boxShadow: '0 4px 24px rgba(0,0,0,.06)',
                            }}
                        >
                            <div
                                style={{
                                    width: 64,
                                    height: 64,
                                    background: '#dcfce7',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    fontSize: 28,
                                }}
                            >
                                <FaCheck style={{ color: '#16a34a' }} />
                            </div>
                            <h2
                                style={{
                                    fontWeight: 700,
                                    fontSize: 22,
                                    color: '#18191d',
                                    marginBottom: 8,
                                }}
                            >
                                Identity Confirmed
                            </h2>
                            {customerName && (
                                <p
                                    style={{
                                        fontSize: 15,
                                        color: '#555',
                                        marginBottom: 20,
                                    }}
                                >
                                    Welcome back,{' '}
                                    <strong>{customerName}</strong>.
                                </p>
                            )}
                            <p
                                style={{
                                    fontSize: 14,
                                    color: '#777',
                                    lineHeight: 1.6,
                                    marginBottom: 0,
                                }}
                            >
                                You can close this tab and continue your booking
                                on your other device.
                            </p>
                        </div>
                    )}

                    {pageState === 'expired' && (
                        <div
                            style={{
                                background: '#fff',
                                border: '1px solid #e9ecef',
                                borderRadius: 16,
                                padding: '48px 40px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 48,
                                    marginBottom: 16,
                                    color: '#f59e0b',
                                }}
                            >
                                <FaClock />
                            </div>
                            <h2
                                style={{
                                    fontWeight: 700,
                                    fontSize: 20,
                                    color: '#18191d',
                                    marginBottom: 8,
                                }}
                            >
                                Link Expired
                            </h2>
                            <p
                                style={{
                                    fontSize: 14,
                                    color: '#777',
                                    marginBottom: 0,
                                }}
                            >
                                This verification link has expired. Please go
                                back to the booking page and request a new one.
                            </p>
                        </div>
                    )}

                    {pageState === 'error' && (
                        <div
                            style={{
                                background: '#fff',
                                border: '1px solid #e9ecef',
                                borderRadius: 16,
                                padding: '48px 40px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 48,
                                    marginBottom: 16,
                                    color: '#dc3545',
                                }}
                            >
                                <FaXmark />
                            </div>
                            <h2
                                style={{
                                    fontWeight: 700,
                                    fontSize: 20,
                                    color: '#18191d',
                                    marginBottom: 8,
                                }}
                            >
                                Invalid Link
                            </h2>
                            <p
                                style={{
                                    fontSize: 14,
                                    color: '#777',
                                    marginBottom: 0,
                                }}
                            >
                                This verification link is invalid or has already
                                been used. Please go back to the booking page
                                and try again.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
