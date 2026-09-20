import { Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Button } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useCategory } from '@/shared/hooks/queries/useCategories';
import { useTitle } from '@/shared/hooks';
import CategoryForm from '@adminPages/vehicles/CategoryForm';

export default function EditCategory() {
    const title = useTitle('Edit Category');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: categoryData, isLoading, isError } = useCategory(id!);

    const category = categoryData?.data;

    if (isLoading) {
        return (
            <>
                {title}
                <SettingsFormSkeleton />
            </>
        );
    }

    if (isError || !category) {
        return (
            <Fragment>
                {title}
                <Alert variant="danger">Category not found.</Alert>
                <Button
                    variant="primary"
                    onClick={() => navigate('/management/categories')}
                >
                    Back to Categories
                </Button>
            </Fragment>
        );
    }

    return (
        <>
            {title}
            <CategoryForm
                category={category}
                onSuccess={() => navigate('/management/categories')}
                onCancel={() => navigate('/management/categories')}
            />
        </>
    );
}
