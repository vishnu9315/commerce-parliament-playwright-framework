import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { QuestionListPage } from '../../pages/QuestionListPage';
import { seededQuestions } from '../../test-data/questions';

test.use({ role: roles.superAdmin });

test.describe('House filter @regression @questions @filters', () => {
  test('NAV-001: should narrow the Admitted Questions list by House filter @regression @questions @filters', async ({
    page,
  }) => {
    const question = seededQuestions.eGovernanceServicesMumbai; // Lok Sabha
    const list = new QuestionListPage(page, '/v2/parliament/admitted-questions');
    await list.goto();
    await expect(list.rowByDiaryNo(question.diaryNo)).toBeVisible();

    await list.filterByHouse('Rajya Sabha');
    await expect(list.rowByDiaryNo(question.diaryNo)).toHaveCount(0);

    await list.filterByHouse('Lok Sabha');
    await expect(list.rowByDiaryNo(question.diaryNo)).toBeVisible();
  });
});

test.describe('Sitting date filter @regression @questions @filters', () => {
  test('NAV-002: should narrow the Completed Questions list by sitting date and reset @regression @questions @filters', async ({
    page,
  }) => {
    const question = seededQuestions.eGovernanceServicesMumbai; // sitting 2026-08-12
    const otherQuestion = seededQuestions.indiaUsDigitalTradeProvisions; // different sitting

    const list = new QuestionListPage(page, '/v2/parliament/completed-questions');
    await list.goto();
    await expect(list.rows.first()).toBeVisible();
    await expect(list.rowByDiaryNo(otherQuestion.diaryNo)).toBeVisible();

    const sittingDateInput = page.getByRole('textbox').first();
    await sittingDateInput.fill('2026-08-12');
    await expect(list.rowByDiaryNo(question.diaryNo)).toBeVisible();
    await expect(list.rowByDiaryNo(otherQuestion.diaryNo)).toHaveCount(0);

    await sittingDateInput.fill('');
    await expect(list.rowByDiaryNo(otherQuestion.diaryNo)).toBeVisible();
  });
});
