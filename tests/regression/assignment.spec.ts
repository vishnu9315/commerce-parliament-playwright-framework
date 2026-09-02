import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { QuestionListPage } from '../../pages/QuestionListPage';
import { QuestionDetailPage } from '../../pages/QuestionDetailPage';
import { seededQuestions } from '../../test-data/questions';

test.use({ role: roles.superAdmin });

/**
 * Read-only, Parliament-side check - no division login needed and no shared
 * state is mutated. Uses two already-seeded questions rather than performing
 * a live assignment: none of the three divisions we hold test-account
 * credentials for (Export Promotion (Agriculture), Cash-I, Establishment -I)
 * currently has an active question to assign, and the divisions that do
 * (Foreign Trade (NAFTA), Export Infrastructure, ...) aren't among the
 * provided test accounts. See the project conversation's coverage-gap
 * analysis for the full reasoning - this is a test-data/credential
 * dependency, not something to work around with fabricated data.
 */
test.describe('Assignment reversal is gated by workflow progress @regression @assignment', () => {
  test('ASN-003: should disable Pull Back Question once a division has started answering @regression @assignment', async ({
    page,
  }) => {
    const notYetStarted = seededQuestions.spiceProductionMaharashtra; // Assigned, no responses yet
    const inProgress = seededQuestions.usTariffAgriProducts; // Draft in progress

    const assignedList = new QuestionListPage(page, '/v2/parliament/questions');
    const detail = new QuestionDetailPage(page);

    await assignedList.goto();
    await assignedList.openQuestion(notYetStarted.diaryNo);
    await detail.openActionsMenu();
    await expect(detail.actionMenuItem('Pull Back Question')).toBeEnabled();

    await assignedList.goto();
    await assignedList.openQuestion(inProgress.diaryNo);
    await detail.openActionsMenu();
    await expect(detail.actionMenuItem('Pull Back Question')).toBeDisabled();
  });
});
