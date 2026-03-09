/**
 * Manual Test Cases for Financial Services
 * 
 * Estos casos de prueba validan la lógica financiera sin necesidad de
 * ejecutarlos contra una base de datos real.
 * 
 * Para ejecutar pruebas completas, usar Jest o Vitest.
 */

// ============================================
// TEST CASE 1: Balance Calculation
// ============================================

export const testCase1_BalanceCalculation = {
  description: 'Calculate correct balance from mixed transactions',
  input: {
    userId: 'user-123',
    accountId: 'account-456',
    transactions: [
      {
        id: 'txn-1',
        type: 'INCOME',
        amount: 3000,
        status: 'PAID',
        description: 'Salary',
      },
      {
        id: 'txn-2',
        type: 'EXPENSE',
        amount: 500,
        status: 'PAID',
        description: 'Rent',
      },
      {
        id: 'txn-3',
        type: 'EXPENSE',
        amount: 100,
        status: 'PAID',
        description: 'Groceries',
      },
      {
        id: 'txn-4',
        type: 'EXPENSE',
        amount: 200,
        status: 'PENDING', // Should NOT be counted
        description: 'Future expense',
      },
    ],
  },
  expected: {
    currentBalance: 2400, // 3000 - 500 - 100 (txn-4 not counted)
    totalIncome: 3000,
    totalExpense: 600,
  },
  explanation: 'Current balance = PAID income - PAID expense. PENDING transactions are NOT included.',
};

// ============================================
// TEST CASE 2: Transfer Creation
// ============================================

export const testCase2_TransferCreation = {
  description: 'Transfer creates two linked transactions',
  input: {
    userId: 'user-123',
    fromAccountId: 'checking-123',
    toAccountId: 'savings-456',
    amount: 500,
    dueDate: '2026-03-15',
  },
  expected: {
    transactions: [
      {
        accountId: 'checking-123',
        type: 'TRANSFER',
        amount: 500,
        status: 'PENDING',
      },
      {
        accountId: 'savings-456',
        type: 'TRANSFER',
        amount: 500,
        status: 'PENDING',
      },
    ],
    sharedProperties: {
      transferGroupId: 'uuid-xyz', // Both share same UUID
      status: 'PENDING', // Both marked as PENDING
    },
    relationships: {
      transaction1: { relatedTransactionId: 'id-of-transaction-2' },
      transaction2: { relatedTransactionId: 'id-of-transaction-1' },
    },
  },
  explanation: 'Transfers are always bidirectional with linked references.',
};

// ============================================
// TEST CASE 3: Projection Calculation
// ============================================

export const testCase3_ProjectionCalculation = {
  description: 'Projection includes current balance plus pending future transactions',
  input: {
    userId: 'user-123',
    accountId: 'account-456',
    today: '2026-03-09',
    currentBalance: 5000, // All PAID
    transactions: [
      {
        id: 'txn-1',
        type: 'INCOME',
        amount: 3000,
        status: 'PENDING',
        dueDate: '2026-03-20',
      },
      {
        id: 'txn-2',
        type: 'EXPENSE',
        amount: 150,
        status: 'PENDING',
        dueDate: '2026-03-15',
      },
      {
        id: 'txn-3',
        type: 'EXPENSE',
        amount: 200,
        status: 'PENDING',
        dueDate: '2026-04-05',
      },
      {
        id: 'txn-4',
        type: 'INCOME',
        amount: 500,
        status: 'PENDING',
        dueDate: '2026-02-28', // PAST - should NOT be included
      },
    ],
  },
  expected: {
    currentBalance: 5000,
    projectedBalance: 8150, // 5000 + 3000 - 150 - 200
    pendingIncome: 3000,
    pendingExpense: 350,
  },
  explanation: 'Projection = Current + (Future PENDING INCOME) - (Future PENDING EXPENSE). Past pending transactions are NOT included.',
};

// ============================================
// TEST CASE 4: Recurring Generation MONTHLY
// ============================================

