import { Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useVehicle } from '@/shared/hooks/queries/useVehicles';
import { useTitle } from '@/shared/hooks';
import CreateVehicle from '@adminPages/vehicles/CreateVehicle';
import VehicleImageManager from '@adminPages/vehicles/VehicleImageManager';

export default function EditVehicle() {
    const title = useTitle('Edit Vehicle');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const {
        data: vehicleResponse,
        isLoading,
        isError,
        error,
    } = useVehicle(id!);

    const vehicle = vehicleResponse?.data ?? null;

    //console.log(vehicle)

    if (isLoading) {
        return (
            <>
                {title}
                <SettingsFormSkeleton cards={2} />
            </>
        );
    }

    if (isError || !vehicle) {
        return (
            <Fragment>
                {title}
                <Alert variant="danger">
                    {(error as Error)?.message || 'Vehicle not found.'}
                </Alert>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/management/vehicles')}
                >
                    Back to Vehicles
                </button>
            </Fragment>
        );
    }

    return (
        <>
            {title}
            <div className="pb-4">
                <div className="page-titles mb-3">
                    <h4>Edit Vehicle - {vehicle.name}</h4>
                </div>

                {/* Vehicle Details Form */}
                <CreateVehicle
                    vehicle={vehicle}
                    onSuccess={() => navigate('/management/vehicles')}
                    onCancel={() => navigate('/management/vehicles')}
                />

                {/* Image Manager Section */}
                <div className="mt-4">
                    <VehicleImageManager vehicleId={id!} />
                </div>
            </div>
        </>
    );
}
