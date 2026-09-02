import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { requireEnv } from '../../fixtures/roles';
import { LoginPage } from '../../pages/LoginPage';
import { DivisionDashboardPage } from '../../pages/DivisionDashboardPage';

test.describe('Division user cannot reach Parliament-only routes @regression @rbac @critical', () => {
  test.use({ role: roles.divisionUser });

  test('AUTH-005: should hide Parliament-only nav items from a Division user @regression @rbac @auth @critical', async ({
    page,
  }) => {
    const dashboard = new DivisionDashboardPage(page);
    await dashboard.goto();

    const navText = await dashboard.navItems.allInnerTexts();
    for (const parliamentOnlyItem of ['Assigned Questions', 'E-File Processed', 'Settings']) {
      expect(navText.join(' | ')).not.toContain(parliamentOnlyItem);
    }
  });

  test('AUTH-006: should block a Division-only account from the Parliament Executive Dashboard @regression @rbac @auth @critical', async ({
    page,
  }) => {
    // The account has no Parliament membership, so this route should not show
    // parliament-only content even if reached directly by URL.
    await page.goto('/v2/parliament/executive-dashboard');
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).not.toBeVisible();
  });
});

test.describe('Settings is Super Admin-only @regression @rbac', () => {
  // A genuinely blank session is required here: an authenticated session (the
  // default role fixture) makes "/" redirect straight to that role's
  // dashboard instead of rendering the sign-in form - see the "Sign-in
  // redirects" smoke tests for the same behavior used deliberately.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('AUTH-007: should hide Settings from a Parliament User without Settings access @regression @rbac @auth', async ({
    page,
  }) => {
    // Signs in fresh rather than via a saved storageState: this role is
    // exercised only by this one check and does not warrant its own
    // storageState file. Parliament-access-only accounts (no dashboard flag)
    // land on a role picker with a "Parliament Section" button, same shape as
    // the Division-only "Department User" picker.
    const loginPage = new LoginPage(page);
    await loginPage.signInAs(requireEnv('PARLIAMENT_USER_EMAIL'));
    await loginPage.chooseRole('Parliament Section');

    await expect(page.getByRole('button', { name: 'Settings' })).not.toBeVisible();
  });
});
