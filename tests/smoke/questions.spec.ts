import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { QuestionListPage } from '../../pages/QuestionListPage';
import { QuestionDetailPage } from '../../pages/QuestionDetailPage';
import { seededQuestions } from '../../test-data/questions';

test.describe('Question lifecycle lists load @smoke @questions', () => {
  test.use({ role: roles.superAdmin });

  test('QST-001: should load the Provisional Questions list with its table header @smoke @questions', async ({
    page,
  }) => {
    const list = new QuestionListPage(page, '/v2/parliament/provisional-questions');
    await list.goto();
    await expect(page.getByRole('heading', { name: 'Provisional Questions' })).toBeVisible();
    await expect(list.table.getByRole('columnheader', { name: 'Diary no.' })).toBeVisible();
  });

  test('ADM-001: should load the Admitted Questions list with its table header @smoke @questions', async ({
    page,
  }) => {
    const list = new QuestionListPage(page, '/v2/parliament/admitted-questions');
    await list.goto();
    await expect(page.getByRole('heading', { name: 'Admitted Questions' })).toBeVisible();
    await expect(list.table.getByRole('columnheader', { name: 'Diary no.' })).toBeVisible();
  });

  test('ASN-001: should load the Assigned Questions list with its table header @smoke @questions @assignment', async ({
    page,
  }) => {
    const list = new QuestionListPage(page, '/v2/parliament/questions');
    await list.goto();
    await expect(page.getByRole('heading', { name: 'Assigned Questions' })).toBeVisible();
    await expect(list.table.getByRole('columnheader', { name: 'Diary no.' })).toBeVisible();
  });

  test('CMP-001: should load the Completed Questions list with at least one record @smoke @questions @completion', async ({
    page,
  }) => {
    const list = new QuestionListPage(page, '/v2/parliament/completed-questions');
    await list.goto();
    await expect(page.getByRole('heading', { name: 'Completed Questions' })).toBeVisible();
    // The table populates asynchronously after the page shell renders - wait for
    // the first row rather than reading rowCount() before data has arrived.
    await expect(list.rows.first()).toBeVisible();
    expect(await list.rowCount()).toBeGreaterThan(0);
  });

  test('QST-002: should open Question Detail from a list row and render all sub-question parts @smoke @questions', async ({
    page,
  }) => {
    const question = seededQuestions.usTariffAgriProducts;
    const list = new QuestionListPage(page, '/v2/parliament/questions');
    await list.goto();
    await list.openQuestion(question.diaryNo);

    const detail = new QuestionDetailPage(page);
    await expect(detail.heading).toBeVisible();
    await expect(page.getByText('Part (A)')).toBeVisible();
    await expect(page.getByText('Part (B)')).toBeVisible();
  });
});
