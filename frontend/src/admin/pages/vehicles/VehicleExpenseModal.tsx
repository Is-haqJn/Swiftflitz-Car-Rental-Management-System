import { useRef, useState } from 'react';
import { Modal, Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { format } from 'date-fns';
import DatePickerField from '@adminComponents/DatePickerField';
import {
    useStoreVehicleExpense,
    useCompleteMaintenance,
} from '@/shared/hooks/queries/useVehicles';
import { useTusMultiUpload } from '@/shared/hooks/useTusMultiUpload';
import { useCurrency } from '@/shared/hooks/queries/useSettings';
import TusUploadToast from '@/shared/components/ui/TusUploadToast';

interface VehicleExpenseModalProps {
    show: boolean;
    onHide: () => void;
    vehicleId: string;
    vehicleName: string;
    mode: 'petty' | 'maintenance';
    /** When true (maintenance mode only), shows a warning that this will resolve a pending damage settlement */
    hasPendingDamageSettlement?: boolean;
}

export default function VehicleExpenseModal({
    show,
    onHide,
    vehicleId,
    vehicleName,
    mode,
    hasPendingDamageSettlement = false,
}: VehicleExpenseModalProps) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [amount, setAmount] = useState<string>(
        mode === 'maintenance' ? '0.00' : ''
    );
    const [amountError, setAmountError] = useState('');
    const [description, setDescription] = useState('');
    const [expenseDate, setExpenseDate] = useState(today);

    const storeExpense = useStoreVehicleExpense();
    const completeMaintenance = useCompleteMaintenance();

    const tus = useTusMultiUpload({
        endpoint: '/api/v1/uploads/tus',
        entityType: 'vehicle_expense_receipt',
        extraMetadata: { entity_id: vehicleId },
    });

    const isPending =
        storeExpense.isPending ||
        completeMaintenance.isPending ||
        tus.isUploading ||
        tus.hasPending;

    const currency = useCurrency();
    const title =
        mode === 'maintenance'
            ? `Complete Maintenance - ${vehicleName}`
            : `Record Expense - ${vehicleName}`;

    const expenseHeading =
        mode === 'maintenance'
            ? 'Maintenance Expenses'
            : 'Petty or Light Expenses';

    const expenseSubtext =
        mode === 'maintenance'
            ? `Record any costs incurred during the maintenance period (e.g. parts, labour). Leave at ${currency} 0.00 if none.`
            : 'Record a petty or light expense for this vehicle (e.g. roadside purchase, small repair).';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []).slice(0, 3);
        if (files.length > 0) {
            tus.addFiles(files);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        setAmount(mode === 'maintenance' ? '0.00' : '');
        setAmountError('');
        setDescription('');
        setExpenseDate(today);
        tus.clearAll();
        onHide();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedAmount = parseFloat(amount || '0');

        // Guard: pending damage settlement requires a non-zero repair cost
        if (
            mode === 'maintenance' &&
            hasPendingDamageSettlement &&
            parsedAmount <= 0
        ) {
            setAmountError(
                'Enter the repair cost to auto-resolve the pending damage settlement, or settle the rental manually first.'
            );
            return;
        }
        setAmountError('');

        try {
            const tokens = tus.getUploadTokens();

            if (mode === 'petty') {
                await storeExpense.mutateAsync({
                    vehicle_id: vehicleId,
                    type: 'petty',
                    amount: parsedAmount,
                    description: description || undefined,
                    expense_date: expenseDate || undefined,
                    receipt_tus_tokens: tokens.length > 0 ? tokens : undefined,
                });
            } else {
                await completeMaintenance.mutateAsync({
                    vehicleId,
                    payload: {
                        amount: parsedAmount,
                        description: description || undefined,
                        expense_date: expenseDate || undefined,
                        receipt_tus_tokens:
                            tokens.length > 0 ? tokens : undefined,
                    },
                });
            }
            handleClose();
        } catch {
            // errors handled by hook's onError (toast)
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: '1rem' }}>
                        {title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Pending damage settlement warning */}
                    {mode === 'maintenance' && hasPendingDamageSettlement && (
                        <div
                            className="mb-3 p-3 rounded"
                            style={{
                                background: '#fff3cd',
                                borderLeft: '4px solid #dc3545',
                            }}
                        >
                            <div
                                className="fw-semibold mb-1"
                                style={{ color: '#842029' }}
                            >
                                Pending Damage Settlement
                            </div>
                            <div className="small text-muted">
                                This vehicle has a returned rental with an
                                unresolved damage settlement. Enter the
                                confirmed repair cost below - it will be
                                recorded as the final cost and the rental
                                settlement will be auto-resolved. A non-zero
                                amount is required to complete maintenance on
                                this vehicle.
                            </div>
                        </div>
                    )}

                    {/* Expense type heading */}
                    <div
                        className="mb-3 p-3 rounded"
                        style={{
                            background:
                                mode === 'maintenance' ? '#fff8e1' : '#f0f4ff',
                            borderLeft: `4px solid ${mode === 'maintenance' ? '#ffc107' : '#0d6efd'}`,
                        }}
                    >
                        <div
                            className="fw-semibold mb-1"
                            style={{
                                color:
                                    mode === 'maintenance'
                                        ? '#856404'
                                        : '#0d6efd',
                            }}
                        >
                            {expenseHeading}
                        </div>
                        <div className="small text-muted">{expenseSubtext}</div>
                    </div>

                    <Row>
                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>
                                    Amount ({currency})
                                    {mode === 'petty' && (
                                        <span className="text-danger ms-1">
                                            *
                                        </span>
                                    )}
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={amount}
                                    onChange={e => {
                                        setAmount(e.target.value);
                                        setAmountError('');
                                    }}
                                    placeholder="0.00"
                                    required={mode === 'petty'}
                                    isInvalid={!!amountError}
                                />
                                {amountError && (
                                    <Form.Control.Feedback type="invalid">
                                        {amountError}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Expense Date</Form.Label>
                                <DatePickerField
                                    value={expenseDate}
                                    onChange={setExpenseDate}
                                    placeholder="Select date"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12} className="mb-3">
                            <Form.Group>
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={description}
                                    onChange={e =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Optional notes about this expense"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12} className="mb-1">
                            <Form.Group>
                                <Form.Label>
                                    Receipts (optional, max 3)
                                </Form.Label>
                                <Form.Control
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpeg,.jpg,.png,.pdf"
                                    multiple
                                    onChange={handleFileChange}
                                    disabled={tus.isUploading}
                                />
                                <Form.Text className="text-muted">
                                    Accepted: JPEG, PNG, PDF - max 5 MB each.
                                    Select files then click Upload.
                                </Form.Text>
                            </Form.Group>
                            <TusUploadToast
                                files={tus.files}
                                onPause={tus.pauseFile}
                                onResume={tus.resumeFile}
                                onRemove={tus.removeFile}
                            />
                            {tus.hasPending && !tus.isUploading && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="mt-2"
                                    onClick={tus.startAll}
                                >
                                    Upload{' '}
                                    {
                                        tus.files.filter(
                                            f => f.status === 'pending'
                                        ).length
                                    }{' '}
                                    Receipt
                                    {tus.files.filter(
                                        f => f.status === 'pending'
                                    ).length !== 1
                                        ? 's'
                                        : ''}
                                </Button>
                            )}
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-end gap-2">
                    <Button
                        variant="light"
                        onClick={handleClose}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Spinner size="sm" className="me-1" />
                                Saving…
                            </>
                        ) : mode === 'maintenance' ? (
                            'Complete Maintenance'
                        ) : (
                            'Record Expense'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
