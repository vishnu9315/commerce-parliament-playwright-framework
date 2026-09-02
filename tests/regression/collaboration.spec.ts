import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';

test.use({ role: roles.divisionUser });

test.describe('Input Collaboration Received @regression @collaboration', () => {
  test('COL-001: should match the Division Dashboard collaboration KPI to the Received tab count @regression @collaboration', async ({
    page,
  }) => {
    await page.goto('/v2/department/dashboard');

    const kpiCard = page.getByRole('link', { name: /^View Input Collaboration Received/ });
    const kpiCount = kpiCard.locator('p').last();
    await expect(kpiCount).not.toHaveText('—');
    const kpiValue = (await kpiCount.innerText()).trim();

    await page.goto('/v2/department/collaboration-requests');
    await expect(page.getByRole('heading', { name: 'Input Collaboration Received' })).toBeVisible();

    // The Received tab's own label carries its count, e.g. "Received · 0".
    const receivedTab = page.getByRole('button', { name: /^Received/ });
    await expect(receivedTab).toHaveText(`Received · ${kpiValue}`);
  });
});
