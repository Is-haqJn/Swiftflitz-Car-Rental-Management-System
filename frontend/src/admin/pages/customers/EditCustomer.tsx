// EditCustomer.tsx
import { Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useCustomer } from '@/shared/hooks/queries/useCustomers';
import { useTitle } from '@/shared/hooks';
import CreateCustomer from '@adminPages/customers/CreateCustomer';

export default function EditCustomer() {
    const title = useTitle('Edit Customer');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const {
        data: customerResponse,
        isLoading,
        isError,
        error,
    } = useCustomer(id!);

    // customerService.get() returns ApiResponse<Customer> - .data is Customer directly
    const customer = customerResponse?.data ?? null;

    if (isLoading) {
        return (
            <>
                {title}
                <SettingsFormSkeleton cards={2} />
            </>
        );
    }

    if (isError || !customer) {
        return (
            <Fragment>
                {title}
                <Alert variant="danger">
                    {(error as Error)?.message || 'Customer not found.'}
                </Alert>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/management/customers')}
                >
                    Back to Customers
                </button>
            </Fragment>
        );
    }

    return (
        <Fragment>
            {title}
            <div className="page-titles mb-3">
                <h4>Edit Customer - {customer.name}</h4>
            </div>

            <CreateCustomer
                customer={customer}
                onSuccess={() =>
                    navigate(`/management/customers/${customer.id}`)
                }
                onCancel={() =>
                    navigate(`/management/customers/${customer.id}`)
                }
            />
        </Fragment>
    );
}
