import { expect } from '@playwright/test';
import { test, roles } from '../../fixtures/test';
import { QuestionListPage } from '../../pages/QuestionListPage';
import { UploadQuestionPage } from '../../pages/UploadQuestionPage';
import { provisionalQuestionUploadFixture } from '../../test-data/documents';

test.use({ role: roles.superAdmin });

test.describe('Upload Provisional Questions @regression @upload', () => {
  test('QST-007: should keep Submit disabled until a file is chosen @regression @upload @questions', async ({
    page,
  }) => {
    const list = new QuestionListPage(page, '/v2/parliament/provisional-questions');
    await list.goto();
    await page.getByRole('button', { name: 'Upload Provisional Questions' }).click();

    const upload = new UploadQuestionPage(page);
    await expect(upload.heading).toBeVisible();
    await expect(upload.submitButton).toBeDisabled();
  });

  test('QST-008: should upload a fresh provisional question PDF through to a submittable state @regression @upload @questions', async ({
    page,
  }) => {
    // Uses the one fixture confirmed not already live in the shared demo
    // environment (see docs/test-data-strategy.md) so this does not create a
    // confusing duplicate diary number for anyone else using the same portal.
    const list = new QuestionListPage(page, '/v2/parliament/provisional-questions');
    await list.goto();
    await page.getByRole('button', { name: 'Upload Provisional Questions' }).click();

    const upload = new UploadQuestionPage(page);
    await upload.chooseFile(provisionalQuestionUploadFixture.filePath);

    await expect(upload.submitButton).toBeEnabled();

    // Deliberately does not click Submit: this suite runs on every CI push,
    // and the fixture PDF being "confirmed not yet live" is a one-time fact
    // from exploration, not something the test re-verifies. Actually
    // submitting here would upload D. No. 16356 again on every run, creating
    // a new duplicate record each time - the exact problem
    // docs/test-data-strategy.md §4 argues against. This test's job is to
    // prove the upload form accepts a real, well-formed PDF and unlocks
    // Submit; a one-off manual/exploratory run is the right way to verify the
    // full server-side submit-and-route flow.
  });
});
