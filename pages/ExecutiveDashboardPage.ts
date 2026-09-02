import { type Locator, type Page } from '@playwright/test';

/** /v2/parliament/executive-dashboard - Parliament Super Admin / Parliament User / Joint Secretary / Director. */
export class ExecutiveDashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/v2/parliament/executive-dashboard');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Executive Dashboard' });
  }

  get scopeSelector(): Locator {
    return this.page.getByRole('button', { name: /Dashboard scope:/ });
  }

  async openScopeSelector() {
    await this.scopeSelector.click();
  }

  scopeOption(name: string): Locator {
    return this.page
      .getByRole('listbox', { name: 'Dashboard scope' })
      .getByRole('button', { name });
  }

  kpiCard(name: string): Locator {
    return this.page.getByRole('link', { name: new RegExp(`^View ${name}`) });
  }
}
