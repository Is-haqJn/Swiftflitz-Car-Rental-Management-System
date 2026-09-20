import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import type { QuoteRequest } from '@/shared/types/rental.types';
import { useSendQuote } from '@/shared/hooks/queries/useQuotes';
import {
    usePricingSettings,
    useFormatCurrency,
} from '@/shared/hooks/queries/useSettings';
import { formatDate } from '@/shared/libs/utils';

interface Props {
    show: boolean;
    quote: QuoteRequest;
    onHide: () => void;
}

export default function SendQuoteModal({ show, quote, onHide }: Props) {
    const sendQuote = useSendQuote();
    const fmt = useFormatCurrency();
    const { data: pricingSettings } = usePricingSettings();

    const isResend = quote.status === 'sent';
    const expiryHours = pricingSettings?.data?.quote_expiry_hours ?? 48;

    const handleSend = () => {
        sendQuote.mutate(quote.id, { onSuccess: onHide });
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {isResend ? 'Resend' : 'Send'} Quote - {quote.reference}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Customer */}
                <div className="mb-3">
                    <h6 className="text-muted mb-1">Sending to</h6>
                    <div className="fw-semibold">{quote.name}</div>
                    <div className="text-muted">{quote.email}</div>
                </div>

                {/* Vehicle */}
                {quote.vehicle && (
                    <div className="mb-3">
                        <h6 className="text-muted mb-1">Vehicle</h6>
                        <div className="fw-semibold">{quote.vehicle.name}</div>
                        <div className="text-muted">
                            {quote.vehicle.license_plate}
                        </div>
                    </div>
                )}

                {/* Dates */}
                {(quote.pickup_date || quote.return_date) && (
                    <div className="mb-3">
                        <h6 className="text-muted mb-1">Dates</h6>
                        <div>
                            {formatDate(quote.pickup_date)} →{' '}
                            {formatDate(quote.return_date)}
                            {quote.pricing && (
                                <span className="ms-2 text-muted">
                                    ({quote.pricing.rental_days} day
                                    {quote.pricing.rental_days !== 1 ? 's' : ''}
                                    )
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Pricing summary */}
                {quote.pricing && (
                    <div className="mb-3">
                        <h6 className="text-muted mb-1">Quote Summary</h6>
                        <table className="table table-sm table-borderless mb-0">
                            <tbody>
                                <tr>
                                    <td className="text-muted ps-0">
                                        Base cost
                                    </td>
                                    <td className="text-end pe-0">
                                        {fmt(quote.pricing.base_cost)}
                                    </td>
                                </tr>
                                {quote.pricing.additional_charges > 0 && (
                                    <tr>
                                        <td className="text-muted ps-0">
                                            Additional charges
                                        </td>
                                        <td className="text-end pe-0">
                                            {fmt(
                                                quote.pricing.additional_charges
                                            )}
                                        </td>
                                    </tr>
                                )}
                                {quote.pricing.location_charge > 0 && (
                                    <tr>
                                        <td className="text-muted ps-0">
                                            Location charge
                                        </td>
                                        <td className="text-end pe-0">
                                            {fmt(quote.pricing.location_charge)}
                                        </td>
                                    </tr>
                                )}
                                {quote.pricing.tax_amount > 0 && (
                                    <tr>
                                        <td className="text-muted ps-0">Tax</td>
                                        <td className="text-end pe-0">
                                            {fmt(quote.pricing.tax_amount)}
                                        </td>
                                    </tr>
                                )}
                                <tr className="fw-bold">
                                    <td className="ps-0">Total</td>
                                    <td className="text-end pe-0">
                                        {fmt(quote.pricing.total_cost)}
                                    </td>
                                </tr>
                                {quote.pricing.security_deposit_amount > 0 && (
                                    <tr>
                                        <td className="text-muted ps-0">
                                            Security deposit
                                        </td>
                                        <td className="text-end pe-0">
                                            {fmt(
                                                quote.pricing
                                                    .security_deposit_amount
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Expiry notice */}
                <Alert variant="info" className="mb-0 py-2 small">
                    The confirmation link will expire in{' '}
                    <strong>{expiryHours} hours</strong>.
                    {isResend && ' A new link will replace any previous one.'}
                </Alert>
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-end gap-2">
                <Button
                    variant="light"
                    onClick={onHide}
                    disabled={sendQuote.isPending}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSend}
                    disabled={sendQuote.isPending}
                >
                    {sendQuote.isPending ? (
                        <>
                            <Spinner size="sm" className="me-1" />
                            {isResend ? 'Resending…' : 'Sending…'}
                        </>
                    ) : isResend ? (
                        'Resend Quote'
                    ) : (
                        'Send Quote'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