export const testCase4_RecurringMonthly = {
  description: 'Generate monthly recurring transactions correctly',
  input: {
    recurringRule: {
      id: 'rule-123',
      name: 'Rent Payment',
      type: 'EXPENSE',
      amount: 1000,
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      startDate: '2026-03-01',
      endDate: null, // Infinite
      installmentsTotal: null, // No limit
      accountId: 'checking-123',
    },
    upToDate: '2026-06-30',
  },
  expected: {
    generatedTransactions: [
      {
        dueDate: '2026-03-01',
        amount: 1000,
        status: 'PENDING',
        recurringRuleId: 'rule-123',
      },
      {
        dueDate: '2026-04-01',
        amount: 1000,
        status: 'PENDING',
        recurringRuleId: 'rule-123',
      },
      {
        dueDate: '2026-05-01',
        amount: 1000,
        status: 'PENDING',
        recurringRuleId: 'rule-123',
      },
      {
        dueDate: '2026-06-01',
        amount: 1000,
        status: 'PENDING',
        recurringRuleId: 'rule-123',
      },
    ],
    count: 4,
  },
  explanation: 'Monthly frequency generates one transaction per month on the specified dayOfMonth.',
};

// ============================================
// TEST CASE 5: Recurring with Installments
// ============================================

export const testCase5_RecurringWithInstallments = {
  description: 'Generate recurring transactions with installment limit (loan)',
  input: {
    recurringRule: {
      id: 'rule-loan-123',
      name: 'Car Loan',
      type: 'EXPENSE',
      amount: 500,
      frequency: 'MONTHLY',
      dayOfMonth: 5,
      startDate: '2026-03-05',
      endDate: null,
      installmentsTotal: 24, // Only 24 months
      accountId: 'checking-123',
    },
    upToDate: '2028-12-31', // Beyond 24 months
  },
  expected: {
    generatedTransactions: 24, // Exactly 24 transactions
    firstTransaction: {
      dueDate: '2026-03-05',
      installmentNumber: 1,
      installmentTotal: 24,
    },
    lastTransaction: {
      dueDate: '2028-02-05', // 24 months later
      installmentNumber: 24,
      installmentTotal: 24,
    },
  },
  explanation: 'With installmentsTotal=24, only 24 transactions are generated regardless of upToDate.',
};

// ============================================
// TEST CASE 6: Recurring with End Date
// ============================================

export const testCase6_RecurringWithEndDate = {
  description: 'Stop generating when end date is reached',
  input: {
    recurringRule: {
      id: 'rule-sub',
      name: 'Netflix Subscription',
      type: 'EXPENSE',
      amount: 15,
      frequency: 'MONTHLY',
      dayOfMonth: 15,
      startDate: '2026-01-15',
      endDate: '2026-06-15', // Stop in June
      installmentsTotal: null,
      accountId: 'checking-123',
    },
    upToDate: '2026-12-31', // Try to generate until end of year
  },
  expected: {
    generatedTransactions: 6, // Jan, Feb, Mar, Apr, May, Jun (stops in Jun)
    firstTransaction: {
      dueDate: '2026-01-15',
    },
    lastTransaction: {
      dueDate: '2026-06-15',
    },
  },
  explanation: 'Recurring stops at endDate, even if upToDate is later.',
};

// ============================================
// TEST CASE 7: Recurring WEEKLY
// ============================================

export const testCase7_RecurringWeekly = {
  description: 'Generate weekly recurring transactions',
  input: {
    recurringRule: {
      id: 'rule-weekly',
      name: 'Gym',
      type: 'EXPENSE',
      amount: 20,
      frequency: 'WEEKLY',
      startDate: '2026-03-09',
      endDate: '2026-04-05', // 4 weeks
      accountId: 'checking-123',
    },
    upToDate: '2026-04-05',
  },
  expected: {
    generatedTransactions: 4,
    transactions: [
      { dueDate: '2026-03-09' },
      { dueDate: '2026-03-16' },
      { dueDate: '2026-03-23' },
      { dueDate: '2026-03-30' }, // Not 04-06, stops at endDate
    ],
  },
  explanation: 'Weekly frequency adds 7 days each iteration.',
};

