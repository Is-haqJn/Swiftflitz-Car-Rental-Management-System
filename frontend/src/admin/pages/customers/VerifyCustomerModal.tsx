import { Badge, Button, Modal, Spinner } from 'react-bootstrap';
import { useVerifyCustomer } from '@/shared/hooks/queries/useCustomers';

// Minimal interface satisfied by both Customer and Rental['customer']
export interface VerifiableCustomer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string | null;
    license_number?: string | null;
    license_expiry_date?: string | null;
    id_type?: string | null;
    id_number?: string | null;
    license_images?: unknown[];
    id_document_images?: unknown[];
}

const REQUIRED_FIELDS: { key: keyof VerifiableCustomer; label: string }[] = [
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'address', label: 'Address' },
    { key: 'license_number', label: 'License Number' },
    { key: 'license_expiry_date', label: 'License Expiry Date' },
    { key: 'id_type', label: 'ID Type' },
    { key: 'id_number', label: 'ID Number' },
    { key: 'license_images', label: 'License Image Upload' },
    { key: 'id_document_images', label: 'ID Document Image Upload' },
];

function getMissingFields(customer: VerifiableCustomer): string[] {
    return REQUIRED_FIELDS.filter(f => {
        const val = customer[f.key];
        if (Array.isArray(val)) return val.length === 0;
        return !val;
    }).map(f => f.label);
}

export default function VerifyCustomerModal({
    show,
    customer,
    onClose,
}: {
    show: boolean;
    customer: VerifiableCustomer;
    onClose: () => void;
}) {
    const { mutate, isPending } = useVerifyCustomer();
    const missing = getMissingFields(customer);
    const allPresent = missing.length === 0;

    const handleVerify = () => {
        mutate(customer.id, { onSuccess: onClose });
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Verify Customer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {allPresent ? (
                    <p className="mb-0">
                        All required information is present. Confirm
                        verification of <strong>{customer.name}</strong>?
                    </p>
                ) : (
                    <>
                        <div className="alert alert-warning py-2 mb-3">
                            <strong>
                                The following required fields are missing or
                                incomplete:
                            </strong>
                            <ul className="mb-0 mt-1 ps-3">
                                {missing.map(label => (
                                    <li key={label}>{label}</li>
                                ))}
                            </ul>
                        </div>
                        <p className="mb-0 small text-muted">
                            You can still verify this customer, but it is
                            recommended to collect the missing information
                            first.
                        </p>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="light" onClick={onClose} disabled={isPending}>
                    Cancel
                </Button>
                <Button
                    variant={allPresent ? 'primary' : 'warning'}
                    onClick={handleVerify}
                    disabled={isPending}
                >
                    {isPending ? (
                        <Spinner animation="border" size="sm" />
                    ) : allPresent ? (
                        'Verify'
                    ) : (
                        'Verify Anyway'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

/* Re-exported helpers for use in table column renderers */
export { getMissingFields };

export function ProfileStatusBadge({
    status,
}: {
    status: string | null | undefined;
}) {
    if (status === 'verified') return <Badge bg="success">Verified</Badge>;
    if (status === 'pending_review')
        return <Badge bg="info">Pending Review</Badge>;
    if (status === 'rejected') return <Badge bg="danger">Rejected</Badge>;
    return (
        <Badge bg="warning" text="dark">
            Incomplete
        </Badge>
    );
}
