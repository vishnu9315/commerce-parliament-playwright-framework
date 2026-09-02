import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { QuestionListPage } from '../../pages/QuestionListPage';
import { QuestionDetailPage } from '../../pages/QuestionDetailPage';
import { seededQuestions } from '../../test-data/questions';

test.use({ role: roles.superAdmin });

test.describe('Completed question lifecycle placement @regression @questions @critical', () => {
  const completed = seededQuestions.eGovernanceServicesMumbai;

  test('CMP-002: should list a completed question in Completed Questions with the correct status @regression @questions @critical @completion', async ({
    page,
  }) => {
    const completedList = new QuestionListPage(page, '/v2/parliament/completed-questions');
    await completedList.goto();

    await expect(completedList.rowByDiaryNo(completed.diaryNo)).toBeVisible();
    await expect(completedList.statusCellOf(completed.diaryNo)).toHaveText('Completed');
  });

  test('ADM-002: should remove completed question from active admitted questions @regression @questions @critical', async ({
    page,
  }) => {
    // Live-reproduced Bug Sheet DEF-081: a question already marked Completed by
    // Parliament was still showing up in the Admitted Questions list.
    const admittedList = new QuestionListPage(page, '/v2/parliament/admitted-questions');
    await admittedList.goto();

    const stillInAdmitted = await admittedList.isDiaryNoVisible(completed.diaryNo);
    expect(
      stillInAdmitted,
      `D. No. ${completed.diaryNo} is Completed and should no longer appear in the active Admitted Questions list (Bug Sheet DEF-081)`,
    ).toBe(false);
  });
});

test.describe('Provisional Questions list scope @regression @questions', () => {
  test('QST-003: should only list Provisional-type questions on the Provisional Questions page @regression @questions', async ({
    page,
  }) => {
    const list = new QuestionListPage(page, '/v2/parliament/provisional-questions');
    await list.goto();
    await expect(list.rows.first()).toBeVisible();

    const questionTypeCells = await list.rows.locator('td').nth(3).allInnerTexts();
    for (const questionType of questionTypeCells) {
      expect(questionType.trim()).toBe('Provisional');
    }
  });
});

test.describe('Assigned Questions list scope @regression @questions', () => {
  test('ASN-002: should exclude completed questions from the Assigned Questions list @regression @questions @assignment', async ({
    page,
  }) => {
    const list = new QuestionListPage(page, '/v2/parliament/questions');
    await list.goto();
    await expect(list.rows.first()).toBeVisible();

    const completed = seededQuestions.eGovernanceServicesMumbai;
    const completedStillAssigned = await list.isDiaryNoVisible(completed.diaryNo);
    expect(
      completedStillAssigned,
      `D. No. ${completed.diaryNo} is already Completed and should not appear in Assigned Questions`,
    ).toBe(false);
  });
});

test.describe('Question Detail sub-question and journey consistency @regression @questions', () => {
  test('QST-004: should render all four sub-question parts with a status for each @regression @questions', async ({
    page,
  }) => {
    const question = seededQuestions.usTariffAgriProducts;
    const list = new QuestionListPage(page, '/v2/parliament/questions');
    await list.goto();
    await list.openQuestion(question.diaryNo);

    for (const part of ['Part (A)', 'Part (B)', 'Part (C)', 'Part (D)']) {
      await expect(page.getByText(part, { exact: true })).toBeVisible();
    }
    // At least one part had been answered and at least one was still pending
    // at capture time. Exact per-part status can shift as the shared demo
    // environment is used by others, so this only asserts both states exist,
    // not which specific part holds which.
    await expect(page.getByText('Answer received').first()).toBeVisible();
    await expect(page.getByText('Answer pending').first()).toBeVisible();
  });

  test('QST-005: should show a Movement Timeline with the question-created and assignment events @regression @questions @workflow', async ({
    page,
  }) => {
    const question = seededQuestions.eGovernanceServicesMumbai;
    const list = new QuestionListPage(page, '/v2/parliament/completed-questions');
    await list.goto();
    await list.openQuestion(question.diaryNo);

    const detail = new QuestionDetailPage(page);
    await expect(detail.movementTimelineHeading).toBeVisible();
    await expect(page.getByText('Question created')).toBeVisible();
    await expect(page.getByText('Marked as admitted')).toBeVisible();
    await expect(page.getByText('Completed by Parliament')).toBeVisible();
  });

  test('QST-006: should keep the overall status badge consistent with the Question Journey narrative @regression @questions', async ({
    page,
  }) => {
    // DEF-012-style consistency check: a question described by its own journey
    // sentence as still having pending/in-progress parts should not carry a
    // "Completed" headline badge, and vice-versa.
    const question = seededQuestions.eGovernanceServicesMumbai;
    const list = new QuestionListPage(page, '/v2/parliament/completed-questions');
    await list.goto();
    await list.openQuestion(question.diaryNo);

    const detail = new QuestionDetailPage(page);
    await expect(detail.statusBadge).toHaveText('Completed');
    await expect(page.getByText(/marked this question as Completed/)).toBeVisible();
  });
});

test.describe('Final Consolidated Answer @regression @questions', () => {
  test('ANS-002: should offer a Download control for the Final Consolidated Answer @regression @questions @answer', async ({
    page,
  }) => {
    const question = seededQuestions.eGovernanceServicesMumbai;
    const list = new QuestionListPage(page, '/v2/parliament/completed-questions');
    await list.goto();
    await list.openQuestion(question.diaryNo);

    await expect(page.getByText('Final Answer PDF recorded')).toBeVisible();
    await expect(page.getByRole('link', { name: /LS Admiited version questions/ })).toBeVisible();
  });
});
