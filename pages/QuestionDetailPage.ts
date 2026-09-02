import { type Locator, type Page } from '@playwright/test';

/**
 * Question Detail page, shared shape between the Parliament route
 * (/v2/parliament/questions/{id}) and the Department route
 * (/v2/department/questions/{id}).
 */
export class QuestionDetailPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /Question Detail/ });
  }

  /** The overall status badge shown next to the heading, e.g. "Completed". */
  get statusBadge(): Locator {
    return this.heading.locator('xpath=following-sibling::*[1]');
  }

  get actionsButton(): Locator {
    return this.page.getByRole('button', { name: 'Actions' });
  }

  async openActionsMenu() {
    await this.actionsButton.click();
  }

  actionMenuItem(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** One card per sub-question (Part A, Part B, ...). */
  subQuestionCard(partLabel: string): Locator {
    return this.page.getByText(partLabel, { exact: true }).locator('..');
  }

  get collaborationRequestsCount(): Locator {
    return this.page
      .getByRole('heading', { name: 'Collaboration Requests' })
      .locator('xpath=following-sibling::*[1]');
  }

  get movementTimelineHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Movement Timeline' });
  }

  get downloadFinalAnswerButton(): Locator {
    return this.page.getByRole('button', { name: 'Download' });
  }
}
