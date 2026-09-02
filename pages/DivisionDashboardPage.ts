import { type Locator, type Page } from '@playwright/test';

/** /v2/department/dashboard - "My Division Dashboard" for Department/Division users. */
export class DivisionDashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/v2/department/dashboard');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'My Division Dashboard' });
  }

  kpiCard(name: string): Locator {
    return this.page.getByRole('link', { name: new RegExp(`^View ${name}`) });
  }

  /** The number badge on a KPI card, e.g. "Completed Questions" -> "1". */
  kpiCount(name: string): Locator {
    return this.kpiCard(name).locator('p').last();
  }

  get navItems(): Locator {
    return this.page.getByRole('navigation').getByRole('link');
  }
}
