import { lazy } from 'react';
import { Route, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PERMISSIONS } from '@/shared/config/permissions';

const AllRentals = lazy(() => import('@adminPages/rentals/AllRentals'));
const ActiveRentals = lazy(() =>
    import('@adminPages/rentals/FilteredRentalsTable').then(m => ({ default: m.ActiveRentals }))
);
const CancelledRentals = lazy(() =>
    import('@adminPages/rentals/FilteredRentalsTable').then(m => ({ default: m.CancelledRentals }))
);
const CompletedRentals = lazy(() =>
    import('@adminPages/rentals/FilteredRentalsTable').then(m => ({ default: m.CompletedRentals }))
);
const ConfirmedRentals = lazy(() =>
    import('@adminPages/rentals/FilteredRentalsTable').then(m => ({ default: m.ConfirmedRentals }))
);
const OverdueRentals = lazy(() =>
    import('@adminPages/rentals/FilteredRentalsTable').then(m => ({ default: m.OverdueRentals }))
);
const PendingRentals = lazy(() =>
    import('@adminPages/rentals/FilteredRentalsTable').then(m => ({ default: m.PendingRentals }))
);
const ReturnedRentals = lazy(() =>
    import('@adminPages/rentals/FilteredRentalsTable').then(m => ({ default: m.ReturnedRentals }))
);
const CreateRental = lazy(() => import('@adminPages/rentals/CreateRental'));
const NewBooking = lazy(() => import('@adminPages/rentals/NewBooking'));
const RentalDetail = lazy(() => import('@adminPages/rentals/RentalDetail'));
const InvoiceReceipt = lazy(() => import('@adminPages/rentals/InvoiceReceipt'));
const AllAdditionalCharges = lazy(() => import('@adminPages/rentals/AdditionalCharges/AllAdditionalCharges'));
const CreateAdditionalCharge = lazy(() => import('@adminPages/rentals/AdditionalCharges/CreateAdditionalCharge'));
const AllRentalLocations = lazy(() => import('@adminPages/rentals/RentalLocations/AllRentalLocations'));
const CreateRentalLocation = lazy(() => import('@adminPages/rentals/RentalLocations/CreateRentalLocation'));
const AllRentalInspections = lazy(() => import('@adminPages/rentals/RentalInspections/AllRentalInspections'));
const AllQuoteRequests = lazy(() => import('@adminPages/rentals/quoterequests/AllQuoteRequests'));
const QuoteSummary = lazy(() => import('@adminPages/rentals/quoterequests/QuoteSummary'));
const AllSecurityDeposits = lazy(() => import('@adminPages/rentals/SecurityDeposits/AllSecurityDeposits'));

export function RentalsRoutes() {
    const navigate = useNavigate();

    return (
        <Route path="rentals">
            {/* All Rentals (index) */}
            <Route
                index
                element={
                    <ProtectedRoute permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <AllRentals />
                    </ProtectedRoute>
                }
            />

            {/* Filtered views */}
            <Route
                path="active"
                element={
                    <ProtectedRoute
                        permission={[
                            PERMISSIONS.RENTALS.VIEW_ALL,
                            PERMISSIONS.RENTALS.MANAGE_ACTIVE,
                        ]}
                    >
                        <ActiveRentals onAdd={() => navigate('new-booking')} />
                    </ProtectedRoute>
                }
            />
            <Route
                path="pending"
                element={
                    <ProtectedRoute
                        permission={[
                            PERMISSIONS.RENTALS.VIEW_ALL,
                            PERMISSIONS.RENTALS.MANAGE_PENDING_BOOKINGS,
                        ]}
                    >
                        <PendingRentals onAdd={() => navigate('new-booking')} />
                    </ProtectedRoute>
                }
            />
            <Route
                path="confirmed"
                element={
                    <ProtectedRoute permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <ConfirmedRentals
                            onAdd={() => navigate('new-booking')}
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="overdue"
                element={
                    <ProtectedRoute
                        permission={[
                            PERMISSIONS.RENTALS.VIEW_ALL,
                            PERMISSIONS.RENTALS.MANAGE_OVERDUE,
                        ]}
                    >
                        <OverdueRentals />
                    </ProtectedRoute>
                }
            />
            <Route
                path="returned"
                element={
                    <ProtectedRoute permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <ReturnedRentals />
                    </ProtectedRoute>
                }
            />
            <Route
                path="pending-approval"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.RENTALS.MANAGE_PENDING_APPROVAL}
                    >
                        <ReturnedRentals />
                    </ProtectedRoute>
                }
            />
            <Route
                path="completed"
                element={
                    <ProtectedRoute permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <CompletedRentals />
                    </ProtectedRoute>
                }
            />
            <Route
                path="cancelled"
                element={
                    <ProtectedRoute permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <CancelledRentals />
                    </ProtectedRoute>
                }
            />

            {/* New Booking (combined customer + rental) */}
            <Route
                path="new-booking"
                element={
                    <ProtectedRoute permission={PERMISSIONS.RENTALS.CREATE}>
                        <NewBooking />
                    </ProtectedRoute>
                }
            />

            {/* Create (existing customer) */}
            <Route
                path="create"
                element={
                    <ProtectedRoute permission={PERMISSIONS.RENTALS.CREATE}>
                        <CreateRental />
                    </ProtectedRoute>
                }
            />

            {/* Additional Charges */}
            <Route path="charges">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.RENTALS.MANAGE_ADDITIONAL_CHARGES
                            }
                        >
                            <AllAdditionalCharges
                                onAdd={() => navigate('create')}
                                onEdit={charge => navigate(`${charge.id}/edit`)}
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="create"
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.RENTALS.MANAGE_ADDITIONAL_CHARGES
                            }
                        >
                            <CreateAdditionalCharge />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path=":id/edit"
                    element={
                        <ProtectedRoute
                            permission={
                                PERMISSIONS.RENTALS.MANAGE_ADDITIONAL_CHARGES
                            }
                        >
                            <CreateAdditionalCharge />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Rental Locations */}
            <Route path="locations">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.RENTALS.VIEW_ALL}
                        >
                            <AllRentalLocations
                                onAdd={() => navigate('create')}
                                onEdit={location =>
                                    navigate(`${location.id}/edit`)
                                }
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="create"
                    element={
                        <ProtectedRoute permission={PERMISSIONS.RENTALS.CREATE}>
                            <CreateRentalLocation />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path=":id/edit"
                    element={
                        <ProtectedRoute permission={PERMISSIONS.RENTALS.EDIT}>
                            <CreateRentalLocation />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Quote Requests */}
            <Route path="quotes">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.RENTALS.VIEW_QUOTES}
                        >
                            <AllQuoteRequests />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path=":quoteId"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.RENTALS.VIEW_QUOTES}
                        >
                            <QuoteSummary />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Inspection Log */}
            <Route
                path="inspections"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.RENTALS.VIEW_INSPECTIONS}
                    >
                        <AllRentalInspections />
                    </ProtectedRoute>
                }
            />

            {/* Security Deposits */}
            <Route
                path="security-deposits"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.RENTALS.MANAGE_SECURITY_DEPOSIT}
                    >
                        <AllSecurityDeposits />
                    </ProtectedRoute>
                }
            />

            {/* Invoice / Receipt */}
            <Route
                path=":id/invoice"
                element={
                    <ProtectedRoute permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <InvoiceReceipt />
                    </ProtectedRoute>
                }
            />

            {/* Rental Detail (wildcard - must be last) */}
            <Route
                path=":id"
                element={
                    <ProtectedRoute permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <RentalDetail />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
