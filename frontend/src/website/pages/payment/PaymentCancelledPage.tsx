import { Link, useSearchParams } from 'react-router-dom';
import { useTitle } from '@/shared/hooks';

export default function PaymentCancelledPage() {
    const title = useTitle('Payment Cancelled');
    const [searchParams] = useSearchParams();
    const reference = searchParams.get('reference');
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const purpose = searchParams.get('purpose');

    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const bookingRef = searchParams.get('booking_ref');

    const tryAgainUrl = (() => {
        if (!type || !id) return '/';
        const qs = new URLSearchParams();
        if (purpose) qs.set('purpose', purpose);
        if (name) qs.set('name', name);
        if (email) qs.set('email', email);
        if (phone) qs.set('phone', phone);
        if (bookingRef) qs.set('booking_ref', bookingRef);
        const query = qs.toString();
        return `/payment/${type}/${id}${query ? `?${query}` : ''}`;
    })();

    return (
        <section
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #fffbeb 0%, #f8f9fa 100%)',
            }}
        >
            {title}
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-5 col-md-7 col-11">
                        <div
                            className="card border-0 shadow-lg text-center p-4 p-md-5"
                            style={{ borderRadius: 20 }}
                        >
                            <div className="mb-4">
                                <div
                                    className="d-inline-flex align-items-center justify-content-center"
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        background:
                                            'linear-gradient(135deg, #f59e0b, #d97706)',
                                    }}
                                >
                                    <i
                                        className="fas fa-exclamation-triangle text-white"
                                        style={{ fontSize: '2rem' }}
                                    />
                                </div>
                            </div>

                            <h3 className="fw-bold mb-2">Payment Cancelled</h3>
                            <p className="text-muted mb-4">
                                Your payment was not completed. No charge has
                                been made to your account.
                            </p>

                            {reference && (
                                <div
                                    className="rounded-3 mb-4"
                                    style={{
                                        background: '#fffbeb',
                                        border: '1px solid #fcd34d',
                                        padding: '10px 16px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#92400e',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            marginBottom: 4,
                                        }}
                                    >
                                        Reference
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 17,
                                            fontWeight: 700,
                                            color: '#b45309',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {reference}
                                    </div>
                                </div>
                            )}

                            <Link
                                to={tryAgainUrl}
                                className="btn btn-primary btn-hover-1 w-100 py-3 mb-2"
                            >
                                <span className="fw-semibold">Try Again</span>
                            </Link>

                            <a
                                href="mailto:support@swiftflitz.com"
                                className="btn btn-outline-secondary w-100"
                            >
                                Contact Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
