export type SubMenuItemType = {
  label: string;
  link?: string;
  id?: string;
  prefix?: string;
  subMenu?: SubMenuItemType[];
};

export type MenuItemType = {
  label: string;
  link?: string;
  isHeader?: boolean;
  icon?: string;
  id: string;
  prefix?: string;
  subMenu?: SubMenuItemType[];
};

export type BreadcrumbType = {
  title: string;
  disabled: boolean;
  to?: string;
};

export type OptionType = {
  title: string;
  value: string;
  icon?: string;
  to?: string;
};

export type ReportHeadersData = {
  title: string;
  align?: string | undefined;
  sortable?: boolean | undefined;
  value: string;
  width?: (number | string) | undefined;
  key?: any;
};
