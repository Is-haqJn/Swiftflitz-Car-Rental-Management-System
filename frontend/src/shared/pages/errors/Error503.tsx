import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/routes';
import '@adminAssets/index.css';
import '@adminAssets/css/style.css';

export default function Error503() {
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
                        <h1
                            className="error-head tw:text-white!"
                            style={{ fontSize: '6rem', fontWeight: 700 }}
                        >
                            503
                        </h1>
                        <h3 className="error-para mb-2">Service Unavailable</h3>
                        <p className="text-muted mb-4">
                            The service is temporarily unavailable. Please check
                            back shortly.
                        </p>
                        <Link
                            to={ROUTES.DASHBOARD.ROOT}
                            className="btn btn-sm btn-outline-secondary tw:text-white! tw:border-white! tw:hover:bg-white/10! tw:hover:border-white!"
                        >
                            <span>Back to Dashboard</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
