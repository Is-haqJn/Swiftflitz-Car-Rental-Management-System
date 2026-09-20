import { Link } from 'react-router-dom';

export interface NavItemsProps {
    name: string;
    link?: string;
    className?: string;
    hasChildren?: boolean;
    order?: number;
    children?: NavItemsProps[];
}

export function closeMobileMenu(): void {
    document
        .querySelector('.mobile-sider-drawer-menu')
        ?.classList.remove('active');
}

export const Navbar = ({ navItems }: { navItems: NavItemsProps[] }) => {
    return (
        <>
            <div className="nav-animation header-nav navbar-collapse collapse d-flex justify-content-between">
                <ul className=" nav navbar-nav">
                    {navItems
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(item => (
                            <li
                                key={item.name}
                                className={item.hasChildren ? 'has-child' : ''}
                            >
                                {item.hasChildren ? (
                                    <>
                                        <a
                                            href="#"
                                            onClick={e => e.preventDefault()}
                                        >
                                            {item.name}
                                        </a>
                                        <ul className="sub-menu">
                                            {item.children?.map(child => (
                                                <li key={child.name}>
                                                    <Link
                                                        to={child.link || '#'}
                                                        onClick={
                                                            closeMobileMenu
                                                        }
                                                    >
                                                        {child.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                ) : (
                                    <Link
                                        to={item.link || '#'}
                                        onClick={closeMobileMenu}
                                    >
                                        {item.name}
                                    </Link>
                                )}
                            </li>
                        ))}
                </ul>
            </div>
        </>
    );
};
