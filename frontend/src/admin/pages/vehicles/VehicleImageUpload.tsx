import { Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Button, Spinner } from 'react-bootstrap';
import {
    useVehicle,
    useVehicleImages,
} from '@/shared/hooks/queries/useVehicles';
import VehicleImageManager from '@adminPages/vehicles/VehicleImageManager';

export default function VehicleImageUpload() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: vehicleResponse, isLoading: loadingVehicle } = useVehicle(
        id!
    );
    const { data: imagesResponse } = useVehicleImages(id!);

    const vehicle = vehicleResponse?.data;
    const images = imagesResponse?.data || [];

    const handleFinish = () => {
        navigate('/management/vehicles');
    };

    const handleSkip = () => {
        if (
            window.confirm(
                'Skip uploading images? You can add them later from the edit page.'
            )
        ) {
            navigate('/management/vehicles');
        }
    };

    if (loadingVehicle) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" variant="primary" />
                <span className="ms-2">Loading...</span>
            </div>
        );
    }

    if (!vehicle) {
        return <Alert variant="danger">Vehicle not found.</Alert>;
    }

    return (
        <Fragment>
            {/* Success Alert */}
            <Alert variant="success" className="mb-4">
                <Alert.Heading>Vehicle Created Successfully!</Alert.Heading>
            </Alert>
            {/* Header */}
            <div className="mb-4">
                <h4 className="mb-2">Upload Images for {vehicle.name}</h4>
                <p className="text-muted">
                    Add photos to showcase your vehicle. You can select multiple
                    images at once.
                </p>
            </div>

            {/* Reuse VehicleImageManager */}
            <div className="mb-4">
                <VehicleImageManager vehicleId={id!} showTitle={false} />
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-between align-items-center">
                <Button variant="outline-secondary" onClick={handleSkip}>
                    Skip for Now
                </Button>
                <div className="d-flex gap-2 align-items-center">
                    {images.length === 0 && (
                        <small className="text-muted">
                            Upload at least 1 image to continue
                        </small>
                    )}
                    <Button
                        variant="primary"
                        onClick={handleFinish}
                        disabled={images.length === 0}
                    >
                        {images.length === 0
                            ? 'Upload Images to Continue'
                            : `Finish (${images.length} image${images.length !== 1 ? 's' : ''} uploaded)`}
                    </Button>
                </div>
            </div>
        </Fragment>
    );
}
