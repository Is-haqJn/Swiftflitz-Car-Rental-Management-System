import { lazy, Suspense } from 'react';
import { AppProvider } from './shared/providers/AppProvider';
import { Routes, Route } from 'react-router-dom';
import { AppBootSkeleton } from './admin/components/skeletons/AppBootSkeleton';
import { WebsiteShell } from './shells/WebsiteShell';
import { WebsiteRoutes } from './website/routes/websiteRoutes';
import Error403 from './shared/pages/errors/Error403';
import Error404 from './shared/pages/errors/Error404';
import Error500 from './shared/pages/errors/Error500';
import Error503 from './shared/pages/errors/Error503';

const AdminShell  = lazy(() => import('./shells/AdminShell').then(m => ({ default: m.AdminShell })));
const AdminRoutes = lazy(() => import('./admin/routes/AdminRoutes').then(m => ({ default: m.AdminRoutes })));
const AuthShell   = lazy(() => import('./shells/AuthShell').then(m => ({ default: m.AuthShell })));
const AuthRoutes  = lazy(() => import('./auth/routes/authRoutes').then(m => ({ default: m.AuthRoutes })));

function App() {
    return (
        //? TODO: add error boundary
        <AppProvider>
            <Suspense fallback={<AppBootSkeleton />}>
            <Routes>
                {/* Admin Panel */}
                <Route
                    path="/management/*"
                    element={
                        <AdminShell>
                            <AdminRoutes />
                        </AdminShell>
                    }
                />

                {/* Auth Pages */}
                <Route
                    path="/auth/*"
                    element={
                        <AuthShell>
                            <AuthRoutes />
                        </AuthShell>
                    }
                />

                {/* Public Website */}

                <Route
                    path="/*"
                    element={
                        <WebsiteShell>
                            <WebsiteRoutes />
                        </WebsiteShell>
                    }
                />

                {/* Error Pages */}
                <Route path="/403" element={<Error403 />} />
                <Route path="/404" element={<Error404 />} />
                <Route path="/500" element={<Error500 />} />
                <Route path="/503" element={<Error503 />} />

                {/* Fallback Route */}
                <Route path="*" element={<Error404 />} />
            </Routes>
            </Suspense>
        </AppProvider>
    );
}

export default App;
