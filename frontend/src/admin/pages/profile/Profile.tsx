import { useEffect, useRef, useMemo } from 'react';
import {
    Card,
    Form,
    Row,
    Col,
    Button,
    Spinner,
    Badge,
    ProgressBar,
} from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm, useWatch } from 'react-hook-form';
import {
    applyServerErrors,
    formatDateTime,
    parseSessionName,
} from '@/shared/libs/utils';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '@/store/slices/authSlice';
import {
    useUpdateProfile,
    useChangePassword,
    useUploadProfilePhoto,
    useRemoveProfilePhoto,
    useSessions,
    useRevokeSession,
} from '@/shared/hooks/queries/useProfile';
import { useTitle } from '@/shared/hooks';
import type {
    UpdateProfileData,
    ChangePasswordData,
    SessionToken,
} from '@/services/profileService';
import {
    FaCamera,
    FaChrome,
    FaFirefox,
    FaSafari,
    FaEdge,
    FaDesktop,
    FaTrashAlt,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaAt,
    FaBuilding,
} from 'react-icons/fa';
import { useConfirm } from '@/shared/hooks/useConfirm';

/* Session Helpers */
function BrowserIcon({ browser }: { browser: string }) {
    const lower = browser.toLowerCase();
    if (lower.includes('chrome')) return <FaChrome className="text-warning" />;
    if (lower.includes('firefox')) return <FaFirefox className="text-danger" />;
    if (lower.includes('safari')) return <FaSafari className="text-info" />;
    if (lower.includes('edge')) return <FaEdge className="text-primary" />;
    return <FaDesktop className="text-muted" />;
}

