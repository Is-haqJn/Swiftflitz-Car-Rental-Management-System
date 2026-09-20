import SwiftFlitzWhiteLogo from '@/shared/assets/swiftflitz-white-logo.svg?react';
import {
    useContactSettings,
    useFooterSettings,
    useGeneralSettings,
} from '@/shared/hooks/queries/useSettings';
import { FEATURE_ICON_MAP } from '@adminConstants/featureIcons';
import { Link } from 'react-router-dom';

export const Footer = () => {
    const { data: generalRes } = useGeneralSettings();
    const { data: footerRes } = useFooterSettings();
    const { data: contactRes } = useContactSettings();
    const generalSettings = generalRes?.data;
    const footerSettings = footerRes?.data;
    const contactSettings = contactRes?.data;

    const showSocials =
        footerSettings?.footer_socials_enabled !== false &&
        contactSettings?.contact_socials_enabled !== false;
    const socials = contactSettings?.contact_socials ?? [];

    const openingHours = footerSettings?.opening_hours ?? [];
    const openingHoursTitle =
        footerSettings?.opening_hours_title ?? 'Opening Hours';
    const quickLinks = footerSettings?.quick_links ?? [];
    const quickLinksTitle = footerSettings?.quick_links_title ?? 'Quick Links';
    const showLegal = footerSettings?.footer_legal_enabled !== false;
    const legalTitle = footerSettings?.footer_legal_title ?? 'Legal';

    const visibleColumns = [
        openingHours.length > 0,
        quickLinks.length > 0,
        showLegal,
    ].filter(Boolean).length;
    const openingHoursCol = visibleColumns === 3 ? 'col-lg-5' : 'col-lg-6';
    const quickLinksCol = visibleColumns === 3 ? 'col-lg-3' : 'col-lg-6';

    return (
        <footer className="footer-dark">
            <div className="container">
                {/* <!-- FOOTER BLOCKES START -->   */}
                <div className="footer-top">
                    <div className="row">
                        <div className="col-xl-4 col-lg-4">
                            <div className="widget widget_about">
                                <div className="logo-footer clearfix">
                                    <Link to={'/'}>
                                        <SwiftFlitzWhiteLogo
                                            id={'footer-logo'}
                                            width={'100%'}
                                        />
                                    </Link>
                                </div>
                                <div className="f-about-info">
                                    {footerSettings?.tagline}
                                </div>
                                <ul className="ftr-list">
                                    {generalSettings?.site_phone && (
                                        <li>
                                            <i className="feather feather-phone-call"></i>
                                            <a
                                                href={`tel:${generalSettings?.site_phone}`}
                                            >
                                                {generalSettings?.site_phone}
                                            </a>
                                        </li>
                                    )}
                                    {generalSettings?.site_email && (
                                        <li>
                                            <i className="feather feather-mail"></i>
                                            <a
                                                href={`mailto:${generalSettings?.site_email}`}
                                            >
                                                {generalSettings?.site_email}
                                            </a>
                                        </li>
                                    )}
                                    {generalSettings?.site_address && (
                                        <li>
                                            <i className="feather feather-home"></i>
                                            {generalSettings?.site_address}
                                        </li>
                                    )}
                                </ul>

                                {showSocials && socials.length > 0 && (
                                    <div className="twm-social">
                                        <ul>
                                            {socials.map((social, index) => {
                                                const IconComp = social.icon
                                                    ? FEATURE_ICON_MAP[
                                                          social.icon
                                                      ]
                                                    : null;
                                                if (!IconComp) return null;
                                                return (
                                                    <li key={index}>
                                                        <a
                                                            href={
                                                                social.url ||
                                                                '#'
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <i
                                                                style={{
                                                                    display:
                                                                        'flex',
                                                                    alignItems:
                                                                        'center',
                                                                    justifyContent:
                                                                        'center',
                                                                }}
                                                            >
                                                                <IconComp
                                                                    size={18}
                                                                    color="currentColor"
                                                                />
                                                            </i>
                                                        </a>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-xl-8 col-lg-8">
                            <div className="ftr-right-section">
                                <div className="row">
                                    {openingHours.length > 0 && (
                                        <div
                                            className={`${openingHoursCol} col-md-6 col-6 m-b20`}
                                        >
                                            <div className="widget widget_time-duraion">
                                                <h3 className="widget-title">
                                                    {openingHoursTitle}
                                                </h3>
                                                <ul>
                                                    {openingHours.map(
                                                        (item, index) => (
                                                            <li key={index}>
                                                                <span>
                                                                    {item.days}:
                                                                </span>
                                                                {item.time}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {quickLinks.length > 0 && (
                                        <div
                                            className={`${quickLinksCol} col-md-6 col-6 m-b20`}
                                        >
                                            <div className="widget widget_services">
                                                <h3 className="widget-title">
                                                    {quickLinksTitle}
                                                </h3>
                                                <ul>
                                                    {quickLinks.map(
                                                        (link, index) => (
                                                            <li key={index}>
                                                                {link.url.startsWith(
                                                                    'http'
                                                                ) ? (
                                                                    <a
                                                                        href={
                                                                            link.url
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        {
                                                                            link.name
                                                                        }
                                                                    </a>
                                                                ) : (
                                                                    <Link
                                                                        to={
                                                                            link.url
                                                                        }
                                                                    >
                                                                        {
                                                                            link.name
                                                                        }
                                                                    </Link>
                                                                )}
                                                            </li>
                                                        )
                                                    )}
                                                    <li>
                                                        <Link to="/track">
                                                            Track Rental
                                                        </Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {showLegal && (
                                        <div className="col-lg-4 col-md-12 col-sm-12 m-b20">
                                            <div className="widget widget_services">
                                                <h3 className="widget-title">
                                                    {legalTitle}
                                                </h3>
                                                <ul>
                                                    <li>
                                                        <Link to="/terms">
                                                            Terms &amp;
                                                            Conditions
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link to="/privacy">
                                                            Privacy Policy
                                                        </Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="twm-subscribe-nl">
                                    <div className="twm-nl-title">
                                        Subscribe To Our Newsletter Today!
                                    </div>
                                    <div className="twm-nl-section">
                                        <form>
                                            <div className="ftr-nw-form">
                                                <input
                                                    name="news-letter"
                                                    className="form-control"
                                                    placeholder="Email address..."
                                                    type="text"
                                                />
                                                <button className="ftr-nw-subcribe-btn">
                                                    <i className="feather feather-arrow-up-right"></i>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* <!-- FOOTER COPYRIGHT --> */}
            <div className="footer-bottom">
                <div className="footer-bottom-info">
                    <div className="footer-copy-right">
                        <span className="copyrights-text">
                            {footerSettings?.copyright ||
                                `; ${new Date().getFullYear()} SwiftFlitz. All rights reserved.`}
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
