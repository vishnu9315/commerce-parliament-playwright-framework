import { type Locator, type Page } from '@playwright/test';

/** /v2/upload - reached via the "Upload Provisional/Admitted Questions" button. */
export class UploadQuestionPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /Upload .*Questions/ });
  }

  get browseFileButton(): Locator {
    return this.page.getByRole('button', { name: 'Browse File' });
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit' });
  }

  async chooseFile(filePath: string) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.browseFileButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }
}
