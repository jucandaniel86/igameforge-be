export type RoleType = {
  id: number;
  name: string;
  guardName: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PermissionType = {
  id: number;
  name: string;
  guardName: string;
  resource: string | null;
  action: string | null;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
};