// ============================================
// TEST CASE 8: Recurring YEARLY
// ============================================

export const testCase8_RecurringYearly = {
  description: 'Generate yearly recurring transactions',
  input: {
    recurringRule: {
      id: 'rule-yearly',
      name: 'Annual License',
      type: 'EXPENSE',
      amount: 150,
      frequency: 'YEARLY',
      startDate: '2026-01-15',
      endDate: null,
      accountId: 'checking-123',
    },
    upToDate: '2029-12-31',
  },
  expected: {
    generatedTransactions: 4,
    transactions: [
      { dueDate: '2026-01-15' },
      { dueDate: '2027-01-15' },
      { dueDate: '2028-01-15' },
      { dueDate: '2029-01-15' },
    ],
  },
  explanation: 'Yearly frequency adds 1 year each iteration.',
};

// ============================================
// TEST CASE 9: Validation - Negative Amount
// ============================================

export const testCase9_ValidationNegativeAmount = {
  description: 'Reject transactions with negative amount',
  input: {
    userId: 'user-123',
    accountId: 'checking-123',
    type: 'EXPENSE',
    amount: -100, // Invalid
    description: 'Invalid expense',
    dueDate: '2026-03-15',
  },
  expected: {
    error: 'ValidationError',
    message: 'Amount must be greater than 0',
    statusCode: 400,
  },
  explanation: 'All amounts must be positive. Expense/Income type is encoded in the transaction type.',
};

// ============================================
// TEST CASE 10: Validation - Past Date
// ============================================

export const testCase10_ValidationPastDate = {
  description: 'Reject transactions with past due date',
  input: {
    userId: 'user-123',
    accountId: 'checking-123',
    type: 'EXPENSE',
    amount: 100,
    description: 'Past expense',
    dueDate: '2026-03-01', // Today is 2026-03-09
  },
  expected: {
    error: 'ValidationError',
    message: 'Due date cannot be in the past',
    statusCode: 400,
  },
  explanation: 'Transactions cannot have due dates in the past.',
};

// ============================================
// TEST CASE 11: Transfer Validation - Same Account
// ============================================

export const testCase11_TransferValidationSameAccount = {
  description: 'Reject transfers to the same account',
  input: {
    userId: 'user-123',
    fromAccountId: 'checking-123',
    toAccountId: 'checking-123', // Same account
    amount: 500,
    dueDate: '2026-03-15',
  },
  expected: {
    error: 'ValidationError',
    message: 'Cannot transfer to the same account',
    statusCode: 400,
  },
  explanation: 'Transfers must be between two different accounts.',
};

// ============================================
// TEST CASE 12: Balance with Transfers
// ============================================

export const testCase12_BalanceWithTransfers = {
  description: 'Transfers affect account balances correctly',
  input: {
    accounts: {
      checking: { name: 'Checking', balance: 1000 },
      savings: { name: 'Savings', balance: 500 },
    },
    transfer: {
      from: 'checking',
      to: 'savings',
      amount: 200,
      status: 'PAID',
    },
  },
  expected: {
    checking: 800, // 1000 - 200 (transferred out)
    savings: 700, // 500 + 200 (received)
    total: 1500, // 800 + 700
  },
  explanation: 'Transfers decrease source balance and increase destination balance by the same amount.',
};

// ============================================
// TEST CASE 13: Multiple Accounts Projection
// ============================================

export const testCase13_MultipleAccountsProjection = {
  description: 'Project multiple accounts independently',
  input: {
    accounts: [
      {
        id: 'checking',
        current: 1000,
        pendingIncome: 3000,
        pendingExpense: 500,
      },
      {
        id: 'savings',
        current: 5000,
        pendingIncome: 0,
        pendingExpense: 1000,
      },
      {
        id: 'credit-card',
        current: -200, // Debt
        pendingIncome: 0,
        pendingExpense: 300,
      },
    ],
  },
  expected: {
    projections: [
      { accountId: 'checking', projected: 3500 }, // 1000 + 3000 - 500
      { accountId: 'savings', projected: 4000 }, // 5000 + 0 - 1000
      { accountId: 'credit-card', projected: -500 }, // -200 + 0 - 300
    ],
    total: 7000, // 3500 + 4000 - 500
  },
  explanation: 'Each account projects independently, then totals can be summed.',
};

