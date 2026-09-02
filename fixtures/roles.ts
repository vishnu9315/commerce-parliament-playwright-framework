/**
 * The four role shapes genuinely exercised by the regression suite (see
 * docs/test-strategy.md). Each maps to one dev sign-in email (from env) and one
 * storageState file produced by tests/auth.setup.ts.
 *
 * Deliberately NOT one role per test account that exists in the portal - only the
 * roles whose behavior actually differs and is asserted on.
 */
export type RoleName = 'superAdmin' | 'secretary' | 'jointSecretaryMultiDivision' | 'divisionUser';

export interface RoleConfig {
  name: RoleName;
  email: string;
  storageStatePath: string;
  /** True for accounts that land on the department role-picker after sign-in. */
  isDepartmentRole: boolean;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getRoles(): Record<RoleName, RoleConfig> {
  return {
    superAdmin: {
      name: 'superAdmin',
      email: requireEnv('SUPER_ADMIN_EMAIL'),
      storageStatePath: 'playwright/.auth/super-admin.json',
      isDepartmentRole: false,
    },
    secretary: {
      name: 'secretary',
      email: requireEnv('SECRETARY_EMAIL'),
      storageStatePath: 'playwright/.auth/secretary.json',
      isDepartmentRole: false,
    },
    jointSecretaryMultiDivision: {
      name: 'jointSecretaryMultiDivision',
      email: requireEnv('JOINT_SECRETARY_MULTI_DIVISION_EMAIL'),
      storageStatePath: 'playwright/.auth/joint-secretary-multi-division.json',
      isDepartmentRole: false,
    },
    divisionUser: {
      name: 'divisionUser',
      email: requireEnv('DIVISION_USER_EMAIL'),
      storageStatePath: 'playwright/.auth/division-user.json',
      isDepartmentRole: true,
    },
  };
}
