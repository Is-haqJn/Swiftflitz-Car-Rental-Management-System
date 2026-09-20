import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/routes';
import '@adminAssets/index.css';
import '@adminAssets/css/style.css';

export default function Error500() {
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
                            500
                        </h1>
                        <h3 className="error-para mb-2">
                            Internal Server Error
                        </h3>
                        <p className="text-muted mb-4">
                            Something went wrong on our end. Please try again
                            later or contact support.
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
