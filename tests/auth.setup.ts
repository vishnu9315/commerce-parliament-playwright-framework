import fs from 'node:fs';
import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getRoles } from '../fixtures/roles';
import { sessionStorageSidecarPath } from '../fixtures/sessionStorage';

const roles = getRoles();

for (const role of Object.values(roles)) {
  setup(`authenticate as ${role.name}`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.signInAs(role.email);

    if (role.isDepartmentRole) {
      await loginPage.chooseDepartmentUserRole();
    }

    await page.context().storageState({ path: role.storageStatePath });

    // The app keeps its active-role marker in sessionStorage (e.g.
    // `parliamentAppStore`), which Playwright's storageState() does not capture
    // (only cookies + localStorage are persisted). Without reseeding this,
    // role-resolution routes like the Executive Dashboard bounce a restored
    // session back to the sign-in screen. Persist it alongside storageState so
    // the `role`-aware fixture (fixtures/test.ts) can replay it via
    // context.addInitScript() in every test.
    const sessionStorageData = await page.evaluate(() => ({ ...window.sessionStorage }));
    fs.writeFileSync(
      sessionStorageSidecarPath(role.storageStatePath),
      JSON.stringify(sessionStorageData),
    );
  });
}
