import { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { FaTriangleExclamation } from 'react-icons/fa6';
import type { QuoteRequest } from '@/shared/types/rental.types';
import { useResolveConflict } from '@/shared/hooks/queries/useQuotes';

interface Props {
    quote: QuoteRequest;
}

export default function ConflictReviewCard({ quote }: Props) {
    const [confirmAction, setConfirmAction] = useState<
        'update_and_proceed' | 'merge_and_proceed' | 'reject' | null
    >(null);

    const resolve = useResolveConflict(quote.id);

    const pending = quote.pending_customer_data ?? {};
    const conflicting = quote.conflicting_customer;
    const isScenarioB = quote.conflict_type === 'license_mismatch';
    const isScenarioC = quote.conflict_type === 'license_registered';

    function handleConfirm() {
        if (!confirmAction) return;
        resolve.mutate(confirmAction, {
            onSuccess: () => setConfirmAction(null),
        });
    }

    return (
        <Card className="border-danger mb-4">
            <Card.Header className="bg-danger bg-opacity-10 border-danger d-flex align-items-center gap-2">
                <span className="text-danger fw-semibold">
                    <FaTriangleExclamation className="me-1" /> Identity Conflict
                    - Needs Review
                </span>
                <Badge bg="danger" className="ms-auto">
                    {isScenarioB
                        ? 'License Mismatch'
                        : 'License Already Registered'}
                </Badge>
            </Card.Header>

            <Card.Body>
                {isScenarioB && (
                    <>
                        <Alert variant="warning" className="small mb-3">
                            The email <strong>{quote.email}</strong> exists in
                            the system, but the submitted license number
                            doesn&apos;t match the one on record. This may be
                            the same person with a new license, or a data issue
                            worth investigating.
                        </Alert>
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <div className="border rounded p-3 h-100">
                                    <p className="fw-semibold text-muted small mb-2 text-uppercase">
                                        Submitted Details
                                    </p>
                                    <table className="w-100 small">
                                        <tbody>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    Name
                                                </td>
                                                <td className="fw-semibold">
                                                    {pending.customer_name ??
                                                        '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    License
                                                </td>
                                                <td className="fw-semibold text-danger">
                                                    {pending.license_number ??
                                                        '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    License Expiry
                                                </td>
                                                <td className="fw-semibold">
                                                    {pending.license_expiry_date ??
                                                        '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    ID Type
                                                </td>
                                                <td className="fw-semibold">
                                                    {pending.id_type ?? '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    ID Number
                                                </td>
                                                <td className="fw-semibold">
                                                    {pending.id_number ?? '-'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="border rounded p-3 h-100">
                                    <p className="fw-semibold text-muted small mb-2 text-uppercase">
                                        Existing Record
                                    </p>
                                    <table className="w-100 small">
                                        <tbody>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    Name
                                                </td>
                                                <td className="fw-semibold">
                                                    {conflicting?.name ?? '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    Email
                                                </td>
                                                <td className="fw-semibold">
                                                    {conflicting?.email ??
                                                        quote.email}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    License
                                                </td>
                                                <td className="fw-semibold text-warning">
                                                    {conflicting?.license_number ??
                                                        '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    Profile Status
                                                </td>
                                                <td>
                                                    <Badge
                                                        bg="secondary"
                                                        className="text-capitalize"
                                                    >
                                                        {conflicting?.profile_status?.replace(
                                                            '_',
                                                            ' '
                                                        ) ?? '-'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Col>
                        </Row>
                    </>
                )}

                {isScenarioC && (
                    <>
                        <Alert variant="danger" className="small mb-3">
                            License <strong>{pending.license_number}</strong> is
                            already registered to a different account. This may
                            be the same person using a different email, or a
                            potential fraud risk.
                        </Alert>
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <div className="border rounded p-3 h-100">
                                    <p className="fw-semibold text-muted small mb-2 text-uppercase">
                                        Submitted Details
                                    </p>
                                    <table className="w-100 small">
                                        <tbody>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    Name
                                                </td>
                                                <td className="fw-semibold">
                                                    {pending.customer_name ??
                                                        '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    Email
                                                </td>
                                                <td className="fw-semibold text-danger">
                                                    {quote.email}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    License
                                                </td>
                                                <td className="fw-semibold">
                                                    {pending.license_number ??
                                                        '-'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="border rounded p-3 h-100">
                                    <p className="fw-semibold text-muted small mb-2 text-uppercase">
                                        Existing Account (License Owner)
                                    </p>
                                    <table className="w-100 small">
                                        <tbody>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    Name
                                                </td>
                                                <td className="fw-semibold">
                                                    {conflicting?.name ?? '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    Email
                                                </td>
                                                <td className="fw-semibold text-warning">
                                                    {conflicting?.email ?? '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    Phone
                                                </td>
                                                <td className="fw-semibold">
                                                    {conflicting?.phone ?? '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted pe-3 py-1">
                                                    Profile Status
                                                </td>
                                                <td>
                                                    <Badge
                                                        bg="secondary"
                                                        className="text-capitalize"
                                                    >
                                                        {conflicting?.profile_status?.replace(
                                                            '_',
                                                            ' '
                                                        ) ?? '-'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Col>
                        </Row>
                    </>
                )}

                {/* Confirmation prompt */}
                {confirmAction && (
                    <Alert
                        variant={
                            confirmAction === 'reject' ? 'danger' : 'warning'
                        }
                        className="mb-3"
                    >
                        <p className="mb-2 fw-semibold">
                            {confirmAction === 'update_and_proceed' &&
                                "Update the existing customer's license and create the rental?"}
                            {confirmAction === 'merge_and_proceed' &&
                                'Link this booking to the existing customer account and create the rental?'}
                            {confirmAction === 'reject' &&
                                'Cancel this quote? This cannot be undone.'}
                        </p>
                        <div className="d-flex gap-2">
                            <Button
                                variant={
                                    confirmAction === 'reject'
                                        ? 'danger'
                                        : 'warning'
                                }
                                size="sm"
                                onClick={handleConfirm}
                                disabled={resolve.isPending}
                            >
                                {resolve.isPending ? (
                                    <>
                                        <Spinner size="sm" className="me-1" />
                                        Processing…
                                    </>
                                ) : (
                                    'Confirm'
                                )}
                            </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setConfirmAction(null)}
                                disabled={resolve.isPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Alert>
                )}

                {!confirmAction && (
                    <div className="d-flex gap-2">
                        {isScenarioB && (
                            <Button
                                variant="primary"
                                onClick={() =>
                                    setConfirmAction('update_and_proceed')
                                }
                                disabled={resolve.isPending}
                            >
                                Update &amp; Proceed
                            </Button>
                        )}
                        {isScenarioC && (
                            <Button
                                variant="primary"
                                onClick={() =>
                                    setConfirmAction('merge_and_proceed')
                                }
                                disabled={resolve.isPending}
                            >
                                Merge &amp; Proceed
                            </Button>
                        )}
                        <Button
                            variant="outline-danger"
                            onClick={() => setConfirmAction('reject')}
                            disabled={resolve.isPending}
                        >
                            Reject
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}
