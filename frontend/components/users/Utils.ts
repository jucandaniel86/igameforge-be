import type { BreadcrumbType } from "~/app/types";

export const USERS_BRANDCRUMBS: BreadcrumbType[] = [
  {
    title: "Dashboard",
    disabled: false,
    to: "/",
  },
  {
    title: "Users",
    disabled: true,
  },
];

export const ROLES_BREADCRUMBS: BreadcrumbType[] = [
  {
    title: "Dashboard",
    disabled: false,
    to: "/",
  },
  {
    title: "Users Administration",
    disabled: false,
    to: "/users",
  },
  {
    title: "Roles",
    disabled: true,
  },
];

export const PERMISSIONS_BREADCRUMBS: BreadcrumbType[] = [
  {
    title: "Dashboard",
    disabled: false,
    to: "/",
  },
  {
    title: "Users Administration",
    disabled: false,
    to: "/users",
  },
  {
    title: "Permissions",
    disabled: true,
  },
];

export const CURRENCIES_BREADCRUMBS: BreadcrumbType[] = [
  {
    title: "Dashboard",
    disabled: false,
    to: "/",
  },
  {
    title: "Currencies",
    disabled: true,
  },
];

export const GAMESYNC_BREADCRUMBS: BreadcrumbType[] = [
  {
    title: "Dashboard",
    disabled: false,
    to: "/",
  },
  {
    title: "Games Sync",
    disabled: true,
  },
];

export type UserType = {
  name: string;
  email: string;
  id: number;
  created_at: string;
  role_id?: number | null;
  role_name?: string | null;
};

export function debounce(func: any, timeout: number) {
  let timeoutId: any;
  return (...args: any) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}
