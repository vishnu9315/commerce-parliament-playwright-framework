import { type Locator, type Page } from '@playwright/test';

export type House = 'All houses' | 'Lok Sabha' | 'Rajya Sabha';

/**
 * Provisional Questions, Admitted Questions, Assigned Questions and Completed
 * Questions all render the exact same table shape (Diary no. / Subject / House /
 * Question Type / Department / Sitting Date / Due Date / Question Status / Action)
 * on both the Parliament and the Department portals - only the route and the
 * server-side filter differ. One parameterized page object is used instead of
 * four to six near-identical classes.
 */
export class QuestionListPage {
  constructor(
    private readonly page: Page,
    private readonly path: string,
  ) {}

  async goto() {
    await this.page.goto(this.path);
  }

  /** The number shown next to the page heading, e.g. "Admitted Questions 7". */
  headingCount(headingName: RegExp | string): Locator {
    return this.page
      .getByRole('heading', { name: headingName })
      .locator('xpath=following-sibling::*[1]');
  }

  get table(): Locator {
    return this.page.getByRole('table');
  }

  get rows(): Locator {
    return this.table.locator('tbody tr');
  }

  rowByDiaryNo(diaryNo: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name: diaryNo, exact: false }) });
  }

  async rowCount(): Promise<number> {
    return this.rows.count();
  }

  statusCellOf(diaryNo: string): Locator {
    // Question Status is the second-to-last column, immediately before Action.
    return this.rowByDiaryNo(diaryNo).locator('td').nth(-2);
  }

  async filterByHouse(house: House) {
    await this.page.getByRole('button', { name: house, exact: true }).click();
  }

  async openQuestion(diaryNo: string) {
    await this.rowByDiaryNo(diaryNo).getByRole('link', { name: 'View question' }).click();
  }

  async isDiaryNoVisible(diaryNo: string): Promise<boolean> {
    return (await this.rowByDiaryNo(diaryNo).count()) > 0;
  }
}
