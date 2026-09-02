import path from 'node:path';

/**
 * Fixture PDFs used by upload tests. See docs/test-data-strategy.md for the full
 * catalog of source PDFs provided by the team and why only this one is wired
 * into an automated upload - the rest are already live in the shared demo
 * environment (see test-data/questions.ts) and re-uploading them would create
 * duplicate records other testers rely on.
 */
export const provisionalQuestionUploadFixture = {
  filePath: path.join(__dirname, 'documents', 'provisional', 'district-export-hubs-16356.pdf'),
  diaryNo: '16356',
  subject: 'District Export Hubs',
  house: 'Lok Sabha' as const,
  questionType: 'UNSTARRED',
  /** Not present in any live list at capture time - safe to upload without creating a duplicate. */
  confirmedNotYetLive: true,
};
