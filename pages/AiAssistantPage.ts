import { type Locator, type Page } from '@playwright/test';

/** /ai-assistant - full-page chatbot, separate from the in-question "Draft with AI". */
export class AiAssistantPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/ai-assistant');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Parliamentary Questions Assistant' });
  }

  get questionInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Your question' });
  }

  get sendButton(): Locator {
    return this.page.getByRole('button', { name: 'Send' });
  }

  get newChatButton(): Locator {
    return this.page.getByRole('button', { name: 'New chat' });
  }

  /** State lives on the (visually hidden) native checkbox. */
  get knowledgeBaseToggle(): Locator {
    return this.page.getByRole('checkbox', { name: 'Knowledge base' });
  }

  /** The clickable, visible wrapper around the hidden checkbox above. */
  get knowledgeBaseToggleControl(): Locator {
    return this.page.getByTitle(
      'Answer from the parliamentary record. Switch off to answer only from what you attach.',
    );
  }

  get recentsPanel(): Locator {
    return this.page.getByText('Recents');
  }

  async ask(question: string) {
    await this.questionInput.fill(question);
    await this.sendButton.click();
  }
}
