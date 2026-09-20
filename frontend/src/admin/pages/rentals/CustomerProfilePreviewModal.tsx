import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FaTriangleExclamation } from 'react-icons/fa6';
import type { Rental } from '@/shared/types/rental.types';
import MediaLightbox, {
    type LightboxSlide,
} from '@adminComponents/MediaLightbox';

const ID_TYPE_LABELS: Record<string, string> = {
    ghana_card: 'Ghana Card',
    passport: 'Passport',
    voter_id: 'Voter ID',
    drivers_license: "Driver's License",
    nhis: 'NHIS Card',
    other: 'Other',
};

export default function CustomerProfilePreviewModal({
    show,
    onClose,
    onContinue,
    customer,
}: {
    show: boolean;
    onClose: () => void;
    onContinue: () => void;
    customer: Rental['customer'];
}) {
    const [licenseOpen, setLicenseOpen] = useState(false);
    const [idOpen, setIdOpen] = useState(false);

    if (!customer) {
        return null;
    }

    const isIncomplete = customer.profile_status === 'incomplete';
    const licenseImg = customer.license_images?.[0]?.url;
    const idImg = customer.id_document_images?.[0]?.url;
    const na = <span className="text-muted fst-italic">Not provided</span>;

    const licenseSlides: LightboxSlide[] = (customer.license_images ?? [])
        .map(img => ({ type: 'image' as const, src: img.url }))
        .filter(s => !!s.src);

    const idSlides: LightboxSlide[] = (customer.id_document_images ?? [])
        .map(img => ({ type: 'image' as const, src: img.url }))
        .filter(s => !!s.src);

    return (
        <>
            <Modal show={show} onHide={onClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Customer Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Basic Info */}
                    <h6 className="text-muted text-uppercase small fw-semibold mb-2">
                        Basic Info
                    </h6>
                    <dl className="row mb-3">
                        <dt className="col-sm-4 fw-normal text-muted small">
                            Name
                        </dt>
                        <dd className="col-sm-8 mb-1">{customer.name}</dd>
                        <dt className="col-sm-4 fw-normal text-muted small">
                            Email
                        </dt>
                        <dd className="col-sm-8 mb-1">{customer.email}</dd>
                        <dt className="col-sm-4 fw-normal text-muted small">
                            Phone
                        </dt>
                        <dd className="col-sm-8 mb-0">{customer.phone}</dd>
                    </dl>

                    <hr />

                    {/* Driver's License */}
                    <h6 className="text-muted text-uppercase small fw-semibold mb-2">
                        Driver's License
                    </h6>
                    <dl className="row mb-2">
                        <dt className="col-sm-4 fw-normal text-muted small">
                            License Number
                        </dt>
                        <dd className="col-sm-8 mb-1">
                            {customer.license_number ?? na}
                        </dd>
                        <dt className="col-sm-4 fw-normal text-muted small">
                            Expiry Date
                        </dt>
                        <dd className="col-sm-8 mb-0">
                            {customer.license_expiry_date ?? na}
                        </dd>
                    </dl>
                    {licenseImg ? (
                        <img
                            src={licenseImg}
                            alt="License"
                            className="img-thumbnail mb-3"
                            style={{
                                maxHeight: 180,
                                objectFit: 'contain',
                                cursor: 'zoom-in',
                            }}
                            onClick={() => setLicenseOpen(true)}
                        />
                    ) : (
                        <p className="text-muted small fst-italic mb-3">
                            No license image uploaded
                        </p>
                    )}

                    <hr />

                    {/* ID Document */}
                    <h6 className="text-muted text-uppercase small fw-semibold mb-2">
                        ID Document
                    </h6>
                    <dl className="row mb-2">
                        <dt className="col-sm-4 fw-normal text-muted small">
                            Document Type
                        </dt>
                        <dd className="col-sm-8 mb-1">
                            {customer.id_type
                                ? (ID_TYPE_LABELS[customer.id_type] ??
                                  customer.id_type)
                                : na}
                        </dd>
                        <dt className="col-sm-4 fw-normal text-muted small">
                            ID Number
                        </dt>
                        <dd className="col-sm-8 mb-1">
                            {customer.id_number ?? na}
                        </dd>
                        <dt className="col-sm-4 fw-normal text-muted small">
                            Expiry Date
                        </dt>
                        <dd className="col-sm-8 mb-0">
                            {customer.id_expiry_date ?? na}
                        </dd>
                    </dl>
                    {idImg ? (
                        <img
                            src={idImg}
                            alt="ID Document"
                            className="img-thumbnail mb-2"
                            style={{
                                maxHeight: 180,
                                objectFit: 'contain',
                                cursor: 'zoom-in',
                            }}
                            onClick={() => setIdOpen(true)}
                        />
                    ) : (
                        <p className="text-muted small fst-italic mb-2">
                            No ID document image uploaded
                        </p>
                    )}
                </Modal.Body>

                {isIncomplete && (
                    <div className="alert alert-warning rounded-0 mb-0 border-0 border-top border-warning py-2 px-3 small">
                        <FaTriangleExclamation className="me-1" /> This
                        customer's profile is incomplete. Pickup processing will
                        be blocked.
                    </div>
                )}

                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={onClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={onContinue}>
                        Continue to Pickup →
                    </Button>
                </Modal.Footer>
            </Modal>

            <MediaLightbox
                open={licenseOpen}
                slides={licenseSlides}
                index={0}
                onClose={() => setLicenseOpen(false)}
            />
            <MediaLightbox
                open={idOpen}
                slides={idSlides}
                index={0}
                onClose={() => setIdOpen(false)}
            />
        </>
    );
}
