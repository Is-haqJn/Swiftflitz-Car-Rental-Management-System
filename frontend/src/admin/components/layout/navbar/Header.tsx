import { Link } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
// import { IMAGES, SVGICON } from "../../constant/theme";
import { SVGICON } from '@adminConstants/theme';
import { LuSunMoon, LuSunMedium } from 'react-icons/lu';
import { ROUTES } from '@/shared/routes/routes';
import { useThemeContext } from '@/admin/context/ThemeContext';
// import fscreen from "fscreen";

const IMAGES = {
    image_sample: 'https://picsum.photos/200',
};

type HeaderType = {
    onNote?: () => void;
    onNotification?: () => void;
    onProfile?: () => void;
    toggle?: string;
    title?: string;
    onBox?: () => void;
    onClick?: () => void;
};

function Header({}: HeaderType = {}) {
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
                                        <span className="badge text-white bg-danger">
                                            2
                                        </span>
                                        {/*Notification*/}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu
                                        align="end"
                                        className="dropdown-menu dropdown-menu-end"
                                    >
                                        <div
                                            id="DZ_W_Notification1"
                                            className="widget-media ic-scroll p-3"
                                            // style={{ height: "380px" }}
                                            style={{ height: 'auto' }}
                                        >
                                            <ul className="timeline">
                                                <li>
                                                    <div className="timeline-panel">
                                                        <div className="media me-2">
                                                            <img
                                                                alt="image"
                                                                width="50"
                                                                src={
                                                                    IMAGES.image_sample
                                                                }
                                                            />
                                                        </div>
                                                        <div className="media-body">
                                                            <h6 className="mb-1">
                                                                New Quote
                                                                Requested
                                                            </h6>
                                                            <small className="d-block">
                                                                03 Feb 2025 -
                                                                02:26 PM
                                                            </small>
                                                        </div>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="timeline-panel">
                                                        <div className="media me-2 media-info">
                                                            KG
                                                        </div>
                                                        <div className="media-body">
                                                            <h6 className="mb-1">
                                                                New Customer
                                                                Registered
                                                            </h6>
                                                            <small className="d-block">
                                                                03 Feb 2025 -
                                                                02:26 PM
                                                            </small>
                                                        </div>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                        <Link
                                            className="all-notification"
                                            to={'#'}
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
                                        <img
                                            src={IMAGES.image_sample}
                                            width="20"
                                            alt="user"
                                        />
                                        <div className="header-info ms-3">
                                            <span className="fs-14 font-w600 mb-0">
                                                Swiftflitz
                                            </span>
                                        </div>
                                        {SVGICON.threeline}
                                    </Link>
                                    <div className="profile-detail card">
                                        <div className="card-body p-0">
                                            <div className="d-flex profile-media justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        src={
                                                            IMAGES.image_sample
                                                        }
                                                        alt="img"
                                                    />
                                                    <div className="ms-3">
                                                        <h4 className="mb-0">
                                                            Swiftflitz
                                                        </h4>
                                                        <p className="mb-0">
                                                            info@ordaq.com
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link to="/edit-profile">
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
                                                        <div className="icon-box-lg">
                                                            {' '}
                                                            {
                                                                SVGICON.setting
                                                            }{' '}
                                                            <p>Settings</p>{' '}
                                                        </div>
                                                    </li>
                                                    <li>
                                                        <Link to={ROUTES.LOGIN}>
                                                            <div className="icon-box-lg">
                                                                {' '}
                                                                {
                                                                    SVGICON.logout
                                                                }{' '}
                                                                <p>
                                                                    {' '}
                                                                    Logout{' '}
                                                                </p>{' '}
                                                            </div>
                                                        </Link>
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
