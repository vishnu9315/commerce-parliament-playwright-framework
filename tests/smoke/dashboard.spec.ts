import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { ExecutiveDashboardPage } from '../../pages/ExecutiveDashboardPage';

test.describe('Dashboards load with their key surfaces visible @smoke @dashboard', () => {
  test.use({ role: roles.superAdmin });

  test('DASH-001: should display the Executive Dashboard KPI cards @smoke @dashboard', async ({
    page,
  }) => {
    const dashboard = new ExecutiveDashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.heading).toBeVisible();
    await expect(dashboard.kpiCard('Admitted Questions')).toBeVisible();
    await expect(dashboard.kpiCard('Provisional Questions')).toBeVisible();
  });
});
