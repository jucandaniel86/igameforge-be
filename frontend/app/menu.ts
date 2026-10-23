import { type MenuItemType } from "@/app/types";

export const menuItems: MenuItemType[] = [
  {
    label: "Menu",
    isHeader: true,
    id: "HeaderMenu",
  },
  {
    label: "Dashboard",
    id: "sideBarDashboard",
    icon: "mdi-view-dashboard-outline",
    link: "/",
  },
  {
    label: "Games Resources",
    id: "sidebarGameResources",
    icon: "mdi-poker-chip",
    link: "/resources",
  },
  {
    label: "Users Administration",
    id: "sideBarUsers",
    icon: "mdi-account-group-outline",
    subMenu: [
      {
        label: "Users",
        id: "sideBarUsers",
        link: "/users",
      },
      {
        label: "Roles",
        id: "sideBarRoles",
        link: "/users/roles",
      },
      {
        label: "Permissions",
        id: "sideBarPermissions",
        link: "/users/permissions",
      },
    ],
  },
  {
    label: "Settings",
    id: "sideBarSettings",
    icon: "mdi-cog-outline",
    subMenu: [
      {
        label: "Games/Operators Sync",
        id: "sidebarGameOperatorsSync",
        link: "/games-operators-sync",
      },
    ],
  },
];

export const setAttributes = (key: string, value: string) => {
  document.documentElement.setAttribute(key, value);
};
