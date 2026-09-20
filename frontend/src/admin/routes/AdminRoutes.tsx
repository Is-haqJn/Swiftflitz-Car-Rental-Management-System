import { ROUTES } from '@/shared/routes/routes';
import DashboardLayout from '@adminLayouts/DashboardLayout';
import { Link, Route, Routes } from 'react-router-dom';

export const AdminRoutes = () => {
    return (
        <DashboardLayout>
            <Routes>
                <Route
                    index
                    element={
                        <div className="tw-text-primary tw:text-primary tw-text-2xl tw:text-2xl tw-font-bold">
                            Welcome to the Management Dashboard
                            <Link
                                to={ROUTES.LOGIN}
                                className="tw:ml-4 tw:text-blue-500"
                            >
                                Go to Login Page
                            </Link>
                        </div>
                    }
                />

                {/* Users*/}
                <Route path="users" element={<div> Users Page </div>} />
            </Routes>
        </DashboardLayout>
    );
};
