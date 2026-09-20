import { ROUTES } from '@/shared/routes/routes';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Routes, Route, Link } from 'react-router-dom';

export const WebsiteRoutes = () => {
    return (
        // TODO: add the public or default layout

        <Routes>
            <Route
                index
                element={
                    <div>
                        <Helmet title={'Home Page'} />
                        <h1>Welcome to the Home Page</h1>
                        <Link to={'/about'}>Go to About Page</Link>
                        <Link to={'/contact'}>Go to Contact Page</Link>
                        <Link to={ROUTES.DASHBOARD}>
                            Go to Management Dashboard
                        </Link>
                    </div>
                }
            />
            <Route
                path="/about"
                element={
                    <div>
                        <Helmet title={'About Page'} />
                        <h1>About Us</h1>
                        <Link to={'/'}>Go to Home Page</Link>
                        <Link to={'/contact'}>Go to Contact Page</Link>
                        <Link to={ROUTES.DASHBOARD}>
                            Go to Management Dashboard
                        </Link>
                    </div>
                }
            />
            <Route
                path="/contact"
                element={
                    <div>
                        <Helmet title={'Contact Page'} />
                        <h1>Contact Us</h1>
                        <Link to={'/'}>Go to Home Page</Link>
                        <Link to={'/about'}>Go to About Page</Link>
                        <Link to={ROUTES.DASHBOARD}>
                            Go to Management Dashboard
                        </Link>
                    </div>
                }
            />
        </Routes>
    );
};
