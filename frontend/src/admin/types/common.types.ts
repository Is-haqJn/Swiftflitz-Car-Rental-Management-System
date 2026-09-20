import { type JSX } from 'react';

export interface SideBarItems {
    title: string;
    to?: string;
    iconStyle?: JSX.Element;
    classChange?: string;
    hasMenu?: boolean;
    content?: SideBarItems[];
    update?: string;
    className?: string;
}
