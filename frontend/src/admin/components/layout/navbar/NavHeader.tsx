import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useThemeContext } from '@adminContext/ThemeContext';
import SwiftFlitzFaviconDark from '@adminAssets/swiftflitz-favicon.svg?react';
import SwiftFlitzWhiteIcon from '@adminAssets/swiftflitz-white-logo.svg?react';
import SwiftFlitzIcon from '@adminAssets/swiftflitz-dark-logo.svg?react';

export function NavMenuToggle() {
    setTimeout(() => {
        const mainwrapper = document.querySelector('#main-wrapper');
        if (mainwrapper?.classList.contains('menu-toggle')) {
            mainwrapper.classList.remove('menu-toggle');
        } else {
            mainwrapper?.classList.add('menu-toggle');
        }
    }, 200);
}

const NavHeader = () => {
    const [toggle, setToggle] = useState(false);
    const { openMenuToggle, background } = useThemeContext();
    return (
        <div className="nav-header">
            <Link to="/dashboard" className="brand-logo">
                {/* Full logo — desktop only */}
                <span className="brand-title">
                    {background!.value === 'dark' ? (
                        <SwiftFlitzWhiteIcon width={155} />
                    ) : (
                        <SwiftFlitzIcon width={155} />
                    )}
                </span>

                {/* Favicon / icon — mobile only */}
                <span className="logo-abbr">
                    <SwiftFlitzFaviconDark width={30} />
                </span>
            </Link>

            <div
                className="nav-control"
                onClick={() => {
                    setToggle(!toggle);
                    openMenuToggle();
                    NavMenuToggle();
                }}
            >
                <div className={`hamburger ${toggle ? 'is-active' : ''}`}>
                    <span className="line"></span>
                    <span className="line"></span>
                    <span className="line"></span>
                </div>
            </div>
        </div>
    );
};

export default NavHeader;
