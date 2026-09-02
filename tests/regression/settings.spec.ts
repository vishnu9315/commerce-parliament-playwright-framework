import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { SettingsUsersPage } from '../../pages/SettingsUsersPage';

test.use({ role: roles.superAdmin });

test.describe('Settings - user directory @regression @settings', () => {
  test('SET-001: should filter the user list to Division-access users only @regression @settings', async ({
    page,
  }) => {
    const settings = new SettingsUsersPage(page);
    await settings.goto();
    await expect(settings.heading).toBeVisible();

    await settings.filterByAccess('Division');

    // The Secretary account (Parliament-only, no Division membership) should
    // drop out of the list once filtered to Division access.
    await expect(settings.userListItem('secretary@gmail.com')).toHaveCount(0);
    await expect(settings.userListItem('divisionuser@gmail.com')).toBeVisible();
  });

  test('SET-002: should hide Delete for protected Super Admin accounts @regression @settings @rbac', async ({
    page,
  }) => {
    const settings = new SettingsUsersPage(page);
    await settings.goto();

    const protectedUser = settings.userListItem('parliament-admin-user@gmail.com');
    await expect(protectedUser).toBeVisible();
    await expect(protectedUser).toContainText('Protected');
    await expect(protectedUser.getByRole('button', { name: 'Delete user' })).toHaveCount(0);
  });

  test('SET-003: should offer Delete for a non-protected user @regression @settings', async ({
    page,
  }) => {
    const settings = new SettingsUsersPage(page);
    await settings.goto();

    const regularUser = settings.userListItem('divisionuser@gmail.com');
    await expect(regularUser).toBeVisible();
    await expect(regularUser.getByRole('button', { name: 'Delete user' })).toBeVisible();
  });
});
