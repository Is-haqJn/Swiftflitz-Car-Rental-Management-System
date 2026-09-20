import { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import type { Vehicle, VehicleStatus } from '@/shared/types/vehicles.types';
import { useUpdateVehicleStatus } from '@/shared/hooks/queries/useVehicles';
import { FaCircle } from 'react-icons/fa';
import VehicleExpenseModal from '@adminPages/vehicles/VehicleExpenseModal';

interface StatusChangeDropdownProps {
    vehicle: Vehicle;
}

const STATUS_CONFIG: Record<
    VehicleStatus,
    { color: string; label: string; badge: string }
> = {
    available: {
        color: 'text-success',
        label: 'Available',
        badge: 'bg-success',
    },
    rented: { color: 'text-primary', label: 'Rented', badge: 'bg-primary' },
    maintenance: {
        color: 'text-warning',
        label: 'Maintenance',
        badge: 'bg-warning',
    },
    returned: {
        color: 'text-secondary',
        label: 'Returned',
        badge: 'bg-secondary',
    },
    pending_approval: {
        color: 'text-warning',
        label: 'Pending Approval',
        badge: 'bg-warning',
    },
    unavailable: {
        color: 'text-muted',
        label: 'Unavailable',
        badge: 'bg-secondary',
    },
    retired: {
        color: 'text-danger',
        label: 'Retired',
        badge: 'bg-danger',
    },
};

export default function StatusChangeDropdown({
    vehicle,
}: StatusChangeDropdownProps) {
    const [isChanging, setIsChanging] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const updateStatusMutation = useUpdateVehicleStatus();

    const currentStatus = vehicle.status;
    const currentConfig = STATUS_CONFIG[currentStatus];

    const handleStatusChange = async (newStatus: VehicleStatus) => {
        if (newStatus === currentStatus) return;

        // Intercept maintenance → available: open modal instead of direct API call
        if (currentStatus === 'maintenance' && newStatus === 'available') {
            setShowMaintenanceModal(true);
            return;
        }

        setIsChanging(true);
        try {
            await updateStatusMutation.mutateAsync({
                id: vehicle.id,
                status: newStatus,
            });
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <>
            <Dropdown>
                <Dropdown.Toggle
                    variant="link"
                    className="p-0 border-0 text-decoration-none"
                    disabled={isChanging}
                    style={{ boxShadow: 'none' }}
                >
                    <span className={`badge ${currentConfig.badge}`}>
                        {isChanging ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <FaCircle
                                    className="me-1"
                                    style={{ fontSize: 8 }}
                                />
                                {currentConfig.label}
                            </>
                        )}
                    </span>
                </Dropdown.Toggle>

                <Dropdown.Menu
                    popperConfig={{ strategy: 'fixed' }}
                    renderOnMount
                >
                    {(Object.keys(STATUS_CONFIG) as VehicleStatus[]).map(
                        status => (
                            <Dropdown.Item
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                active={status === currentStatus}
                                disabled={status === currentStatus}
                            >
                                <FaCircle
                                    className={`${STATUS_CONFIG[status].color} me-2`}
                                    style={{ fontSize: 8 }}
                                />
                                {STATUS_CONFIG[status].label}
                            </Dropdown.Item>
                        )
                    )}
                </Dropdown.Menu>
            </Dropdown>

            <VehicleExpenseModal
                mode="maintenance"
                show={showMaintenanceModal}
                onHide={() => setShowMaintenanceModal(false)}
                vehicleId={vehicle.id}
                vehicleName={vehicle.name}
                hasPendingDamageSettlement={
                    vehicle.has_pending_damage_settlement ?? false
                }
            />
        </>
    );
}
