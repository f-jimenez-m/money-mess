# Financial Services Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         PWA Frontend                         │
│                    (Vue 3 + TailwindCSS)                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                        HTTP/REST API
                              │
        ┌─────────────────────────────────────────┐
        │        Fastify Backend                   │
        │   (TypeScript + Express-like Router)     │
        └────────────┬────────────────────────────┘
                     │
        ┌────────────────────────────┐
        │    Middleware/Plugins       │
        ├────────────────────────────┤
        │ • JWT Authentication        │
        │ • CORS Handler              │
        │ • Error Handler             │
        │ • Logging (Pino)            │
        └────────┬───────────────────┘
                 │
        ┌────────────────────────────┐
        │    Controllers Layer        │ ← HTTP Request Handlers (thin)
        ├────────────────────────────┤
        │ • TransactionController     │
        │ • AccountController         │
        │ • RecurringController       │
        │ • DashboardController       │
        └────────┬───────────────────┘
                 │
        ┌────────────────────────────────────┐
        │      Services Layer                 │ ← Business Logic (fat)
        ├────────────────────────────────────┤
        │ ┌──────────────────────────────┐   │
        │ │  TransactionService          │   │
        │ │  • createTransaction()       │   │
        │ │  • createTransfer()          │   │
        │ │  • markAsPaid()              │   │
        │ └──────────────────────────────┘   │
        │ ┌──────────────────────────────┐   │
        │ │  BalanceService              │   │
        │ │  • getBalance()              │   │
        │ │  • getAccountBalance()       │   │
        │ │  • getTotalBalance()         │   │
        │ └──────────────────────────────┘   │
        │ ┌──────────────────────────────┐   │
        │ │  RecurringService            │   │
        │ │  • createRecurringRule()     │   │
        │ │  • generateRecurring()       │   │
        │ │  • executeGeneration()       │   │
        │ └──────────────────────────────┘   │
        │ ┌──────────────────────────────┐   │
        │ │  ProjectionService           │   │
        │ │  • getAccountProjection()    │   │
        │ │  • getProjectionTimeline()   │   │
        │ │  • getMonthlyProjection()    │   │
        │ └──────────────────────────────┘   │
        └────────┬─────────────────────────┘
                 │
        ┌────────────────────────────────────┐
        │    Repository Layer                 │ ← Data Access Abstraction
        ├────────────────────────────────────┤
        │ ┌──────────────────────────────┐   │
        │ │  TransactionRepository       │   │
        │ │  • findById()                │   │
        │ │  • sumByAccountAndStatus()   │   │
        │ │  • countRecurring()          │   │
        │ └──────────────────────────────┘   │
        │ ┌──────────────────────────────┐   │
        │ │  AccountRepository           │   │
        │ │  • findById()                │   │
        │ │  • findManyByUserId()        │   │
        │ └──────────────────────────────┘   │
        │ ┌──────────────────────────────┐   │
        │ │  RecurringRuleRepository     │   │
        │ │  • findActiveRules()         │   │
        │ │  • findByIdAndUserId()       │   │
        │ └──────────────────────────────┘   │
        └────────┬──────────────────────────┘
                 │
        ┌────────────────────────────┐
        │      Prisma ORM             │ ← Database Abstraction
        └────────┬───────────────────┘
                 │
        ┌────────────────────────────┐
        │      MariaDB Database       │ ← Persistent Storage
        ├────────────────────────────┤
        │ • users                     │
        │ • accounts                  │
        │ • categories                │
        │ • transactions              │
        │ • recurring_rules           │
        └────────────────────────────┘
```

## Data Flow: Creating a Transaction

```
POST /api/transactions
  │
  ├─→ Controller validates input
  │
  ├─→ TransactionService.createTransaction()
  │   ├─ Validate account exists
  │   ├─ Validate amount > 0
  │   ├─ Validate date not in past
  │   └─ Call TransactionRepository.create()
  │       └─ Prisma writes to DB
  │
  ├─→ Return TransactionResponse (200 OK)
  │
  └─→ Frontend receives transaction data
```

## Data Flow: Calculating Balance

```
GET /api/accounts/:id/balance
  │
  ├─→ Controller calls BalanceService.getAccountBalance()
  │   ├─ Verify account ownership (userId check)
  │   ├─ TransactionRepository.sumByAccountAndStatus('INCOME', 'PAID')
  │   │  └─ Aggregate sum from DB
  │   ├─ TransactionRepository.sumByAccountAndStatus('EXPENSE', 'PAID')
  │   │  └─ Aggregate sum from DB
  │   └─ Calculate: income - expense
  │
  └─→ Return BalanceInfo (with current balance)
```

## Data Flow: Generating Recurring Transactions

```
POST /api/recurring/generate (internal cron job)
  │
  ├─→ RecurringService.executeRecurringGeneration()
  │   ├─ Find all active RecurringRules (endDate >= today)
  │   │
  │   ├─→ For each rule:
  │   │   ├─ RecurringService.generateRecurringTransactions()
  │   │   │  ├─ Loop from startDate to upToDate
  │   │   │  ├─ Calculate next occurrence based on frequency
  │   │   │  ├─ Check for duplicates (countRecurringTransactions)
  │   │   │  └─ Create GeneratedTransaction objects
  │   │   │
  │   │   └─ TransactionRepository.createMany()
  │   │      └─ Bulk insert to DB
  │   │
  │   └─ Return {totalGenerated, byRule}
  │
  └─→ Log results
