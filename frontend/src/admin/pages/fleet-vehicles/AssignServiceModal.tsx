import { useEffect, useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import type { FleetVehicle } from '@/shared/types/fleetVehicle.types';
import { useAssignFleetVehicleServices } from '@/shared/hooks/queries/useFleetVehicles';
import { useCategories } from '@/shared/hooks/queries/useCategories';
import { useAirportPackages } from '@/shared/hooks/queries/useAirportPackages';

interface Props {
    vehicle: FleetVehicle | null;
    show: boolean;
    onHide: () => void;
}

export default function AssignServiceModal({ vehicle, show, onHide }: Props) {
    const assignMutation = useAssignFleetVehicleServices();
    const { data: categoriesRes } = useCategories();
    const { data: packagesRes } = useAirportPackages({
        per_page: 100,
        is_active: 'true',
    });

    const categories = categoriesRes?.data ?? [];
    const packages = packagesRes?.data ?? [];

    const [chauffeurEnabled, setChauffeurEnabled] = useState(false);
    const [chauffeurCategoryId, setChauffeurCategoryId] = useState('');
    const [chauffeurBasePrice, setChauffeurBasePrice] = useState('');
    const [airportEnabled, setAirportEnabled] = useState(false);
    const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!vehicle || !show) return;

        const assignments = vehicle.service_assignments ?? [];
        const chauffeurA = assignments.find(
            a => a.service_type === 'chauffeur' && a.is_active
        );
        const airportAs = assignments.filter(
            a => a.service_type === 'airport' && a.is_active
        );

        setChauffeurEnabled(!!chauffeurA);
        setChauffeurCategoryId(chauffeurA?.category_id ?? '');
        setChauffeurBasePrice(
            chauffeurA?.base_price != null ? String(chauffeurA.base_price) : ''
        );
        setAirportEnabled(airportAs.length > 0);
        setSelectedPackageIds(
            airportAs.map(a => a.package_id).filter(Boolean) as string[]
        );
        setErrors({});
    }, [vehicle, show]);

    function togglePackage(id: string) {
        setSelectedPackageIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    }

    function validate() {
        const errs: Record<string, string> = {};
        if (chauffeurEnabled) {
            if (!chauffeurCategoryId)
                errs.chauffeur_category_id = 'Vehicle category is required.';
            if (
                !chauffeurBasePrice ||
                isNaN(Number(chauffeurBasePrice)) ||
                Number(chauffeurBasePrice) < 0
            ) {
                errs.chauffeur_base_price = 'A valid base price is required.';
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSubmit() {
        if (!vehicle || !validate()) return;

        assignMutation.mutate(
            {
                id: vehicle.id,
                payload: {
                    chauffeur_enabled: chauffeurEnabled,
                    chauffeur_category_id: chauffeurEnabled
                        ? chauffeurCategoryId
                        : null,
                    chauffeur_base_price: chauffeurEnabled
                        ? Number(chauffeurBasePrice)
                        : null,
                    airport_enabled: airportEnabled,
                    airport_package_ids: airportEnabled
                        ? selectedPackageIds
                        : [],
                },
            },
            { onSuccess: onHide }
        );
    }

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-5">
                    Assign Service
                    {vehicle && (
                        <span className="text-muted fw-normal ms-2 small">
                            - {vehicle.make} {vehicle.model}
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Chauffeur */}
                <div className="mb-4">
                    <Form.Check
                        type="switch"
                        id="chauffeur-enabled"
                        label={
                            <span className="fw-semibold">
                                Chauffeur Service
                            </span>
                        }
                        checked={chauffeurEnabled}
                        onChange={e => {
                            setChauffeurEnabled(e.target.checked);
                            if (!e.target.checked) {
                                setChauffeurCategoryId('');
                                setChauffeurBasePrice('');
                                setErrors(prev => {
                                    const next = { ...prev };
                                    delete next.chauffeur_category_id;
                                    delete next.chauffeur_base_price;
                                    return next;
                                });
                            }
                        }}
                    />

                    {chauffeurEnabled && (
                        <div className="mt-3 ps-2">
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-semibold">
                                    Vehicle Category{' '}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={chauffeurCategoryId}
                                    onChange={e =>
                                        setChauffeurCategoryId(e.target.value)
                                    }
                                    isInvalid={!!errors.chauffeur_category_id}
                                >
                                    <option value="">Select category…</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.chauffeur_category_id}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="small fw-semibold">
                                    Base Price{' '}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    placeholder="0.00"
                                    value={chauffeurBasePrice}
                                    onChange={e =>
                                        setChauffeurBasePrice(e.target.value)
                                    }
                                    isInvalid={!!errors.chauffeur_base_price}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.chauffeur_base_price}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                    )}
                </div>

                <hr />

                {/* Airport Transfer */}
                <div>
                    <Form.Check
                        type="switch"
                        id="airport-enabled"
                        label={
                            <span className="fw-semibold">
                                Airport Transfer
                            </span>
                        }
                        checked={airportEnabled}
                        onChange={e => {
                            setAirportEnabled(e.target.checked);
                            if (!e.target.checked) setSelectedPackageIds([]);
                        }}
                    />

                    {airportEnabled && (
                        <div className="mt-3 ps-2">
                            {packages.length === 0 ? (
                                <p className="text-muted small mb-0">
                                    No active airport packages found.
                                </p>
                            ) : (
                                packages.map(pkg => (
                                    <Form.Check
                                        key={pkg.id}
                                        type="checkbox"
                                        id={`pkg-${pkg.id}`}
                                        label={pkg.name}
                                        checked={selectedPackageIds.includes(
                                            pkg.id
                                        )}
                                        onChange={() => togglePackage(pkg.id)}
                                        className="mb-2"
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onHide}
                    disabled={assignMutation.isPending}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={assignMutation.isPending}
                >
                    {assignMutation.isPending ? (
                        <>
                            <Spinner size="sm" className="me-1" />
                            Saving…
                        </>
                    ) : (
                        'Save'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
