import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { LoginPage } from '../../pages/LoginPage';
import { ExecutiveDashboardPage } from '../../pages/ExecutiveDashboardPage';
import { DivisionDashboardPage } from '../../pages/DivisionDashboardPage';
import { SecretaryDashboardPage } from '../../pages/SecretaryDashboardPage';

// No storageState here: the "/" route always renders the dev sign-in form (it
// does not auto-redirect an already-authenticated session), so a fresh sign-in
// is the only way to observe the redirect-on-login behavior itself.
const unauthenticated = { storageState: { cookies: [], origins: [] } };

test.describe('Sign-in redirects to the correct landing screen @smoke @auth', () => {
  test.use(unauthenticated);

  test('AUTH-001: should redirect Super Admin sign-in to the Executive Dashboard @smoke @auth', async ({
    page,
  }) => {
    await new LoginPage(page).signInAs(roles.superAdmin.email);
    await expect(page).toHaveURL(/executive-dashboard/);
    await expect(new ExecutiveDashboardPage(page).heading).toBeVisible();
  });

  test('AUTH-002: should show the role picker then the Division Dashboard for a Division-only sign-in @smoke @auth', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.signInAs(roles.divisionUser.email);
    await expect(page.getByText('Select your role to continue')).toBeVisible();

    await loginPage.chooseDepartmentUserRole();
    await expect(page).toHaveURL(/department\/dashboard/);
    await expect(new DivisionDashboardPage(page).heading).toBeVisible();
  });
});

test.describe('Authenticated session reuse @smoke @auth', () => {
  test.use({ role: roles.secretary });

  test('AUTH-003: should open the Secretary Dashboard directly from a saved session @smoke @auth', async ({
    page,
  }) => {
    const dashboard = new SecretaryDashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.heading).toBeVisible();
  });
});

test.describe('Logout @smoke @auth', () => {
  test.use({ role: roles.superAdmin });

  test('AUTH-004: should clear the session on logout and block a protected route @smoke @auth', async ({
    page,
  }) => {
    await page.goto('/v2/parliament/executive-dashboard');
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    await new LoginPage(page).expectSignedOut();

    await page.goto('/v2/parliament/executive-dashboard');
    await new LoginPage(page).expectSignedOut();
  });
});
