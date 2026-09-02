import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';

test.use({ role: roles.divisionUser });

test.describe('Transfer Requests @regression @transfer', () => {
  test('TRF-001: should display independent Incoming and Sent tabs with a clear empty state @regression @transfer', async ({
    page,
  }) => {
    // No seed data exists under the provided accounts for an in-flight
    // transfer (see docs/test-data-strategy.md §6), so this scopes to the
    // honestly-testable baseline: the tabs render and communicate "nothing
    // pending" clearly, rather than silently showing a blank page.
    await page.goto('/v2/department/transfer-requests');

    await expect(page.getByRole('heading', { name: 'Transfer Requests' })).toBeVisible();
    const incomingTab = page.getByRole('button', { name: /Incoming/ });
    const sentTab = page.getByRole('button', { name: /Sent/ });
    await expect(incomingTab).toBeVisible();
    await expect(sentTab).toBeVisible();

    await expect(
      page.getByText('No transferred questions waiting for your acceptance.'),
    ).toBeVisible();

    await sentTab.click();
    await expect(page.getByText('No transfers waiting on another division.')).toBeVisible();
  });
});
