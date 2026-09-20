import { Routes, Route, Link } from 'react-router-dom';
import AuthLayout from '@/auth/layouts/AuthLayout';
import { ROUTES } from '@/shared/routes';
import { GuestRoute } from '@/shared/routes/GuestRoute';
import { LoginPage } from '@/auth/page/LoginPage';
import { ForgotPasswordPage } from '@/auth/page/ForgotPasswordPage';
import { ResetPasswordPage } from '@/auth/page/ResetPasswordPage';

export const AuthRoutes = () => {
    return (
        <GuestRoute>
            <AuthLayout>
                {/* //? TODO add suspense for loader */}
                <Routes>
                    <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
                    <Route
                        path={ROUTES.AUTH.REGISTER}
                        element={
                            <div>
                                Register Page{' '}
                                <Link to={ROUTES.AUTH.AUTH_LOGIN}>Sign In</Link>
                            </div>
                        }
                    />
                    <Route
                        path={ROUTES.AUTH.FORGOT_PASSWORD}
                        element={<ForgotPasswordPage />}
                    />
                    <Route
                        path={ROUTES.AUTH.RESET_PASSWORD}
                        element={<ResetPasswordPage />}
                    />
                    <Route
                        path={ROUTES.AUTH.VERIFY_EMAIL}
                        element={<div>Verify Email Page</div>}
                    />
                    <Route
                        path={ROUTES.AUTH.VERIFY_EMAIL_TOKEN(':token')}
                        element={<div>Verify Email with Token Page</div>}
                    />
                </Routes>
            </AuthLayout>
        </GuestRoute>
    );
};