/* Login Sessions Panel */
function LoginSessionsPanel() {
    const { data: response, isLoading } = useSessions();
    const revokeMutation = useRevokeSession();
    const { confirm } = useConfirm();

    const sessions: SessionToken[] = useMemo(
        () => response?.data ?? [],
        [response]
    );

    const handleRevoke = async (token: SessionToken) => {
        const ok = await confirm({
            title: 'Revoke session?',
            message: `Revoke the session "${token.name}"? This will sign out that device.`,
            confirmText: 'Revoke',
            confirmVariant: 'danger',
        });
        if (ok) revokeMutation.mutate(token.id);
    };

    return (
        <Card>
            <Card.Header className="d-flex align-items-center justify-content-between">
                <Card.Title className="mb-0">Active Login Sessions</Card.Title>
                {!isLoading && (
                    <small className="text-muted">
                        {sessions.length}{' '}
                        {sessions.length === 1 ? 'session' : 'sessions'}
                    </small>
                )}
            </Card.Header>
            <Card.Body className="p-0">
                {isLoading ? (
                    <div className="d-flex justify-content-center py-4">
                        <Spinner animation="border" size="sm" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center text-muted py-5 small">
                        No active sessions found.
                    </div>
                ) : (
                    <ul className="list-group list-group-flush">
                        {sessions.map(token => {
                            const { browser, ip } = parseSessionName(
                                token.name
                            );
                            return (
                                <li
                                    key={token.id}
                                    className="list-group-item px-3 py-3"
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div
                                            className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: 40, height: 40 }}
                                        >
                                            <BrowserIcon browser={browser} />
                                        </div>
                                        <div className="flex-grow-1 min-w-0">
                                            <div className="fw-semibold small">
                                                {browser}
                                            </div>
                                            <div
                                                className="text-muted font-monospace"
                                                style={{ fontSize: 11 }}
                                            >
                                                {ip || '-'}
                                            </div>
                                        </div>
                                        <div
                                            className="text-end flex-shrink-0 me-2 d-none d-sm-block"
                                            style={{ minWidth: 120 }}
                                        >
                                            <div
                                                className="text-muted"
                                                style={{ fontSize: 10 }}
                                            >
                                                LAST USED
                                            </div>
                                            <div className="small">
                                                {token.last_used_at
                                                    ? formatDateTime(
                                                          token.last_used_at
                                                      )
                                                    : 'Never'}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            disabled={revokeMutation.isPending}
                                            onClick={() =>
                                                void handleRevoke(token)
                                            }
                                            title="Revoke session"
                                        >
                                            <FaTrashAlt
                                                style={{ fontSize: 11 }}
                                            />
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card.Body>
        </Card>
    );
}

/* Avatar Upload */
function AvatarUpload() {
    const authUser = useSelector(selectAuthUser);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        mutate: upload,
        isPending,
        uploadProgress,
    } = useUploadProfilePhoto();
    const removeMutation = useRemoveProfilePhoto();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            upload(file);
        }
        e.target.value = '';
    };

    return (
        <div className="d-flex flex-column align-items-center">
            <div className="author-media position-relative">
                {authUser?.profile_photo_url ? (
                    <img
                        src={authUser.profile_photo_url}
                        alt={authUser.name}
                        className="rounded-circle"
                        style={{ width: 90, height: 90, objectFit: 'cover' }}
                    />
                ) : (
                    <div
                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold fs-2"
                        style={{ width: 90, height: 90, flexShrink: 0 }}
                    >
                        {authUser?.name.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="upload-link position-absolute bottom-0 end-0">
                    <button
                        type="button"
                        className="btn btn-sm btn-secondary p-0 d-flex align-items-center justify-content-center rounded-circle"
                        style={{ width: 28, height: 28 }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending || removeMutation.isPending}
                        title="Change photo"
                    >
                        {isPending ? (
                            <Spinner
                                animation="border"
                                size="sm"
                                style={{ width: 12, height: 12 }}
                            />
                        ) : (
                            <FaCamera style={{ fontSize: 11 }} />
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        className="update-flie d-none"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
            {isPending && uploadProgress > 0 && (
                <ProgressBar
                    now={uploadProgress}
                    style={{ height: 3, width: 90 }}
                    variant="primary"
                    className="rounded-pill mt-1"
                />
            )}
            {authUser?.profile_photo_url && (
                <button
                    type="button"
                    className="btn btn-link btn-sm text-danger p-0 mt-1"
                    style={{ fontSize: 11 }}
                    disabled={removeMutation.isPending || isPending}
                    onClick={() => removeMutation.mutate()}
                >
                    {removeMutation.isPending ? 'Removing…' : 'Remove photo'}
                </button>
            )}
        </div>
    );
}

function ProfileInfoForm() {
    const authUser = useSelector(selectAuthUser);
    const updateMutation = useUpdateProfile();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<UpdateProfileData>();

    useEffect(() => {
        if (authUser) {
            reset({
                name: authUser.name,
                email: authUser.email,
                username: authUser.username,
                phone: authUser.phone,
            });
        }
    }, [authUser, reset]);

    const onSubmit = (data: UpdateProfileData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    return (
        <Card>
            <Card.Header>
                <Card.Title>Profile Information</Card.Title>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Full Name</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <FaUser
                                            className="text-muted"
                                            style={{ fontSize: 13 }}
                                        />
                                    </span>
                                    <Form.Control
                                        placeholder="Enter full name"
                                        isInvalid={!!errors.name}
                                        {...register('name')}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </div>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Username</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <FaAt
                                            className="text-muted"
                                            style={{ fontSize: 13 }}
                                        />
                                    </span>
                                    <Form.Control
                                        placeholder="Enter username"
                                        isInvalid={!!errors.username}
                                        {...register('username')}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.username?.message}
                                    </Form.Control.Feedback>
                                </div>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Email Address</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <FaEnvelope
                                            className="text-muted"
                                            style={{ fontSize: 13 }}
                                        />
                                    </span>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter email"
                                        isInvalid={!!errors.email}
                                        {...register('email')}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email?.message}
                                    </Form.Control.Feedback>
                                </div>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Phone Number</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <FaPhone
                                            className="text-muted"
                                            style={{ fontSize: 13 }}
                                        />
                                    </span>
                                    <Form.Control
                                        placeholder="Enter phone number"
                                        isInvalid={!!errors.phone}
                                        {...register('phone')}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.phone?.message}
                                    </Form.Control.Feedback>
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending
                                ? 'Saving...'
                                : 'Save Changes'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

/* Change Password Form */
function ChangePasswordForm() {
    const changeMutation = useChangePassword();

    const {
        register,
        handleSubmit,
        reset,
        control,
        setError,
        formState: { errors },
    } = useForm<ChangePasswordData>();

    const newPassword = useWatch({ control, name: 'password' });

    const onSubmit = (data: ChangePasswordData) => {
        changeMutation.mutate(data, {
            onSuccess: () => reset(),
            onError: error => applyServerErrors(error, setError),
        });
    };

    return (
        <Card>
            <Card.Header>
                <Card.Title>Change Password</Card.Title>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Current Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    {...register('current_password', {
                                        required: 'Required',
                                    })}
                                    isInvalid={!!errors.current_password}
                                    placeholder="Enter your current password"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.current_password?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>New Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    {...register('password', {
                                        required: 'Required',
                                        minLength: {
                                            value: 8,
                                            message: 'Minimum 8 characters',
                                        },
                                    })}
                                    isInvalid={!!errors.password}
                                    placeholder="New password (min. 8 characters)"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.password?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Confirm New Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    {...register('password_confirmation', {
                                        required: 'Required',
                                        validate: value =>
                                            value === newPassword ||
                                            'Passwords do not match',
                                    })}
                                    isInvalid={!!errors.password_confirmation}
                                    placeholder="Repeat new password"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.password_confirmation?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4">
                        <Button
                            type="submit"
                            variant="warning"
                            disabled={changeMutation.isPending}
                        >
                            {changeMutation.isPending
                                ? 'Changing...'
                                : 'Change Password'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

/* Main Profile Page */
export default function Profile() {
    const title = useTitle('Profile');
    const authUser = useSelector(selectAuthUser);

    if (!authUser) {
        return <SettingsFormSkeleton cards={2} />;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>My Profile</h4>
                <p className="text-muted mb-0">
                    Manage your account information and security.
                </p>
            </div>

            <Row className="g-4">
                {/* Left Sidebar - Avatar & Info */}
                <Col xl={3} lg={4}>
                    <Row>
                        <Col lg={12}>
                            <Card className="profile-card author-profile text-center">
                                <div className="card-body p-4">
                                    <AvatarUpload />
                                    <div className="mt-3">
                                        <h5 className="mb-1 fw-semibold">
                                            {authUser.name}
                                        </h5>
                                        <p className="text-muted small mb-2">
                                            {authUser.email}
                                        </p>
                                        <div className="d-flex gap-1 flex-wrap justify-content-center mb-3">
                                            {authUser.roles?.map(role => (
                                                <Badge
                                                    key={role}
                                                    bg="primary"
                                                    className="text-capitalize fw-normal"
                                                >
                                                    {role}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="info-list border-top">
                                    <ul className="mb-0">
                                        {authUser.username && (
                                            <li className="py-2 px-3 d-flex justify-content-between align-items-center border-bottom">
                                                <span className="text-muted small d-flex align-items-center gap-2">
                                                    <FaAt
                                                        style={{ fontSize: 11 }}
                                                    />
                                                    Username
                                                </span>
                                                <span className="small fw-semibold">
                                                    {authUser.username}
                                                </span>
                                            </li>
                                        )}
                                        {authUser.phone && (
                                            <li className="py-2 px-3 d-flex justify-content-between align-items-center border-bottom">
                                                <span className="text-muted small d-flex align-items-center gap-2">
                                                    <FaPhone
                                                        style={{ fontSize: 11 }}
                                                    />
                                                    Phone
                                                </span>
                                                <span className="small fw-semibold">
                                                    {authUser.phone}
                                                </span>
                                            </li>
                                        )}
                                        {authUser.branches &&
                                            authUser.branches.length > 0 && (
                                                <li className="py-2 px-3 d-flex justify-content-between align-items-center">
                                                    <span className="text-muted small d-flex align-items-center gap-2">
                                                        <FaBuilding
                                                            style={{
                                                                fontSize: 11,
                                                            }}
                                                        />
                                                        Branches
                                                    </span>
                                                    <div className="d-flex flex-wrap gap-1 justify-content-end">
                                                        {authUser.branches.map(
                                                            branch => (
                                                                <Badge
                                                                    key={
                                                                        branch.id
                                                                    }
                                                                    bg="secondary"
                                                                    className="small text-white"
                                                                >
                                                                    {
                                                                        branch.name
                                                                    }
                                                                </Badge>
                                                            )
                                                        )}
                                                    </div>
                                                </li>
                                            )}
                                    </ul>
                                </div>
                            </Card>
                        </Col>
                        <Col lg={12}>
                            <LoginSessionsPanel />
                        </Col>
                    </Row>
                </Col>

                {/* Right - Forms */}
                <Col xl={9} lg={8}>
                    <Row className="g-3">
                        <Col xs={12}>
                            <ProfileInfoForm />
                        </Col>
                        <Col xs={12}>
                            <ChangePasswordForm />
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
}
