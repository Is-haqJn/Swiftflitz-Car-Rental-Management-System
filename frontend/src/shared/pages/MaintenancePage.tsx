import { FaTools } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';

interface MaintenancePageProps {
    sessionExpired?: boolean;
}

export default function MaintenancePage({
    sessionExpired = false,
}: MaintenancePageProps) {
    return (
        <div
            className="fix-wrapper"
            id="app-banner"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                backgroundImage: `url(${import.meta.env.BASE_URL}assets/images/error.jpg)`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="container">
                <div className="row justify-content-center align-items-center">
                    <div className="col-xl-6 text-center">
                        <FaTools size={64} className="text-warning mb-4" />
                        <h1
                            className="error-head mb-2 tw:text-white!"
                            style={{ fontSize: '3rem', fontWeight: 700 }}
                        >
                            Under Maintenance
                        </h1>
                        <h3 className="error-para mb-2 tw:text-white!">
                            We&#39;ll be back soon!
                        </h3>
                        <p className="text-muted mb-4">
                            We&#39;re currently performing scheduled maintenance
                            to improve your experience. Please check back
                            shortly.
                        </p>
                        {/* Login page button */}
                        <Link
                            to={ROUTES.AUTH.AUTH_LOGIN}
                            className="btn btn-sm btn-outline-secondary tw:text-white! tw:border-white! tw:hover:bg-white/10! tw:hover:border-white!"
                        >
                            Login
                        </Link>
                        {/* Session expired message */}
                        {sessionExpired && (
                            <div
                                className="alert alert-warning d-inline-block px-4 py-2"
                                role="alert"
                            >
                                <strong>Session expired.</strong> Your previous
                                session has ended. Please sign in again once
                                maintenance is complete.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
