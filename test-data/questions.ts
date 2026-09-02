/**
 * Reference catalog of questions already seeded in the shared demo environment,
 * identified by stable Diary No. (D. No.). Regression tests read these instead of
 * creating throwaway data per test - see docs/test-data-strategy.md for why.
 *
 * Captured during exploration on 2026-08-31. If the demo environment is reset or
 * reseeded, update this file - it is the single place that needs to change.
 */
export interface SeededQuestion {
  diaryNo: string;
  subject: string;
  house: 'Lok Sabha' | 'Rajya Sabha';
  questionType: 'Provisional' | 'Admitted';
  division: string;
  /** Overall status observed live at capture time. */
  status: 'Assigned' | 'Draft in progress' | 'Completed';
  /** Which lists this question was observed in at capture time. */
  seenIn: Array<'provisional' | 'admitted' | 'assigned' | 'completed'>;
  notes?: string;
}

export const seededQuestions = {
  /** The sole Provisional Question in the queue - safe, stable target for read-only assertions. */
  spiceProductionMaharashtra: {
    diaryNo: '16365',
    subject: 'Spice production in Maharashtra',
    house: 'Lok Sabha',
    questionType: 'Provisional',
    division: "Plantation 'D' (Spices)",
    status: 'Assigned',
    seenIn: ['provisional', 'assigned'],
  },

  /**
   * Completed, but also (incorrectly) still present in Admitted Questions at
   * capture time - the live reproduction of Bug Sheet DEF-081. Used by the
   * "should remove completed question from active admitted questions" test.
   */
  eGovernanceServicesMumbai: {
    diaryNo: '28641',
    subject: 'E-GOVERNANCE SERVICES IN MUMBAI',
    house: 'Lok Sabha',
    questionType: 'Admitted',
    division: 'IT Cell',
    status: 'Completed',
    seenIn: ['admitted', 'completed'],
    notes: 'DEF-081 regression target: must be in Completed only, currently also in Admitted.',
  },

  usTariffAgriProducts: {
    diaryNo: '16258',
    subject: 'Impact of US Tariff on Import Export of Agricultural Products',
    house: 'Lok Sabha',
    questionType: 'Admitted',
    division: 'Foreign Trade (NAFTA)',
    status: 'Draft in progress',
    seenIn: ['assigned'],
  },

  indiaUsDigitalTradeProvisions: {
    diaryNo: '16978',
    subject: 'India-US Digital Trade Provisions',
    house: 'Lok Sabha',
    questionType: 'Admitted',
    division: 'Foreign Trade (NAFTA)',
    status: 'Completed',
    seenIn: ['completed'],
  },

  teaGrowersRegistration: {
    diaryNo: '16911',
    subject: 'Identification and Registration of Tea Growers',
    house: 'Lok Sabha',
    questionType: 'Admitted',
    division: "Plantation 'A' (Tea)",
    status: 'Completed',
    seenIn: ['completed'],
  },

  malonInternationalHaat: {
    diaryNo: '16305',
    subject: 'Operational Status and Development of Malon International Haat',
    house: 'Lok Sabha',
    questionType: 'Admitted',
    division: 'TESTING',
    status: 'Completed',
    seenIn: ['completed'],
  },

  indiaTradeAgreements: {
    diaryNo: '14598',
    subject: "India's Trade Agreements",
    house: 'Lok Sabha',
    questionType: 'Admitted',
    division: 'Foreign Trade (Coordination)',
    status: 'Assigned',
    seenIn: ['assigned'],
    notes: 'STARRED question type in the source PDF - useful for Question Type filter checks.',
  },
} as const satisfies Record<string, SeededQuestion>;