// ============================================
// TEST CASE 14: Recurring Generation - No Duplicates
// ============================================

export const testCase14_NoDuplicateRecurring = {
  description: 'Do not generate duplicate recurring transactions',
  input: {
    recurringRuleId: 'rule-salary',
    previousGenerationDate: '2026-03-05',
    previousGeneratedCount: 3, // Already generated 3 transactions
    upToDate: '2026-06-05',
  },
  expected: {
    newTransactionsGenerated: 1, // Only 1 new (for June)
    totalTransactionsForRule: 4, // 3 existing + 1 new
    explanation: 'Service tracks existing transactions and does not create duplicates.',
  },
  explanation: 'Recurring generation tracks installment numbers to avoid duplicates.',
};

// ============================================
// TEST CASE 15: Projection Timeline
// ============================================

export const testCase15_ProjectionTimeline = {
  description: 'Generate projection timeline for 12 months',
  input: {
    userId: 'user-123',
    accountId: 'checking-123',
    monthsAhead: 12,
    recurringRules: [
      { frequency: 'MONTHLY', amount: 3000, type: 'INCOME', dayOfMonth: 1 },
      { frequency: 'MONTHLY', amount: 1000, type: 'EXPENSE', dayOfMonth: 5 },
    ],
  },
  expected: {
    timeline: 12, // 12 months
    march: {
      month: '2026-03',
      startingBalance: 5000,
      income: 3000,
      expense: 1000,
      endingBalance: 7000,
    },
    april: {
      month: '2026-04',
      startingBalance: 7000,
      income: 3000,
      expense: 1000,
      endingBalance: 9000,
    },
  },
  explanation: 'Timeline shows monthly progression with recurring transactions included.',
};

// ============================================
// SUMMARY
// ============================================

export const testSummary = {
  totalTestCases: 15,
  categories: {
    balanceCalculation: [
      'testCase1_BalanceCalculation',
      'testCase12_BalanceWithTransfers',
      'testCase13_MultipleAccountsProjection',
    ],
    transactions: [
      'testCase2_TransferCreation',
      'testCase9_ValidationNegativeAmount',
      'testCase10_ValidationPastDate',
      'testCase11_TransferValidationSameAccount',
    ],
    recurring: [
      'testCase4_RecurringMonthly',
      'testCase5_RecurringWithInstallments',
      'testCase6_RecurringWithEndDate',
      'testCase7_RecurringWeekly',
      'testCase8_RecurringYearly',
      'testCase14_NoDuplicateRecurring',
    ],
    projection: [
      'testCase3_ProjectionCalculation',
      'testCase15_ProjectionTimeline',
    ],
  },
  keyAssertions: [
    'Balance only includes PAID transactions',
    'Transfers create two linked transactions',
    'Projections include only future PENDING transactions',
    'Recurring supports WEEKLY, MONTHLY, YEARLY',
    'Installments limit recurring generation',
    'End date stops recurring generation',
    'Validations prevent invalid data',
    'No duplicate transactions generated',
  ],
};

export default {
  testCase1_BalanceCalculation,
  testCase2_TransferCreation,
  testCase3_ProjectionCalculation,
  testCase4_RecurringMonthly,
  testCase5_RecurringWithInstallments,
  testCase6_RecurringWithEndDate,
  testCase7_RecurringWeekly,
  testCase8_RecurringYearly,
  testCase9_ValidationNegativeAmount,
  testCase10_ValidationPastDate,
  testCase11_TransferValidationSameAccount,
  testCase12_BalanceWithTransfers,
  testCase13_MultipleAccountsProjection,
  testCase14_NoDuplicateRecurring,
  testCase15_ProjectionTimeline,
  testSummary,
};
