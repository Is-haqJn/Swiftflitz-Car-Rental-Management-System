const direction = 'ltr';

type ThemeType = {
    typography: string;
    version: string;
    layout: string;
    headerBg: string;
    navheaderBg: string;
    sidebarBg: string;
    sidebarStyle: string;
    sidebarPosition: string;
    headerPosition: string;
    containerLayout: string;
    direction: string;
    primary?: string;
};

export const dezThemeSet: ThemeType[] = [
    {
        /* Default */ typography: 'poppins',
        version: 'light',
        layout: 'vertical',
        headerBg: 'color_1',
        navheaderBg: 'color_1',
        sidebarBg: 'color_1',
        sidebarStyle: 'full',
        sidebarPosition: 'fixed',
        headerPosition: 'fixed',
        containerLayout: 'full',
        direction: direction,
    },
    {
        /* Demo Theme 1 */ typography: 'poppins',
        version: 'light',
        layout: 'vertical',
        navheaderBg: 'color_1',
        headerBg: 'color_1',
        sidebarStyle: 'full',
        sidebarBg: 'color_1',
        sidebarPosition: 'fixed',
        headerPosition: 'fixed',
        containerLayout: 'wide',
        primary: 'color_1',
        direction: direction,
    },
    {
        /* Demo Theme 2 */ typography: 'poppins',
        version: 'light',
        layout: 'horizontal',
        navheaderBg: 'color_1',
        headerBg: 'color_1',
        sidebarStyle: 'modern',
        sidebarBg: 'color_3',
        sidebarPosition: 'static',
        headerPosition: 'fixed',
        containerLayout: 'wide',
        primary: 'color_1',
        direction: direction,
    },
    {
        /* Demo Theme 3 */
        typography: 'poppins',
        version: 'light',
        layout: 'vertical',
        navheaderBg: 'color_1',
        headerBg: 'color_10',
        sidebarStyle: 'compact',
        sidebarBg: 'color_1',
        sidebarPosition: 'fixed',
        headerPosition: 'fixed',
        containerLayout: 'wide',
        primary: 'color_10',
        direction: direction,
    },
    {
        /* Demo Theme 4 */
        typography: 'poppins',
        version: 'light',
        layout: 'vertical',
        navheaderBg: 'color_1',
        headerBg: 'color_1',
        sidebarStyle: 'modern',
        sidebarBg: 'color_15',
        sidebarPosition: 'static',
        headerPosition: 'fixed',
        containerLayout: 'wide',
        primary: 'color_15',
        direction: direction,
    },
    {
        /* Demo Theme 5 */
        typography: 'poppins',
        version: 'light',
        layout: 'vertical',
        navheaderBg: 'color_13',
        headerBg: 'color_1',
        sidebarStyle: 'icon-hover',
        sidebarBg: 'color_13',
        sidebarPosition: 'fixed',
        headerPosition: 'fixed',
        containerLayout: 'wide',
        primary: 'color_13',
        direction: direction,
    },
    {
        /* Demo Theme 6 */
        typography: 'poppins',
        version: 'light',
        layout: 'horizontal',
        navheaderBg: 'color_12',
        headerBg: 'color_12',
        sidebarStyle: 'full',
        sidebarBg: 'color_1',
        sidebarPosition: 'fixed',
        headerPosition: 'fixed',
        containerLayout: 'wide',
        primary: 'color_1',
        direction: direction,
    },
];
