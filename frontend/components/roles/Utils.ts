export type RoleType = {
  id: number;
  name: string;
  guard_name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PermissionType = {
  id: number;
  name: string;
  guard_name: string;
  resource: string | null;
  action: string | null;
  description: string | null;
  created_at?: string;
  updated_at?: string;
};

