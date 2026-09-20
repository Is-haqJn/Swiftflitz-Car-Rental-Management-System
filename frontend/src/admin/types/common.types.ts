import { type JSX } from 'react';

export interface SideBarItems {
    title: string;
    to?: string;
    iconStyle?: JSX.Element;
    className?: string;
    classChange?: string;
    update?: string;
    content?: SideBarItems[];
    hasMenu?: boolean;
    //! for toggling items based on permission and role
    permission?: string | string[] | null;
    role?: string | string[] | null;
}
