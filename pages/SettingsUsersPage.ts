import { type Locator, type Page } from '@playwright/test';

/** /v2/parliament/settings/users - Super Admin only. */
export class SettingsUsersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/v2/parliament/settings/users');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Add Users' });
  }

  get accessFilter(): Locator {
    return this.page.getByRole('combobox', { name: 'Access' });
  }

  userListItem(nameOrEmail: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: nameOrEmail });
  }

  async filterByAccess(option: 'All' | 'Parliament' | 'Division' | 'Parliament + Division') {
    await this.accessFilter.selectOption({ label: option });
  }
}
