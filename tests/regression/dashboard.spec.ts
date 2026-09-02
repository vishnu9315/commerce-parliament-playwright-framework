import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { ExecutiveDashboardPage } from '../../pages/ExecutiveDashboardPage';
import { SecretaryDashboardPage } from '../../pages/SecretaryDashboardPage';
import { DivisionDashboardPage } from '../../pages/DivisionDashboardPage';
import { QuestionListPage } from '../../pages/QuestionListPage';

test.describe('Secretary Dashboard division-wise visibility @regression @dashboard', () => {
  test.use({ role: roles.secretary });

  test('DASH-002: should render the Secretary Dashboard division-wise breakup table @regression @dashboard', async ({
    page,
  }) => {
    const dashboard = new SecretaryDashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.divisionWiseBreakupTable).toBeVisible();
    await expect(dashboard.divisionWiseBreakupRows.first()).toBeVisible();

    // Every division row should carry a division name in the first cell -
    // guards against a row rendering with blank/undefined division data.
    const firstDivisionCell = dashboard.divisionWiseBreakupRows.first().locator('td').first();
    await expect(firstDivisionCell).not.toHaveText('');
  });
});

test.describe('Joint Secretary multi-division scope switcher @regression @dashboard', () => {
  test.use({ role: roles.jointSecretaryMultiDivision });

  test('DASH-003: should change dashboard scope when a Joint Secretary switches to a division @regression @dashboard', async ({
    page,
  }) => {
    const dashboard = new ExecutiveDashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.scopeSelector).toHaveText('Parliament');
    await dashboard.openScopeSelector();

    // This account has Establishment -I and Cash-I division access (see
    // fixtures/roles.ts / docs/application-overview.md §3).
    await dashboard.scopeOption('Cash-I').click();

    await expect(dashboard.scopeSelector).toHaveText('Cash-I');
  });
});

test.describe('My Division Dashboard KPI accuracy @regression @dashboard', () => {
  test.use({ role: roles.divisionUser });

  test('CMP-003: should match the Division Dashboard Completed Questions KPI to its list count @regression @dashboard @completion', async ({
    page,
  }) => {
    const dashboard = new DivisionDashboardPage(page);
    await dashboard.goto();

    // KPI counts render as a "—" placeholder until an async fetch resolves.
    const completedKpi = dashboard.kpiCount('Completed Questions');
    await expect(completedKpi).not.toHaveText('—');
    const kpiCountText = await completedKpi.innerText();
    const kpiCount = Number(kpiCountText.trim());

    const completedList = new QuestionListPage(page, '/v2/department/confirmed-questions');
    await completedList.goto();

    if (kpiCount === 0) {
      await expect(page.getByText(/no completed questions/i)).toBeVisible();
    } else {
      await expect(completedList.rows.first()).toBeVisible();
      expect(await completedList.rowCount()).toBe(kpiCount);
    }
  });
});

test.describe('Completed Questions header count vs. row count @regression @questions', () => {
  test.use({ role: roles.superAdmin });

  test('NAV-003: should match the Completed Questions header count to its rendered rows @regression @questions', async ({
    page,
  }) => {
    const list = new QuestionListPage(page, '/v2/parliament/completed-questions');
    await list.goto();
    await expect(list.rows.first()).toBeVisible();

    const headerCountText = await list.headingCount(/Completed Questions/).innerText();
    const headerCount = Number(headerCountText.trim());
    const rowCount = await list.rowCount();

    expect(headerCount).toBe(rowCount);
  });
});
