import { useEffect, useRef } from 'react';
import SwiftFlitzDarkLogo from '@/shared/assets/swiftflitz-dark-logo.svg?react';
import { Navbar, closeMobileMenu, type NavItemsProps } from './navbar';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';
import { Link } from 'react-router-dom';

const navItems: NavItemsProps[] = [
    {
        name: 'Home',
        link: '/',
        order: 1,
    },
    {
        name: 'Listings',
        link: '/listings',
        order: 2,
    },
    {
        name: 'About',
        link: '/about',
        order: 3,
    },
    {
        name: 'Services',
        hasChildren: true,
        children: [
            {
                name: 'All Services',
                link: '/services',
            },
            {
                name: 'Chauffeur Services',
                link: '/chauffeur-services',
            },
            {
                name: 'Airport Transfer',
                link: '/airport-transfer',
            },
            // {
            //     name: 'Track Rental',
            //     link: '/track',
            // },
        ],
        order: 4,
    },
    {
        name: 'FAQs',
        link: '/faqs',
        order: 5,
    },
    {
        name: 'Contact',
        link: '/contact',
        order: 6,
    },
    {
        name: 'Login',
        link: '/auth/login',
        order: 7,
    },
    // {
    //     name: 'Request Quote',
    //     link: '/quote-request',
    //     order: 8,
    // },
];

export const Header = () => {
    const { data: res } = useGeneralSettings();
    const generalSettings = res?.data;
    const headerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                headerRef.current &&
                !headerRef.current.contains(e.target as Node)
            ) {
                closeMobileMenu();
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    return (
        <>
            <header
                ref={headerRef}
                className="site-header header-style-1 mobile-sider-drawer-menu light-hdr"
            >
                <div className="header-middle-wraper sticky-header ">
                    <div className="header-middle main-bar">
                        <div className="logo-header">
                            <div className="logo-header-inner logo-header-one">
                                <Link to="/">
                                    <SwiftFlitzDarkLogo
                                        id={'header-logo'}
                                        width={'100%'}
                                    />
                                    {/* <img src={`${import.meta.env.BASE_URL}assets/images/logo-light.png`} alt="Logo"/> */}
                                </Link>
                            </div>
                        </div>

                        <div className="header-info-wraper">
                            <div className="main-bar-wraper  navbar-expand-lg">
                                <div className="header-bottom">
                                    <div className="container-block clearfix">
                                        <div className="navigation-bar">
                                            {/* <!-- NAV Toggle Button --> */}
                                            <button
                                                id="mobile-side-drawer"
                                                data-target=".header-nav"
                                                data-toggle="collapse"
                                                type="button"
                                                className="navbar-toggler collapsed"
                                            >
                                                <span className="sr-only">
                                                    Toggle navigation
                                                </span>
                                                <span className="icon-bar icon-bar-first"></span>
                                                <span className="icon-bar icon-bar-two"></span>
                                                <span className="icon-bar icon-bar-three"></span>
                                            </button>

                                            {/* <!-- MAIN Vav --> */}
                                            <Navbar navItems={navItems} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* <!-- Header Right Section--> */}
                        <div className="extra-nav header-1-nav">
                            <div className="extra-cell one">
                                <ul className="wt-topbar-left-info">
                                    {generalSettings?.site_phone && (
                                        <li>
                                            <a
                                                href={`tel:${generalSettings.site_phone}`}
                                            >
                                                <span>
                                                    <i className="feather feather-phone-call"></i>
                                                </span>
                                                {generalSettings.site_phone}
                                            </a>
                                        </li>
                                    )}
                                    {generalSettings?.site_email && (
                                        <li>
                                            <a
                                                href={`mailto:${generalSettings.site_email}`}
                                            >
                                                <span>
                                                    <i className="feather feather-mail"></i>
                                                </span>
                                                {generalSettings.site_email}
                                            </a>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};
