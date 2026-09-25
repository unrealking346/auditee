export type SecurityRole =
  | 'LISTENER'
  | 'ARTIST'
  | 'LABEL'
  | 'DISTRIBUTOR'
  | 'PUBLISHER'
  | 'RIGHTS_ADMIN'
  | 'ROYALTY_OPERATOR'
  | 'ADVERTISER'
  | 'DEVELOPER'
  | 'MODERATOR'
  | 'ADMIN';

export type SecurityAction =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'MODERATE'
  | 'OPERATE_RIGHTS'
  | 'OPERATE_ROYALTIES'
  | 'OPERATE_PAYMENTS';

const permissions: Record<SecurityRole, SecurityAction[]> = {
  LISTENER: ['READ', 'CREATE', 'UPDATE'],
  ARTIST: ['READ', 'CREATE', 'UPDATE', 'PUBLISH'],
  LABEL: ['READ', 'CREATE', 'UPDATE', 'PUBLISH'],
  DISTRIBUTOR: ['READ', 'CREATE', 'UPDATE', 'PUBLISH'],
  PUBLISHER: ['READ', 'CREATE', 'UPDATE'],
  RIGHTS_ADMIN: ['READ', 'OPERATE_RIGHTS'],
  ROYALTY_OPERATOR: ['READ', 'OPERATE_ROYALTIES'],
  ADVERTISER: ['READ', 'CREATE', 'UPDATE'],
  DEVELOPER: ['READ', 'CREATE', 'UPDATE'],
  MODERATOR: ['READ', 'MODERATE'],
  ADMIN: [
    'READ','CREATE','UPDATE','DELETE','PUBLISH','MODERATE',
    'OPERATE_RIGHTS','OPERATE_ROYALTIES','OPERATE_PAYMENTS'
  ]
};

export function can(role: SecurityRole, action: SecurityAction): boolean {
  return permissions[role].includes(action);
}

export function assertAllowed(
  role: SecurityRole,
  action: SecurityAction
): void {
  if (!can(role, action)) {
    throw new Error(`SECURITY_DENIED:${role}:${action}`);
  }
}

export function sanitizeRequestId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 128);
}
