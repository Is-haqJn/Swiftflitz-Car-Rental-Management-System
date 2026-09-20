import { Fragment, useEffect, useReducer, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
// import {MenuList} from "./Menu.js";
import { useScrollPosition } from '@n8tb1t/use-scroll-position';
import { useThemeContext } from '@adminContext/ThemeContext';
import { Collapse } from 'react-bootstrap';
import { sideBarItems } from '@adminConstants/sideBarItems';
import { useFilteredMenu } from '@/admin/hooks/useFilteredMenu';

type StateType = {
    active: string;
    activeSubmenu: string;
};

const reducer = (
    previousState: StateType,
    updatedState: Partial<StateType>
): StateType => ({
    ...previousState,
    ...updatedState,
});

const initialState: StateType = {
    active: '',
    activeSubmenu: '',
};

function closeMenuIfOpen(): void {
    document.querySelector('#main-wrapper')?.classList.remove('menu-toggle');
}

function SideBar() {
    const {
        iconHover,
        sidebarposition,
        headerposition,
        sidebarLayout,
        ChangeIconSidebar,
    } = useThemeContext();

    const [state, setState] = useReducer(reducer, initialState);

    //? filter menu based on user permissions
    const filteredMenuItems = useFilteredMenu(sideBarItems);

    const [hideOnScroll, setHideOnScroll] = useState<number>(0);
    useScrollPosition(
        ({ prevPos, currPos }) => {
            const isShow = currPos.y > prevPos.y;
            if (Number(isShow) !== hideOnScroll)
                setHideOnScroll(Number(isShow));
        },
        [hideOnScroll]
    );

    const handleMenuActive = (status: string) => {
        setState({ active: status });
        if (state.active === status) {
            setState({ active: '' });
        }
    };
    const handleSubmenuActive = (status: string) => {
        setState({ activeSubmenu: status });
        if (state.activeSubmenu === status) {
            setState({ activeSubmenu: '' });
        }
    };

    /// Path
    const { pathname } = useLocation();
    useEffect(() => {
        filteredMenuItems.forEach(data => {
            data.content?.forEach(item => {
                if (pathname === item.to) {
                    setState({ active: data.title });
                }
                item.content?.forEach(ele => {
                    if (pathname === ele.to) {
                        setState({
                            activeSubmenu: item.title,
                            active: data.title,
                        });
                    }
                });
            });
        });
    }, [pathname, filteredMenuItems]);

    return (
        <>
            <div
                onMouseEnter={() => ChangeIconSidebar(true)}
                onMouseLeave={() => ChangeIconSidebar(false)}
                className={`ic-sidenav ${iconHover} ${
                    sidebarposition!.value === 'fixed' &&
                    sidebarLayout.value === 'horizontal' &&
                    headerposition.value === 'static'
                        ? hideOnScroll > 120
                            ? 'fixed'
                            : ''
                        : ''
                }`}
            >
                <div className="ic-sidenav-scroll">
                    <ul className="metismenu" id="menu">
                        {filteredMenuItems.map((data, index) => {
                            const menuClass = data.classChange;
                            if (menuClass === 'menu-title') {
                                return (
                                    <li
                                        className={`${menuClass} ${data?.className}`}
                                        key={index}
                                    >
                                        {data.title}
                                    </li>
                                );
                            } else {
                                return (
                                    <li
                                        className={` ${state.active === data.title ? 'mm-active' : ''} ${data.to === pathname ? 'mm-active' : ''} ${data?.className}`}
                                        key={index}
                                    >
                                        {data.content &&
                                        data.content.length > 0 ? (
                                            <>
                                                <Link
                                                    to={'#'}
                                                    className="has-arrow"
                                                    onClick={() => {
                                                        handleMenuActive(
                                                            data.title
                                                        );
                                                    }}
                                                >
                                                    <>
                                                        {data.iconStyle}
                                                        <span className="nav-text">
                                                            {' '}
                                                            {data.title}{' '}
                                                        </span>
                                                        <span className="badge badge-xs style-1 badge-danger">
                                                            {data.update}
                                                        </span>
                                                    </>
                                                </Link>
                                                <Collapse
                                                    in={
                                                        state.active ===
                                                        data.title
                                                    }
                                                >
                                                    <ul
                                                        className={`${menuClass === 'mm-collapse' ? 'mm-show' : ''}`}
                                                    >
                                                        {data.content &&
                                                            data.content.map(
                                                                (
                                                                    data,
                                                                    index
                                                                ) => {
                                                                    return (
                                                                        <li
                                                                            key={
                                                                                index
                                                                            }
                                                                            className={`${state.activeSubmenu === data.title ? 'mm-active' : ''}`}
                                                                        >
                                                                            {data.content &&
                                                                            data
                                                                                .content
                                                                                .length >
                                                                                0 ? (
                                                                                <>
                                                                                    <Link
                                                                                        to={{
                                                                                            pathname:
                                                                                                data.to,
                                                                                        }}
                                                                                        className={` ${data.hasMenu ? 'has-arrow' : ''} ${data.to === pathname ? 'mm-active' : ''} `}
                                                                                        onClick={() => {
                                                                                            handleSubmenuActive(
                                                                                                data.title
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            data.title
                                                                                        }
                                                                                    </Link>
                                                                                    <Collapse
                                                                                        in={
                                                                                            state.activeSubmenu ===
                                                                                            data.title
                                                                                        }
                                                                                    >
                                                                                        <ul
                                                                                            className={`${menuClass === 'mm-collapse' ? 'mm-show' : ''}`}
                                                                                        >
                                                                                            {data.content &&
                                                                                                data.content.map(
                                                                                                    (
                                                                                                        data,
                                                                                                        index
                                                                                                    ) => {
                                                                                                        return (
                                                                                                            <Fragment
                                                                                                                key={
                                                                                                                    index
                                                                                                                }
                                                                                                            >
                                                                                                                <li>
                                                                                                                    <Link
                                                                                                                        className={`${pathname === data.to ? 'mm-active' : ''}`}
                                                                                                                        to={{
                                                                                                                            pathname:
                                                                                                                                data.to,
                                                                                                                        }}
                                                                                                                        onClick={
                                                                                                                            closeMenuIfOpen
                                                                                                                        }
                                                                                                                    >
                                                                                                                        {
                                                                                                                            data.title
                                                                                                                        }
                                                                                                                    </Link>
                                                                                                                </li>
                                                                                                            </Fragment>
                                                                                                        );
                                                                                                    }
                                                                                                )}
                                                                                        </ul>
                                                                                    </Collapse>
                                                                                </>
                                                                            ) : (
                                                                                <Link
                                                                                    to={{
                                                                                        pathname:
                                                                                            data.to,
                                                                                    }}
                                                                                    className={`${data.to === pathname ? 'mm-active' : ''}`}
                                                                                    onClick={
                                                                                        closeMenuIfOpen
                                                                                    }
                                                                                >
                                                                                    {' '}
                                                                                    {
                                                                                        data.title
                                                                                    }{' '}
                                                                                </Link>
                                                                            )}
                                                                        </li>
                                                                    );
                                                                }
                                                            )}
                                                    </ul>
                                                </Collapse>
                                            </>
                                        ) : (
                                            <Link
                                                to={{ pathname: data.to }}
                                                onClick={closeMenuIfOpen}
                                            >
                                                {' '}
                                                {data.iconStyle}{' '}
                                                <span className="nav-text">
                                                    {' '}
                                                    {data.title}{' '}
                                                </span>{' '}
                                            </Link>
                                        )}
                                    </li>
                                );
                            }
                        })}
                    </ul>
                </div>
            </div>
        </>
    );
}

export default SideBar;
