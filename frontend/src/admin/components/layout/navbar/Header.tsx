import { useEffect } from 'react';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
// import { IMAGES, SVGICON } from "../../constant/theme";
import { SVGICON } from '@adminConstants/theme';
import { LuSunMoon, LuSunMedium } from 'react-icons/lu';
import { ROUTES } from '@/shared/routes';
import { useThemeContext } from '@/admin/context/ThemeContext';
import { useAppSelector, useAppDispatch, persistor } from '@/store';
import { selectAuthUser } from '@/store/slices/authSlice';
import {
    selectActiveBranchId,
    setActiveBranch,
    clearActiveBranch,
} from '@/store/slices/activeBranchSlice';
import type { Branch } from '@/shared/types/branch.types';
import { LogoutButton } from '../../common/LogoutButton';
import {
    useUnreadCount,
    useNotifications,
    useMarkAsRead,
} from '@/shared/hooks/queries/useNotifications';
import { VscHome, VscLock } from 'react-icons/vsc';
import { tokenManager } from '@/shared/config/tokenManager';
import { formatTimeAgo } from '@/shared/libs/utils';
// import fscreen from "fscreen";

function BranchSelector({ branches }: { branches: Branch[] }) {
    const dispatch = useAppDispatch()();
    const activeBranchId = useAppSelector(selectActiveBranchId);
    const user = useAppSelector(selectAuthUser);
    const isAdmin = (user?.roles ?? []).some(r =>
        ['super_admin', 'admin'].includes(r)
    );

    useEffect(() => {
        /* After stop-impersonation reload: skip auto-select to prevent stale branch re-set */
        if (sessionStorage.getItem('swiftflitz:stop_impersonation')) return;
        /* Single-branch users (non-admin): auto-select their only branch */
        if (branches.length === 1 && activeBranchId === null && !isAdmin) {
            dispatch(setActiveBranch(branches[0].id));
        }
    }, [activeBranchId, branches, dispatch, isAdmin]);

    return (
        <li className="nav-item d-flex align-items-center me-2">
            <select
                className="form-select form-select-sm"
                style={{ minWidth: 160, maxWidth: 220 }}
                value={activeBranchId ?? ''}
                onChange={e => {
                    if (e.target.value === '') {
                        dispatch(clearActiveBranch());
                    } else {
                        dispatch(setActiveBranch(e.target.value));
                    }
                }}
            >
                <option value="">All Branches</option>
                {branches.map(b => (
                    <option key={b.id} value={b.id}>
                        {b.name}
                        {b.currency ? ` · ${b.currency}` : ''}
                    </option>
                ))}
            </select>
        </li>
    );
}

function UserAvatar({
    name,
    photoUrl,
    size = 36,
}: {
    name: string;
    photoUrl?: string | null;
    size?: number;
}) {
    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={name}
                width={size}
                height={size}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
        );
    }
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: '#6c757d',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: size * 0.4,
                flexShrink: 0,
            }}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

type HeaderType = {
    onNote?: () => void;
    onNotification?: () => void;
    onProfile?: () => void;
    toggle?: string;
    title?: string;
    onBox?: () => void;
    onClick?: () => void;
};