```

## Data Flow: Calculating Projection

```
GET /api/accounts/:id/projection
  │
  ├─→ Controller calls ProjectionService.getAccountProjection()
  │   ├─ BalanceService.getBalance(userId, accountId)
  │   │  └─ Gets PAID balance
  │   │
  │   ├─ TransactionRepository.findMany()
  │   │  └─ Get PENDING transactions with due_date > today
  │   │
  │   ├─ Calculate:
  │   │  ├─ Sum of future INCOME
  │   │  ├─ Sum of future EXPENSE
  │   │  └─ projectedBalance = current + income - expense
  │   │
  │   └─ Return ProjectedBalance
  │
  └─→ Frontend shows current + projected
```

## Service Interactions

```
                    ┌─────────────────┐
                    │  Controllers    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   Transaction          Balance            Recurring
   Service              Service            Service
        │                    │                    │
        ├────────────────────┤                    │
        │                    │                    │
        ▼                    ▼                    ▼
   Transaction          Account          Recurring
   Repository           Repository       Repository
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────────────┐
                    │  Prisma ORM    │
                    └────────┬───────┘
                             │
                    ┌────────────────┐
                    │    MariaDB     │
                    └────────────────┘

Projection Service uses BalanceService:
   ProjectionService
        │
        ├─→ BalanceService.getBalance()
        │
        └─→ TransactionRepository
```

## State Transitions: Transaction

```
                   ┌──────────────┐
                   │   PENDING    │ ← Created initially
                   │              │
              create │            │ markAsPaid
                   │              ▼
                   │          ┌──────────┐
                   │          │   PAID   │
                   │          └──────────┘
                   │              │
                   │              │ markAsPending
                   │              ▼
                   │          ┌──────────┐
                   │          │ PENDING  │ (can cycle)
                   │          └──────────┘
                   │
                   ▼
                ┌──────────┐
                │ DELETED  │
                └──────────┘
```

## Balance Calculation Formula

```
┌─────────────────────────────────────────────────────────┐
│              CURRENT BALANCE                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SELECT SUM(amount)                                      │
│  FROM transactions                                       │
│  WHERE status = 'PAID'                                   │
│    AND type IN ('INCOME')                                │
│    AND accountId = :accountId                            │
│                                                          │
│  MINUS                                                   │
│                                                          │
│  SELECT SUM(amount)                                      │
│  FROM transactions                                       │
│  WHERE status = 'PAID'                                   │
│    AND type IN ('EXPENSE')                               │
│    AND accountId = :accountId                            │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              PROJECTED BALANCE                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CURRENT BALANCE (see above)                             │
│                                                          │
│  PLUS                                                    │
│                                                          │
│  SELECT SUM(amount)                                      │
│  FROM transactions                                       │
│  WHERE status = 'PENDING'                                │
│    AND type IN ('INCOME')                                │
│    AND dueDate > NOW()                                   │
│    AND accountId = :accountId                            │
│                                                          │
│  MINUS                                                   │
│                                                          │
│  SELECT SUM(amount)                                      │
│  FROM transactions                                       │
│  WHERE status = 'PENDING'                                │
│    AND type IN ('EXPENSE')                               │
│    AND dueDate > NOW()                                   │
│    AND accountId = :accountId                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Transfer Model

```
Create Transfer: $500 from Checking → Savings

Transaction 1 (Checking):
┌─────────────────────────┐
│ id: uuid-1              │
│ type: TRANSFER          │
│ amount: 500             │
│ status: PENDING         │
│ accountId: checking     │
│ transferGroupId: uuid-g │ ◄──┐
│ relatedTransactionId: ──┼───┼──→ uuid-2
│ description: Transfer   │    │
└─────────────────────────┘    │
                               │
Transaction 2 (Savings):       │
┌─────────────────────────┐    │
│ id: uuid-2              │    │
│ type: TRANSFER          │    │
│ amount: 500             │    │
│ status: PENDING         │    │
│ accountId: savings      │    │
│ transferGroupId: uuid-g ◄────┘
│ relatedTransactionId: ──┐
│   uuid-1                │
│ description: Transfer   │
└─────────────────────────┘
```

## Recurring Transaction Generation

```
RecurringRule:
┌─────────────────────────────┐
│ frequency: MONTHLY          │
│ dayOfMonth: 5               │
│ startDate: 2026-01-05       │
│ endDate: null (infinite)    │
│ installmentsTotal: 24       │
└──────────┬──────────────────┘
           │
           ├─→ Logic: generateRecurringTransactions()
           │
           ├─ Month 1: 2026-01-05, installment 1/24
           ├─ Month 2: 2026-02-05, installment 2/24
           ├─ Month 3: 2026-03-05, installment 3/24
           │ ...
           └─ Month 24: 2027-12-05, installment 24/24
                       (then stops, installment limit reached)
```

---

**Esta arquitectura garantiza:**
- ✅ Separación de responsabilidades clara
- ✅ Fácil de testear (cada capa es aislada)
- ✅ Escalable (agregar nuevos servicios no afecta existentes)
- ✅ Correctitud financiera (validaciones en cada nivel)
- ✅ Performance (índices, agregaciones)
