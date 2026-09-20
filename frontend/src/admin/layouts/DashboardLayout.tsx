import { Outlet } from 'react-router-dom';
import NavBar from '@adminComponents/layout/navbar';
import { type ReactNode } from 'react';
import { Footer } from '@adminComponents/layout/Footer';
import ScrollToTop from '@adminComponents/common/ScrollToTop';

import '@adminAssets/index.css';
// import 'swiper/css';
// import 'swiper/css/pagination';
// import 'swiper/css/free-mode';
// import 'swiper/css/thumbs';
import '@adminAssets/css/style.css';
import { useThemeContext } from '../context/ThemeContext';
import { useTitle } from '@/shared/hooks';
// import 'lightgallery/css/lightgallery.css';
// import 'lightgallery/css/lg-zoom.css';
// import 'lightgallery/css/lg-thumbnail.css';
// import "nouislider/distribute/nouislider.css";
// import "react-range-slider-input/dist/style.css";
// import "react-datepicker/dist/react-datepicker.css";

interface DashboardLayoutProps {
    children?: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const title = useTitle('Dashboard');
    const { menuToggle, sidebariconHover } = useThemeContext() || {};
    return (
        <>
            {title}
            <div
                id="main-wrapper"
                className={`show ${sidebariconHover ? 'iconhover-toggle' : ''} ${menuToggle ? 'menu-toggle' : ''}`}
            >
                <NavBar />
                <div className="content-body" style={{ minHeight: '849px' }}>
                    <div className="container-fluid">{children}</div>
                </div>
                <Footer />
            </div>
            {/* <Setting2 /> */}
            <Outlet />
            <ScrollToTop />
        </>
    );
};

export default DashboardLayout;
