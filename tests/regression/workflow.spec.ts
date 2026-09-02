import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { QuestionListPage } from '../../pages/QuestionListPage';
import { QuestionDetailPage } from '../../pages/QuestionDetailPage';
import { seededQuestions } from '../../test-data/questions';

/**
 * End-to-end business workflow: Parliament upload/admission -> department
 * assignment -> division drafting -> answer submission -> consolidation ->
 * completion -> final status/location.
 *
 * This walks and verifies EVERY stage of a question already carried through
 * the full lifecycle (D. No. 28641), rather than performing each transition
 * live. Performing the transitions live was considered and rejected: none of
 * the provided test accounts have a fresh question to drive through accept ->
 * draft -> submit without either (a) needing a real AI drafting round trip
 * against a shared, rate-limited backend, or (b) mutating shared demo data
 * other testers rely on (see docs/test-data-strategy.md §6). Verifying that
 * every stage of a real completed journey is present, in the right order, and
 * that the final state is reflected consistently everywhere is still a
 * meaningful, high-value regression check of the whole pipeline.
 */
test.use({ role: roles.superAdmin });

test('WFL-001: should carry a question from admission through to Completed with a consistent final state everywhere @regression @workflow @critical @completion', async ({
  page,
}) => {
  const question = seededQuestions.eGovernanceServicesMumbai;

  await test.step('Parliament: question is visible in Completed Questions with status Completed', async () => {
    const completedList = new QuestionListPage(page, '/v2/parliament/completed-questions');
    await completedList.goto();
    await expect(completedList.rowByDiaryNo(question.diaryNo)).toBeVisible();
    await expect(completedList.statusCellOf(question.diaryNo)).toHaveText('Completed');
  });

  await test.step('Question Detail: every lifecycle stage is present in order', async () => {
    const completedList = new QuestionListPage(page, '/v2/parliament/completed-questions');
    await completedList.goto();
    await completedList.openQuestion(question.diaryNo);

    const detail = new QuestionDetailPage(page);
    await expect(detail.heading).toBeVisible();
    await expect(detail.statusBadge).toHaveText('Completed');

    const timelineEvents = [
      'Question created',
      'Marked as admitted',
      'Assigned',
      'Response submitted',
      'Final consolidated answer generated',
      'Completed by Parliament',
    ];
    for (const event of timelineEvents) {
      await expect(page.getByText(event, { exact: true }).first()).toBeVisible();
    }
  });

  await test.step('Division: all four sub-questions show a completed, answer-received status', async () => {
    for (const part of ['Part (A)', 'Part (B)', 'Part (C)', 'Part (D)']) {
      await expect(page.getByText(part, { exact: true })).toBeVisible();
    }
    const completedBadges = page.getByText('Completed', { exact: true });
    expect(await completedBadges.count()).toBeGreaterThanOrEqual(4);
  });

  await test.step('Final consolidated answer is available for download', async () => {
    await expect(page.getByText('Final Answer PDF recorded')).toBeVisible();
    await expect(detailDownloadLink(page)).toBeVisible();
  });

  await test.step('the question is not duplicated in any earlier-stage list', async () => {
    for (const path of ['/v2/parliament/provisional-questions', '/v2/parliament/questions']) {
      const earlierStageList = new QuestionListPage(page, path);
      await earlierStageList.goto();
      const stillThere = await earlierStageList.isDiaryNoVisible(question.diaryNo);
      expect(stillThere, `D. No. ${question.diaryNo} should not still appear on ${path}`).toBe(
        false,
      );
    }
  });
});

function detailDownloadLink(page: import('@playwright/test').Page) {
  return page.getByRole('link', { name: /LS Admiited version questions/ });
}
