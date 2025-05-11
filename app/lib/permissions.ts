export const ROLES = {
  EMPEROR: 'emperor',
  DUKE: 'duke',
  KNIGHT: 'knight',
  CIVILIAN: 'civilian',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const PERMISSIONS = {
  MANAGE_EMAIL: 'manage_email',
  MANAGE_WEBHOOK: 'manage_webhook',
  PROMOTE_USER: 'promote_user',
  MANAGE_CONFIG: 'manage_config',
  MANAGE_API_KEY: 'manage_api_key',
  SEND_EMAIL: 'send_email',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.EMPEROR]: Object.values(PERMISSIONS),
  [ROLES.DUKE]: [
    PERMISSIONS.MANAGE_EMAIL,
    PERMISSIONS.MANAGE_WEBHOOK,
    PERMISSIONS.MANAGE_API_KEY,
    PERMISSIONS.SEND_EMAIL,
  ],
  [ROLES.KNIGHT]: [
    PERMISSIONS.MANAGE_EMAIL,
    PERMISSIONS.MANAGE_WEBHOOK,
    PERMISSIONS.SEND_EMAIL,
  ],
  [ROLES.CIVILIAN]: [],
} as const;

export function hasPermission(userRoles: Role[], permission: Permission): boolean {
  return userRoles.some(role => ROLE_PERMISSIONS[role]?.includes(permission));
} 