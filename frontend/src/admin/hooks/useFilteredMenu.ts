import { useMemo } from 'react';
import type { SideBarItems } from '../types';
import { useAuth } from '@/shared/context';

export const useFilteredMenu = (menuItems: SideBarItems[]): SideBarItems[] => {
    const { hasRole, hasAnyPermission } = useAuth();

    return useMemo(() => {
        const hasAccess = (item: SideBarItems): boolean => {
            //? check role requirement
            if (item.role) {
                const roles = Array.isArray(item.role)
                    ? item.role
                    : [item.role];
                if (!hasRole?.(roles)) return false; //? user doesn't have required role, filter out
            }

            //? check permission requirement - treat null as explicitly ungated
            if (item.permission !== undefined && item.permission !== null) {
                const permisions = Array.isArray(item.permission)
                    ? item.permission
                    : [item.permission];
                if (!hasAnyPermission?.(permisions)) return false; //? user doesn't have required permission, filter out
            }

            return true; //? no role or permission requirement, include in menu
        };

        const filterMenu = (items: SideBarItems[]): SideBarItems[] => {
            return items
                .filter(
                    item => item.classChange === 'menu-title' || hasAccess(item)
                )
                .map(item => ({
                    ...item,
                    //? recursively filter sub-menu items if they exist
                    content: item.content
                        ? filterMenu(item.content)
                        : undefined,
                }))
                .filter((item, index, array) => {
                    //? remove menu items with no visible children
                    if (item.content !== undefined && item.content.length === 0)
                        return false;

                    //? remove menu title if the next item is also a menu title or last item
                    if (item.classChange === 'menu-title') {
                        const nextItem = array[index + 1];
                        if (!nextItem || nextItem.classChange === 'menu-title')
                            return false;
                    }

                    return true;
                });
        };

        return filterMenu(menuItems);
    }, [menuItems, hasRole, hasAnyPermission]);
};
