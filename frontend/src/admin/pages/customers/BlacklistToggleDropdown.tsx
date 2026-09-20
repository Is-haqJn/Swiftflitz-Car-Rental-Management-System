// BlacklistToggleDropdown.tsx
import { useState } from 'react';
import { Dropdown, Modal, Button, Form } from 'react-bootstrap';
import type { Customer } from '@/shared/types/customer.types';
import { useToggleBlacklist } from '@/shared/hooks/queries/useCustomers';
import { FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

interface BlacklistToggleDropdownProps {
    customer: Customer;
}

export default function BlacklistToggleDropdown({
    customer,
}: BlacklistToggleDropdownProps) {
    const [isChanging, setIsChanging] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [blacklistReason, setBlacklistReason] = useState('');
    const [error, setError] = useState('');

    const toggleBlacklistMutation = useToggleBlacklist();

    const isBlacklisted = customer.is_blacklisted;

    const handleDropdownClick = () => {
        if (isBlacklisted) {
            // If blacklisted, unblock directly without modal
            handleToggle();
        } else {
            // If active, show modal to ask for reason
            setShowModal(true);
            setBlacklistReason('');
            setError('');
        }
    };

    const handleToggle = async (reason?: string) => {
        setIsChanging(true);
        setError('');

        try {
            await toggleBlacklistMutation.mutateAsync({
                id: customer.id,
                reason: reason,
            });
            setShowModal(false);
            setBlacklistReason('');
        } catch {
            setError('Failed to update blacklist status');
        } finally {
            setIsChanging(false);
        }
    };

    const handleConfirmBlacklist = () => {
        if (!blacklistReason.trim()) {
            setError('Please provide a reason for blacklisting');
            return;
        }
        handleToggle(blacklistReason);
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
                    <span
                        className={`badge ${isBlacklisted ? 'bg-danger' : 'bg-success'}`}
                    >
                        {isChanging ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" />
                                Updating...
                            </>
                        ) : (
                            <>
                                {isBlacklisted ? (
                                    <FaTimesCircle
                                        className="me-1"
                                        style={{ fontSize: 10 }}
                                    />
                                ) : (
                                    <FaCheckCircle
                                        className="me-1"
                                        style={{ fontSize: 10 }}
                                    />
                                )}
                                {isBlacklisted ? 'Blacklisted' : 'Active'}
                            </>
                        )}
                    </span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item
                        onClick={handleDropdownClick}
                        disabled={isChanging}
                    >
                        {isBlacklisted ? (
                            <FaCheckCircle className="text-success me-2" />
                        ) : (
                            <FaTimesCircle className="text-danger me-2" />
                        )}
                        {isBlacklisted
                            ? 'Unblock Customer'
                            : 'Blacklist Customer'}
                    </Dropdown.Item>

                    {isBlacklisted && customer.blacklist_reason && (
                        <>
                            <Dropdown.Divider />
                            <Dropdown.Header>
                                <small className="text-muted">Reason:</small>
                                <div className="small mt-1">
                                    {customer.blacklist_reason}
                                </div>
                            </Dropdown.Header>
                        </>
                    )}
                </Dropdown.Menu>
            </Dropdown>

            {/* Blacklist Reason Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Blacklist Customer</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted">
                        You are about to blacklist{' '}
                        <strong>{customer.name}</strong>. Please provide a
                        reason:
                    </p>

                    <Form.Group>
                        <Form.Label>
                            Reason for Blacklisting{' '}
                            <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={blacklistReason}
                            onChange={e => {
                                setBlacklistReason(e.target.value);
                                setError('');
                            }}
                            placeholder="e.g., Returned vehicle with undisclosed damage..."
                            isInvalid={!!error}
                        />
                        <Form.Control.Feedback type="invalid">
                            {error}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                        disabled={isChanging}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirmBlacklist}
                        disabled={isChanging}
                    >
                        {isChanging ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" />
                                Blacklisting...
                            </>
                        ) : (
                            'Blacklist Customer'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
