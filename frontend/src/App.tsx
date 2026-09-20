import { AppProvider } from './shared/providers/AppProvider';
import { Routes, Route } from 'react-router-dom';
import { AdminShell } from './shells/AdminShell';
import { AdminRoutes } from './admin/routes/AdminRoutes';
import { AuthShell } from './shells/AuthShell';
import { AuthRoutes } from './auth/routes/authRoutes';
import { WebsiteShell } from './shells/WebsiteShell';
import { WebsiteRoutes } from './website/routes/websiteRoutes';

function App() {
    return (
        //? TODO: add error boundary
        <AppProvider>
            <Routes>
                {/* Admin Panel */}
                <Route
                    path="/management/dashboard/*"
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
                <Route path="/403" element={<div>403 Forbidden</div>} />
                <Route path="/404" element={<div>404 Not Found</div>} />

                {/* Fallback Route */}
                <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
        </AppProvider>
    );
}

export default App;
