import { type Locator, type Page } from '@playwright/test';

/** /v2/parliament/secretary-dashboard - ministry-wide briefing for the Secretary. */
export class SecretaryDashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/v2/parliament/secretary-dashboard');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Secretary Dashboard' });
  }

  get divisionWiseBreakupTable(): Locator {
    return this.page.getByRole('table');
  }

  get divisionWiseBreakupRows(): Locator {
    return this.divisionWiseBreakupTable.locator('tbody tr');
  }
}
