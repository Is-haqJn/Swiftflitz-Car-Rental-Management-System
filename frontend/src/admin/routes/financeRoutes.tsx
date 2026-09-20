import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';

const TransactionsList = lazy(() => import('@adminPages/transactions/TransactionsList'));
const TransactionDetail = lazy(() => import('@adminPages/transactions/TransactionDetail'));

export function FinanceRoutes() {
    return (
        <Route path="finance">
            <Route path="transactions">
                <Route
                    index
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.TRANSACTIONS.VIEW_ALL}
                        >
                            <TransactionsList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path=":id"
                    element={
                        <ProtectedRoute
                            permission={PERMISSIONS.TRANSACTIONS.VIEW_ALL}
                        >
                            <TransactionDetail />
                        </ProtectedRoute>
                    }
                />
            </Route>
        </Route>
    );
}
