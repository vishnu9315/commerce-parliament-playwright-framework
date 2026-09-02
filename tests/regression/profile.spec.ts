import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { ProfilePage } from '../../pages/ProfilePage';

test.use({ role: roles.divisionUser });

test.describe('Division Profile @regression @profile', () => {
  test('PRF-001: should show read-only identity fields and an editable division description @regression @profile', async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await expect(profile.heading).toBeVisible();

    await expect(profile.nameField).toBeDisabled();
    await expect(profile.emailField).toBeDisabled();
    await expect(profile.mobileField).toBeDisabled();
    await expect(profile.emailField).toHaveValue('divisionuser@gmail.com');

    await expect(profile.descriptionField).toBeEditable();
    await expect(profile.saveDescriptionButton).toBeVisible();
  });

  test('PRF-002: should offer a document upload control on the division profile @regression @profile', async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.uploadDocumentButton).toBeVisible();
  });
});
