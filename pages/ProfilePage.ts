import { type Locator, type Page } from '@playwright/test';

/** /v2/department/profile */
export class ProfilePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/v2/department/profile');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Profile', exact: true });
  }

  get nameField(): Locator {
    return this.page.getByRole('textbox', { name: 'Name' });
  }

  get emailField(): Locator {
    return this.page.getByRole('textbox', { name: 'Email' });
  }

  get mobileField(): Locator {
    return this.page.getByRole('textbox', { name: 'Mobile' });
  }

  get descriptionField(): Locator {
    return this.page.getByRole('textbox', { name: 'Description' });
  }

  get saveDescriptionButton(): Locator {
    return this.page.getByRole('button', { name: 'Save description' });
  }

  get uploadDocumentButton(): Locator {
    return this.page.getByRole('button', { name: 'Upload document' });
  }
}
