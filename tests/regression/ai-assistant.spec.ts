import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { AiAssistantPage } from '../../pages/AiAssistantPage';

test.use({ role: roles.superAdmin });

test.describe('AI Assistant controls @regression @ai-assistant', () => {
  test('ANS-003: should toggle the AI Assistant Knowledge Base switch on and off @regression @ai-assistant @answer', async ({
    page,
  }) => {
    const assistant = new AiAssistantPage(page);
    await assistant.goto();

    // The native checkbox is visually hidden behind a styled toggle - click
    // its visible wrapper, then assert state on the real (hidden) input.
    await expect(assistant.knowledgeBaseToggle).toBeChecked();
    await assistant.knowledgeBaseToggleControl.click();
    await expect(assistant.knowledgeBaseToggle).not.toBeChecked();
    await assistant.knowledgeBaseToggleControl.click();
    await expect(assistant.knowledgeBaseToggle).toBeChecked();
  });

  test('ANS-004: should show an empty Recents state for a session with no chat history @regression @ai-assistant @answer', async ({
    page,
  }) => {
    // Scoped deliberately narrow: this confirms the empty-state UI renders
    // correctly for a fresh session. It does NOT attempt to prove or disprove
    // Bug Sheet DEF-062 (cross-account chat history leakage), which needs a
    // second account's genuine chat history as a fixture to check against -
    // not available without generating real AI traffic under rate limits.
    // See docs/test-strategy.md for this scoping decision.
    const assistant = new AiAssistantPage(page);
    await assistant.goto();

    await expect(assistant.recentsPanel).toBeVisible();
    await expect(page.getByText('No past chats yet.')).toBeVisible();
  });
});
