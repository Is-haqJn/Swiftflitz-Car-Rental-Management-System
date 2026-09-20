import { Routes, Route } from 'react-router-dom';
import AuthLayout from '@/auth/layouts/AuthLayout';
import { ROUTES } from '@/shared/routes/routes';

export const AuthRoutes = () => {
    return (
        <AuthLayout>
            {/* //? TODO add suspense for loader */}
            <Routes>
                <Route
                    path={ROUTES.LOGIN}
                    element={<div className="tw:text-red!">Login Page</div>}
                />
                <Route
                    path={ROUTES.REGISTER}
                    element={<div>Register Page</div>}
                />
                <Route
                    path={ROUTES.FORGOT_PASSWORD}
                    element={<div>Forgot Password Page</div>}
                />
                <Route
                    path={ROUTES.RESET_PASSWORD}
                    element={<div>Reset Password Page</div>}
                />
                <Route
                    path={ROUTES.VERIFY_EMAIL}
                    element={<div>Verify Email Page</div>}
                />
                <Route
                    path={ROUTES.VERIFY_EMAIL_TOKEN}
                    element={<div>Verify Email with Token Page</div>}
                />
            </Routes>
        </AuthLayout>
    );
};
