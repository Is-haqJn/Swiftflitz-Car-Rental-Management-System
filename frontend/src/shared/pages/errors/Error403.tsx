import { useNavigate } from 'react-router-dom';
import '@adminAssets/index.css';
import '@adminAssets/css/style.css';

export default function Error403() {
    const navigate = useNavigate();

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
                            403
                        </h1>
                        <h3 className="error-para mb-2">Access Denied</h3>
                        <p className="text-muted mb-4">
                            You don&#39;t have permission to view this resource.
                        </p>
                        <button
                            className="btn btn-sm btn-outline-secondary tw:text-white! tw:border-white! tw:hover:bg-white/10! tw:hover:border-white!"
                            onClick={() => navigate(-1)}
                        >
                            <span>Go Back</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
