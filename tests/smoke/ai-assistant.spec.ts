import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { AiAssistantPage } from '../../pages/AiAssistantPage';

test.describe('AI Assistant @smoke @ai-assistant', () => {
  test.use({ role: roles.superAdmin });

  test('ANS-001: should load the AI Assistant with an interactable question input @smoke @ai-assistant @answer', async ({
    page,
  }) => {
    const assistant = new AiAssistantPage(page);
    await assistant.goto();
    await expect(assistant.heading).toBeVisible();
    await expect(assistant.questionInput).toBeEditable();
  });
});
