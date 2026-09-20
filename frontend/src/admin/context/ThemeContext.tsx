import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { dezThemeSet } from './ThemeDemo';

type ThemeContextType = {
    body?: HTMLElement | null;
    sideBarOption?: Array<{ value: string; label: string }>;
    layoutOption?: Array<{ value: string; label: string }>;
    backgroundOption?: Array<{ value: string; label: string }>;
    sidebarposition?: { value: string; label: string };
    headerPositions?: Array<{ value: string; label: string }>;
    containerPosition?: Array<{ value: string; label: string }>;
    directionPosition?: Array<{ value: string; label: string }>;
    fontFamily?: Array<{ value: string; label: string }>;
    primaryColor?: string;
    navigationHader?: string;
    windowWidth?: number;

    windowHeight?: number;
    changePrimaryColor?: (name: string) => void;
    changeNavigationHader?: (name: string) => void;
    changeSideBarStyle?: (name: { value: string; label: string }) => void;
    sideBarStyle?: { value: string; label: string };
    changeSideBarPostion: (name: { value: string; label: string }) => void;
    sidebarpositions: Array<{ value: string; label: string }>;
    changeHeaderPostion: (name: { value: string; label: string }) => void;
    headerposition: { value: string; label: string };
    changeSideBarLayout: (name: { value: string; label: string }) => void;
    sidebarLayout: { value: string; label: string };
    changeDirectionLayout: (name: { value: string; label: string }) => void;
    openMenuToggle: () => void;
    changeBackground?: (name: { value: string; label: string }) => void;
    background?: { value: string; label: string };
    changeContainerPosition: (name: { value: string; label: string }) => void;
    direction: { value: string; label: string };
    colors: string[];
    haderColor: string;
    chnageHaderColor: (name: string) => void;
    chnageSidebarColor: (name: string) => void;
    sidebarColor: string;
    iconHover: string | boolean;
    ChangeIconSidebar: (value: boolean) => void;
    sidebariconHover: boolean;
    menuToggle: boolean;
    containerPosition_: { value: string; label: string };
    setDemoTheme: (theme: number, direction: string) => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextType | undefined>(
    undefined
);

interface ThemeContextProviderProps {
    children: ReactNode;
}

export const ThemeContextProvider = (props: ThemeContextProviderProps) => {
    const [sideBarStyle, setSideBarStyle] = useState({
        value: 'full',
        label: 'Full',
    });
    const [sidebarposition, setSidebarposition] = useState({
        value: 'fixed',
        label: 'Fixed',
    });
    const [headerposition, setHeaderposition] = useState({
        value: 'fixed',
        label: 'Fixed',
    });
    const [sidebarLayout, setSidebarLayout] = useState({
        value: 'vertical',
        label: 'Vertical',
    });
    const [direction, setDirection] = useState({ value: 'ltr', label: 'LTR' });
    const [primaryColor, setPrimaryColor] = useState('color_1');
    const [navigationHader, setNavigationHader] = useState('color_1');
    const [haderColor, setHaderColor] = useState('color_1');
    const [sidebarColor, setSidebarColor] = useState('color_1');
    const [iconHover, setIconHover] = useState<string | boolean>(false);
    const [sidebariconHover, setSidebariconHover] = useState(false);
    const [menuToggle, setMenuToggle] = useState(false);
    const [background, setBackground] = useState({
        value: 'light',
        label: 'Light',
    });
    const [containerPosition_, setcontainerPosition_] = useState({
        value: 'wide-boxed',
        label: 'Wide Boxed',
    });
    const body = document.querySelector('body');
    const [windowWidth, setWindowWidth] = useState(0);
    const [windowHeight, setWindowHeight] = useState(0);

    // layout
    const layoutOption = [
        { value: 'vertical', label: 'Vertical' },
        { value: 'horizontal', label: 'Horizontal' },
    ];
    const sideBarOption = [
        { value: 'compact', label: 'Compact' },
        { value: 'full', label: 'Full' },
        { value: 'mini', label: 'Mini' },
        { value: 'modern', label: 'Modern' },
        { value: 'overlay', label: 'Overlay' },
        { value: 'icon-hover', label: 'Icon-hover' },
    ];
    const backgroundOption = [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
    ];
    const sidebarpositions = [
        { value: 'fixed', label: 'Fixed' },
        { value: 'static', label: 'Static' },
    ];
    const headerPositions = [
        { value: 'fixed', label: 'Fixed' },
        { value: 'static', label: 'Static' },
    ];
    const containerPosition = [
        { value: 'wide-boxed', label: 'Wide Boxed' },
        { value: 'boxed', label: 'Boxed' },
        { value: 'wide', label: 'Wide' },
    ];
    const colors = [
        'color_1',
        'color_2',
        'color_3',
        'color_4',
        'color_5',
        'color_6',
        'color_7',
        // "color_8",
        'color_9',
        'color_10',
        'color_11',
        'color_12',
        'color_13',
        'color_14',
        'color_15',
    ];
    const directionPosition = [
        { value: 'ltr', label: 'LTR' },
        { value: 'rtl', label: 'RTL' },
    ];
    const fontFamily = [
        { value: 'poppins', label: 'Poppins' },
        { value: 'roboto', label: 'Roboto' },
        { value: 'poppins', label: 'Poppins' },
        { value: 'opensans', label: 'Open Sans' },
        { value: 'HelveticaNeue', label: 'HelveticaNeue' },
    ];

    //! Prevent body null error
    // if (!body) {
    //     return <>{props.children}</>;
    // }

    const changePrimaryColor = (name: string) => {
        if (!body) return;
        setPrimaryColor(name);
        body.setAttribute('data-primary', name);
    };
    const changeNavigationHader = (name: string) => {
        if (!body) return;
        setNavigationHader(name);
        body.setAttribute('data-nav-headerbg', name);
    };
    const chnageHaderColor = (name: string) => {
        if (!body) return;
        setHaderColor(name);
        body.setAttribute('data-headerbg', name);
    };
    const chnageSidebarColor = (name: string) => {
        if (!body) return;
        setSidebarColor(name);
        body.setAttribute('data-sidebarbg', name);
    };
    const changeSideBarPostion = (name: { value: string; label: string }) => {
        if (!body) return;
        setSidebarposition(name);
        body.setAttribute('data-sidebar-position', name.value);
    };
    const changeDirectionLayout = (name: { value: string; label: string }) => {
        if (!body) return;
        setDirection(name);
        body.setAttribute('direction', name.value);
        const html = document.querySelector('html');
        html?.setAttribute('dir', name.value);
        html!.className = name.value;
    };
    const changeSideBarLayout = (name: { value: string; label: string }) => {
        if (!body) return;
        if (name.value === 'horizontal') {
            if (sideBarStyle.value === 'overlay') {
                setSidebarLayout(name);
                body.setAttribute('data-layout', name.value);
                setSideBarStyle({ value: 'full', label: 'Full' });
                body.setAttribute('data-sidebar-style', 'full');
            } else {
                setSidebarLayout(name);
                body.setAttribute('data-layout', name.value);
            }
        } else {
            setSidebarLayout(name);
            body.setAttribute('data-layout', name.value);
        }
    };
    const changeSideBarStyle = (name: { value: string; label: string }) => {
        if (!body) return;
        if (sidebarLayout.value === 'horizontal') {
            if (name.value === 'overlay') {
                alert('Sorry! Overlay is not possible in Horizontal layout.');
            } else {
                setSideBarStyle(name);
                setIconHover(name.value === 'icon-hover' ? '_i-hover' : '');
                body.setAttribute('data-sidebar-style', name.value);
            }
        } else {
            setSideBarStyle(name);
            setIconHover(name.value === 'icon-hover' ? '_i-hover' : '');
            body.setAttribute('data-sidebar-style', name.value);
        }
    };

    const ChangeIconSidebar = (value: boolean) => {
        if (sideBarStyle.value === 'icon-hover') {
            if (value) {
                setSidebariconHover(true);
            } else {
                setSidebariconHover(false);
            }
        }
    };

    const changeHeaderPostion = (name: { value: string; label: string }) => {
        if (!body) return;
        setHeaderposition(name);
        body.setAttribute('data-header-position', name.value);
    };

    const openMenuToggle = () => {
        const isOverly = sideBarStyle.value === 'overly';
        setMenuToggle(isOverly);
    };

    const changeBackground = (name: { value: string; label: string }) => {
        if (!body) return;
        body.setAttribute('data-theme-version', name.value);
        setBackground(name);
        localStorage.setItem('swiftflitz:theme', name.value);
    };

    const changeContainerPosition = (name: {
        value: string;
        label: string;
    }) => {
        if (!body) return;
        setcontainerPosition_(name);
        body.setAttribute('data-container', name.value);
        if (name.value === 'boxed') {
            changeSideBarStyle({ value: 'overlay', label: 'Overlay' });
        }
    };

    const setDemoTheme = (theme: number, direction: string) => {
        if (!body) return;
        const setAttr: { value: string; label: string } = {
            value: '',
            label: '',
        };

        const themeSettings = dezThemeSet[theme];

        body.setAttribute('data-typography', themeSettings.typography);

        setAttr.value = themeSettings.version;
        changeBackground(setAttr);

        setAttr.value = themeSettings.layout;
        changeSideBarLayout(setAttr);

        //setAttr.value = themeSettings.primary;
        changePrimaryColor(themeSettings.primary!);

        //setAttr.value = themeSettings.navheaderBg;
        changeNavigationHader(themeSettings.navheaderBg);

        //setAttr.value = themeSettings.headerBg;
        chnageHaderColor(themeSettings.headerBg);

        setAttr.value = themeSettings.sidebarStyle;
        changeSideBarStyle(setAttr);

        //setAttr.value = themeSettings.sidebarBg;
        chnageSidebarColor(themeSettings.sidebarBg);

        setAttr.value = themeSettings.sidebarPosition;
        changeSideBarPostion(setAttr);

        setAttr.value = themeSettings.headerPosition;
        changeHeaderPostion(setAttr);

        setAttr.value = themeSettings.containerLayout;
        changeContainerPosition(setAttr);

        //setAttr.value = themeSettings.direction;
        setAttr.value = direction;
        changeDirectionLayout(setAttr);
    };

    useEffect(() => {
        const body = document.querySelector('body');
        if (!body) return;
        body.setAttribute('data-typography', 'poppins');
        const savedTheme = localStorage.getItem('swiftflitz:theme');
        body.setAttribute(
            'data-theme-version',
            savedTheme === 'dark' ? 'dark' : 'light'
        );
        body.setAttribute('data-layout', 'vertical');
        body.setAttribute('data-primary', 'color_1');
        body.setAttribute('data-nav-headerbg', 'color_1');
        body.setAttribute('data-headerbg', 'color_1');
        body.setAttribute('data-sidebar-style', 'overlay');
        body.setAttribute('data-sidebarbg', 'color_1');
        body.setAttribute('data-primary', 'color_1');
        body.setAttribute('data-sidebar-position', 'fixed');
        body.setAttribute('data-header-position', 'fixed');
        body.setAttribute('data-container', 'wide');
        body.setAttribute('direction', 'ltr');
        const resizeWindow = () => {
            setWindowWidth(window.innerWidth);
            setWindowHeight(window.innerHeight);
            if (window.innerWidth >= 768 && window.innerWidth < 1024) {
                body.setAttribute('data-sidebar-style', 'mini');
            } else if (window.innerWidth <= 768) {
                body.setAttribute('data-sidebar-style', 'overlay');
            } else {
                body.setAttribute('data-sidebar-style', 'full');
            }
        };
        resizeWindow();
        window.addEventListener('resize', resizeWindow);
        return () => window.removeEventListener('resize', resizeWindow);
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                body,
                sideBarOption,
                layoutOption,
                backgroundOption,
                sidebarposition,
                headerPositions,
                containerPosition,
                directionPosition,
                fontFamily,
                primaryColor,
                navigationHader,
                windowWidth,
                windowHeight,
                changePrimaryColor,
                changeNavigationHader,
                changeSideBarStyle,
                sideBarStyle,
                changeSideBarPostion,
                sidebarpositions,
                changeHeaderPostion,
                headerposition,
                changeSideBarLayout,
                sidebarLayout,
                changeDirectionLayout,
                changeContainerPosition,
                direction,
                colors,
                haderColor,
                chnageHaderColor,
                chnageSidebarColor,
                sidebarColor,
                iconHover,
                ChangeIconSidebar,
                sidebariconHover,
                menuToggle,
                openMenuToggle,
                changeBackground,
                background,
                containerPosition_,
                setDemoTheme,
            }}
        >
            {props.children}
        </ThemeContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeContext = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error(
            'useThemeContext must be used within a ThemeContextProvider'
        );
    }
    return context;
};