// eslint-disable-next-line no-empty-pattern
function Header({}: HeaderType) {
    const user = useAppSelector(selectAuthUser);
    const dispatch = useAppDispatch()();
    const activeBranchId = useAppSelector(selectActiveBranchId);
    const navigate = useNavigate();

    const branches = user?.branches ?? [];
    const isAdminUser = (user?.roles ?? []).some(r =>
        ['super_admin', 'admin'].includes(r)
    );

    // Remove stop-impersonation guard once the real admin profile is confirmed
    useEffect(() => {
        if (isAdminUser) {
            sessionStorage.removeItem('swiftflitz:stop_impersonation');
        }
    }, [isAdminUser]);

    // Auto-init active branch for single-branch non-admin users on mount
    useEffect(() => {
        if (sessionStorage.getItem('swiftflitz:stop_impersonation')) return;
        if (branches.length === 1 && !activeBranchId && !isAdminUser) {
            dispatch(setActiveBranch(branches[0].id));
        }
    }, [branches, activeBranchId, dispatch, isAdminUser]);

    // Clear stale activeBranchId when the user changes (e.g. after stopping impersonation).
    // If the stored branch doesn't exist in the current user's branch list, discard it.
    useEffect(() => {
        if (activeBranchId) {
            const isValid = branches.some(b => b.id === activeBranchId);
            if (!isValid) {
                dispatch(clearActiveBranch());
            }
        }
    }, [branches, activeBranchId, dispatch]);

    const { data: unreadData } = useUnreadCount();
    const { data: recentData } = useNotifications({ per_page: 5 });
    const markAsRead = useMarkAsRead();

    const unreadCount = unreadData?.data?.count ?? 0;
    const recentNotifications = recentData?.data ?? [];

    const isImpersonating = tokenManager.isImpersonating();
    const originalUserName = tokenManager.getOriginalUserName();

    const { confirm } = useConfirm();

    const handleStopImpersonation = async () => {
        const ok = await confirm({
            title: 'Stop Impersonation?',
            message: `Return to ${originalUserName ?? 'your account'}?`,
            confirmText: 'Yes, Return',
            confirmVariant: 'primary',
        });
        if (!ok) return;
        /* restore original admin token first, then nuke all persisted Redux state.
           on reload useCurrentUser fires (token exists), fetches the admin user,
           and ProtectedRoute shows a skeleton until the response arrives. */
        tokenManager.stopImpersonation();
        sessionStorage.setItem('swiftflitz:stop_impersonation', '1');
        await persistor.purge();
        window.location.href = ROUTES.DASHBOARD.USERS.ROOT;
    };

    const { background, changeBackground } = useThemeContext();
    const handleThemeMode = () => {
        if (!changeBackground) return;
        if (background?.value === 'dark') {
            changeBackground({ value: 'light', label: 'Light' });
        } else {
            changeBackground({ value: 'dark', label: 'Dark' });
        }
    };
    /*const handleFullscreenToggle = () => {
		if (!fscreen.fullscreenElement) {
			fscreen.requestFullscreen(document.documentElement).catch(err => {
				console.error(`Error attempting to enable full-screen mode: ${err.message}`);
			});
		} else {
			fscreen.exitFullscreen();
		}
	};*/
    return (
        <>
            <div className="header">
                <div className="header-content">
                    <nav className="navbar navbar-expand">
                        <div className="collapse navbar-collapse justify-content-between">
                            <div className="header-left">
                                <ul className="navbar-nav header-left">
                                    {branches.length > 0 && (
                                        <BranchSelector branches={branches} />
                                    )}
                                    {/*<li className="nav-item d-flex align-items-center">
										<div className="input-group search-area">
											<span className="input-group-text pe-2"><Link to={"#"}><i className="flaticon-search-interface-symbol" /></Link></span>
											<input type="text" className="form-control ps-0" placeholder="Search anything" />
										</div>
									</li>*/}
                                    {/*<li className="nav-item dropdown notification_dropdown">
										<button className={`ic-theme-mode ${background.value === "dark" ? "active" : ""}`} onClick={() => handleThemeMode()} type="button">
											<span className="light">Light</span>
											<span className="dark">Dark</span>
										</button>
									</li>*/}
                                </ul>
                            </div>
                            <ul className="navbar-nav header-right">
                                {/* Stop Impersonation - only visible when impersonating */}
                                {isImpersonating && (
                                    <li className="nav-item">
                                        <button
                                            className="nav-link btn btn-link p-0 tw:text-warning"
                                            title={`Return to ${originalUserName ?? 'your account'}`}
                                            onClick={handleStopImpersonation}
                                        >
                                            <VscLock size={22} />
                                        </button>
                                    </li>
                                )}
                                {/* Go to Home */}
                                <li className="nav-item">
                                    <Link
                                        title={'Visit Home'}
                                        className="nav-link"
                                        to={ROUTES.FRONTEND.HOME}
                                        target="_blank"
                                    >
                                        <VscHome size={24} />
                                    </Link>
                                </li>
                                <li className="nav-item dropdown notification_dropdown">
                                    {/*<Link className="nav-link dz-fullscreen" to={"#"} onClick={handleFullscreenToggle}> {SVGICON.fullscreen} </Link>*/}
                                    {/* Handle theme switch moon -sun icons*/}
                                    <Link
                                        className="nav-link dz-n"
                                        to={'#'}
                                        onClick={() => handleThemeMode()}
                                    >
                                        {background!.value === 'dark' ? (
                                            <LuSunMedium size={24} />
                                        ) : (
                                            <LuSunMoon size={24} />
                                        )}
                                    </Link>
                                </li>

                                <Dropdown
                                    as="li"
                                    className="nav-item dropdown notification_dropdown me-3"
                                >
                                    <Dropdown.Toggle
                                        variant=""
                                        as="a"
                                        className="nav-link bell bell-link text-black i-false c-pointer"
                                        data-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        {SVGICON.notification}
                                        {unreadCount > 0 && (
                                            <span className="badge text-white bg-danger">
                                                {unreadCount > 99
                                                    ? '99+'
                                                    : unreadCount}
                                            </span>
                                        )}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu
                                        align="end"
                                        className="dropdown-menu dropdown-menu-end"
                                    >
                                        <div
                                            id="DZ_W_Notification1"
                                            className="widget-media ic-scroll p-3"
                                            style={{ height: 'auto' }}
                                        >
                                            <ul className="timeline">
                                                {recentNotifications.length ===
                                                0 ? (
                                                    <li>
                                                        <div className="timeline-panel text-muted text-center py-2">
                                                            No notifications
                                                        </div>
                                                    </li>
                                                ) : (
                                                    recentNotifications.map(
                                                        n => (
                                                            <li key={n.id}>
                                                                <div
                                                                    className={`timeline-panel${!n.read_at ? ' fw-semibold' : ''}`}
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                    }}
                                                                    onClick={() => {
                                                                        if (
                                                                            !n.read_at
                                                                        ) {
                                                                            markAsRead.mutate(
                                                                                n.id
                                                                            );
                                                                        }
                                                                        const dest =
                                                                            n.action_url ||
                                                                            ROUTES.DASHBOARD.NOTIFICATIONS.VIEW(
                                                                                n.id
                                                                            );
                                                                        navigate(
                                                                            dest
                                                                        );
                                                                    }}
                                                                >
                                                                    <div className="media-body">
                                                                        <h6 className="mb-1">
                                                                            {
                                                                                n.title
                                                                            }
                                                                        </h6>
                                                                        <small className="d-block text-muted">
                                                                            {formatTimeAgo(
                                                                                n.created_at
                                                                            )}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        )
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                        <Link
                                            className="all-notification"
                                            to={
                                                ROUTES.DASHBOARD.NOTIFICATIONS
                                                    .ROOT
                                            }
                                        >
                                            See all notifications{' '}
                                            <i className="ti-arrow-end"></i>
                                        </Link>
                                    </Dropdown.Menu>
                                </Dropdown>

                                <li className="nav-item dropdown header-profile">
                                    <Link
                                        className="nav-link"
                                        to={'#'}
                                        role="button"
                                        data-bs-toggle="dropdown"
                                    >
                                        <UserAvatar
                                            name={user?.name || 'A'}
                                            photoUrl={user?.profile_photo_url}
                                            size={32}
                                        />
                                        <div className="header-info ms-3">
                                            <span className="fs-14 font-w600 mb-0">
                                                {user?.name || 'Admin User'}
                                            </span>
                                        </div>
                                        {SVGICON.threeline}
                                    </Link>
                                    <div className="profile-detail card">
                                        <div className="card-body p-0">
                                            <div className="d-flex profile-media justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <UserAvatar
                                                        name={user?.name || 'A'}
                                                        photoUrl={
                                                            user?.profile_photo_url
                                                        }
                                                        size={48}
                                                    />
                                                    <div className="ms-3">
                                                        <h4 className="mb-0">
                                                            {user?.name ||
                                                                'Admin User'}
                                                        </h4>
                                                        <p className="mb-0">
                                                            {user?.email ||
                                                                'info@ordaq.com'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link
                                                    to={
                                                        ROUTES.DASHBOARD.PROFILE
                                                    }
                                                >
                                                    <div className="icon-box">
                                                        {' '}
                                                        {SVGICON.edit}{' '}
                                                    </div>
                                                </Link>
                                            </div>
                                            <div className="media-box">
                                                <ul className="d-flex flex-colunm gap-2 flex-wrap">
                                                    <li>
                                                        <Link
                                                            to={
                                                                ROUTES.DASHBOARD
                                                                    .PROFILE
                                                            }
                                                        >
                                                            <div className="icon-box-lg">
                                                                {' '}
                                                                {
                                                                    SVGICON.profile
                                                                }{' '}
                                                                <p>
                                                                    {' '}
                                                                    Profile{' '}
                                                                </p>{' '}
                                                            </div>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to={
                                                                ROUTES.DASHBOARD
                                                                    .PROFILE_NOTIFICATION_PREFERENCES
                                                            }
                                                            className="icon-box-lg"
                                                        >
                                                            {' '}
                                                            {
                                                                SVGICON.setting
                                                            }{' '}
                                                            <p>Settings</p>{' '}
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <LogoutButton
                                                            className="icon-box-lg"
                                                            confirmBeforeLogout={
                                                                true
                                                            }
                                                        >
                                                            {' '}
                                                            {
                                                                SVGICON.logout
                                                            }{' '}
                                                            <p> Logout </p>{' '}
                                                        </LogoutButton>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </nav>
                </div>
            </div>
        </>
    );
}
export default Header;
