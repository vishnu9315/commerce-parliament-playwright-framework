import fs from 'node:fs';
import { test as base } from '@playwright/test';
import { getRoles, type RoleConfig } from './roles';
import { sessionStorageSidecarPath } from './sessionStorage';

const roles = getRoles();

/**
 * Extends the base test with a `role` option. Setting `role` (via
 * `test.use({ role: roles.divisionUser })`) both selects that role's
 * storageState AND reseeds the sessionStorage marker the app relies on for
 * role-resolution routes (see tests/auth.setup.ts for why this is necessary).
 *
 * Defaults to the Super Admin role so specs that don't care about role can use
 * this `test` unchanged.
 */
export const test = base.extend<{ role: RoleConfig }>({
  role: [roles.superAdmin, { option: true }],

  storageState: async ({ role }, use) => {
    await use(role.storageStatePath);
  },

  context: async ({ context, role }, use) => {
    const sessionPath = sessionStorageSidecarPath(role.storageStatePath);
    if (fs.existsSync(sessionPath)) {
      const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8')) as Record<
        string,
        string
      >;
      await context.addInitScript((data) => {
        for (const [key, value] of Object.entries(data)) {
          window.sessionStorage.setItem(key, value);
        }
      }, sessionData);
    }
    await use(context);
  },
});

export { expect } from '@playwright/test';
export { roles };
