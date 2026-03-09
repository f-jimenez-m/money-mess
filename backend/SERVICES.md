# Financial Services Architecture

## Overview

Los servicios financieros implementan la lógica de dominio principal de la aplicación. Están organizados por responsabilidad y siguen el patrón de arquitectura por capas.

```
Controllers (HTTP)
       ↓
Services (Business Logic)
       ↓
Repositories (Data Access)
       ↓
Prisma ORM
       ↓
MariaDB
```

## Services

### 1. BalanceService

**Responsabilidad**: Calcular el balance actual de una cuenta.

**Fórmula**:
```
Current Balance = Sum(INCOME transactions with status=PAID) - Sum(EXPENSE transactions with status=PAID)
```

**Métodos principales**:
- `getAccountBalance(userId, accountId)` - Balance de una cuenta específica
- `getAllAccountsBalance(userId)` - Balance de todas las cuentas
- `getTotalBalance(userId)` - Balance total del usuario
- `getBalance(userId, accountId)` - Solo el número de balance

**Puntos clave**:
- ✅ Solo cuenta transacciones PAID (confirmadas)
- ✅ Permite créditos negativos en cuentas de tipo CREDIT
- ✅ Moneda agnostic (cada cuenta tiene su moneda)

### 2. TransactionService

**Responsabilidad**: Gestionar transacciones (CRUD) y transferencias entre cuentas.

**Métodos principales**:
- `createTransaction(userId, dto)` - Crear INCOME o EXPENSE
- `createTransfer(userId, dto)` - Crear transferencia (genera 2 transacciones)
- `markTransactionAsPaid(userId, transactionId)` - Confirmar pago
- `markTransactionAsPending(userId, transactionId)` - Revertir a pendiente
- `deleteTransaction(userId, transactionId)` - Eliminar transacción

**Transferencias**:

Una transferencia de 100 unidades de cuenta A → cuenta B genera:

```
Transacción 1 (Salida):
- Type: TRANSFER
- Account: A
- Amount: 100
- Type en la BD: Se resta del saldo

Transacción 2 (Entrada):
- Type: TRANSFER
- Account: B
- Amount: 100
- Type en la BD: Se suma al saldo

Ambas comparten:
- transferGroupId: UUID común
- relatedTransactionId: referencia bidireccional
```

**Validaciones**:
- ✅ Verificar que la cuenta pertenece al usuario
- ✅ Monto debe ser positivo
- ✅ No permitir transferencias a la misma cuenta
- ✅ No permitir fechas en el pasado

### 3. RecurringService

**Responsabilidad**: Generar transacciones futuras basadas en reglas de recurrencia.

**Métodos principales**:
- `createRecurringRule(userId, dto)` - Crear regla de recurrencia
- `generateRecurringTransactions(ruleId, upToDate)` - Generar transacciones futuras
- `executeRecurringGeneration(upToDate)` - Ejecutar para todas las reglas activas
- `deleteRecurringRule(userId, ruleId)` - Eliminar regla

**Frecuencias soportadas**:

1. **WEEKLY**: cada 7 días
2. **MONTHLY**: cada mes en el dayOfMonth especificado
3. **YEARLY**: cada año en la misma fecha

**Cuotas (Installments)**:

Para un crédito de 24 cuotas:

```
RecurringRule:
- name: "Auto loan"
- amount: 500
- frequency: MONTHLY
- startDate: 2026-03-05
- dayOfMonth: 5
- installmentsTotal: 24

Genera automáticamente:
Transacción 1: 2026-03-05, installment 1/24
Transacción 2: 2026-04-05, installment 2/24
...
Transacción 24: 2027-02-05, installment 24/24
```

**Algoritmo de generación**:
1. Verificar que la regla existe
2. Contar transacciones existentes para esta regla
3. Iterar desde startDate hasta upToDate
4. Para cada ocurrencia:
   - Si tiene límite de cuotas, verificar que no lo supera
   - Si tiene endDate, verificar que no pasó
   - Crear GeneratedTransaction
5. Retornar lista de transacciones a crear

### 4. ProjectionService

**Responsabilidad**: Calcular proyecciones financieras basadas en transacciones pendientes futuras.

**Fórmula**:
```
Projected Balance = Current Balance + Sum(Future PENDING INCOME) - Sum(Future PENDING EXPENSE)

Donde "futuro" significa: due_date > today
```

**Métodos principales**:
- `getAccountProjection(userId, accountId, projectionDate?)` - Proyección de una cuenta
- `getAllAccountsProjection(userId, projectionDate?)` - Proyección de todas las cuentas
- `getTotalProjection(projectionDate?)` - Proyección global
- `getMonthlyProjection(userId, accountId, year, month)` - Proyección de un mes específico
- `getProjectionTimeline(userId, accountId, monthsAhead)` - Timeline de N meses

**Ejemplo**:

```
Cuenta: "Checking"
Current Balance: $1000
Transacciones PENDING futuras:
  - 2026-03-15: +$500 (Salary)
  - 2026-03-20: -$200 (Bills)
  - 2026-04-05: -$150 (Subscription)

Respuesta:
{
  accountId: "...",
  accountName: "Checking",
  currentBalance: 1000,
  projectedBalance: 1150,
  pendingIncome: 500,
  pendingExpense: 350,
  projectionDate: "2026-03-09"
}
```

## Repositories

Los repositorios encapsulan el acceso a datos y proporcionan una interfaz limpia para los servicios.

### TransactionRepository
- `findById(id)` - Buscar por ID
- `findByIdAndUserId(id, userId)` - Buscar y verificar propiedad
- `findMany(filter)` - Buscar con filtros
- `findByAccountAndStatus(userId, accountId, status)` - Filtrar por cuenta y estado
- `create(data)` - Crear transacción
- `createMany(data)` - Crear múltiples transacciones
- `update(id, data)` - Actualizar
- `delete(id)` - Eliminar
- `sumByAccountAndStatus(accountId, status, type?)` - Sumar montos
- `countRecurringTransactions(recurringRuleId)` - Contar transacciones recurrentes
- `findFutureTransactionsByAccount(userId, accountId, beforeDate)` - Transacciones futuras

### AccountRepository
- `findById(id)` - Buscar por ID
- `findByIdAndUserId(id, userId)` - Buscar y verificar propiedad
- `findByUserIdAndName(userId, name)` - Buscar por nombre único
- `findManyByUserId(userId)` - Obtener todas las cuentas del usuario
- `create(data)` - Crear
- `update(id, data)` - Actualizar
- `delete(id)` - Eliminar

### RecurringRuleRepository
- `findById(id)` - Buscar por ID
- `findByIdAndUserId(id, userId)` - Buscar y verificar propiedad
- `findManyByUserId(userId)` - Obtener todas las reglas del usuario
- `findActiveRules(userId, beforeDate)` - Obtener reglas activas
- `create(data)` - Crear
- `update(id, data)` - Actualizar
- `delete(id)` - Eliminar

## Data Flow Examples

### Ejemplo 1: Crear una transacción de gasto

```typescript
const transactionService = new TransactionService(prisma);

await transactionService.createTransaction(userId, {
  accountId: 'checking-123',
  categoryId: 'groceries-456',
  type: 'EXPENSE',
  amount: 75.50,
  description: 'Weekly groceries',
  dueDate: new Date('2026-03-15'),
});

// Resultado:
// - Crea una transacción PENDING en el repositorio
// - Balance actual NO cambia (solo transacciones PAID cuentan)
// - Balance proyectado SÍ cambia (incluye PENDING futuras)
```

### Ejemplo 2: Crear una transferencia

```typescript
await transactionService.createTransfer(userId, {
  fromAccountId: 'checking-123',
  toAccountId: 'savings-789',
  amount: 500,
  description: 'Monthly savings',
  dueDate: new Date('2026-03-15'),
});

// Genera dos transacciones:
// 1. TRANSFER en checking-123, amount: 500, se resta del saldo
// 2. TRANSFER en savings-789, amount: 500, se suma al saldo
// Ambas comparten transferGroupId
```

### Ejemplo 3: Crear una regla de recurrencia (salario mensual)

```typescript
const recurringService = new RecurringService(prisma);

await recurringService.createRecurringRule(userId, {
  name: 'Monthly Salary',
  type: 'INCOME',
  amount: 3000,
  frequency: 'MONTHLY',
  dayOfMonth: 1,
  startDate: new Date('2026-03-01'),
  accountId: 'checking-123',
  categoryId: 'salary-001',
});

// Genera automáticamente transacciones PENDING para:
// 2026-03-01
// 2026-04-01
// 2026-05-01
// ... indefinidamente (endDate es null)
```

### Ejemplo 4: Calcular proyección

```typescript
const projectionService = new ProjectionService(prisma);

const projection = await projectionService.getAccountProjection(
  userId,
  'checking-123'
);

// Retorna:
// {
//   accountId: 'checking-123',
//   accountName: 'Checking',
//   currentBalance: 5000,           // Solo PAID
//   projectedBalance: 5500,         // PAID + PENDING futuros
//   pendingIncome: 3000,            // Salario recurrente
//   pendingExpense: 2500,           // Gastos pendientes
//   projectionDate: 2026-03-09
// }
```

## Error Handling

Todos los servicios utilizan las clases de error personalizadas:

```typescript
// ValidationError - 400
throw new ValidationError('Invalid amount', {
  amount: 'Amount must be greater than 0'
});

// NotFoundError - 404
throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');

// AppError - genérico
throw new AppError(400, 'Custom error message', 'CUSTOM_CODE');
```

## Testing Strategy

Para cada servicio se deben incluir tests que verifiquen:

1. **BalanceService**:
   - Cálculo correcto de balance positivo
   - Cálculo correcto de balance negativo
   - Balance múltiples cuentas
   - Solo incluye PAID

2. **TransactionService**:
   - Creación correcta
   - Validaciones (monto, fecha, cuenta)
   - Transferencias generan 2 transacciones
   - Borrar transacción borra par si es transferencia

3. **RecurringService**:
   - Generación WEEKLY
   - Generación MONTHLY
   - Generación YEARLY
   - Generación con cuotas (installments)
   - No duplica transacciones existentes

4. **ProjectionService**:
   - Proyección incluye solo PENDING futuros
   - Cálculo correcto de ingresos y gastos
   - Timeline de múltiples meses
   - Múltiples cuentas

## Next Steps

Los servicios están listos para ser utilizados en controllers. El siguiente paso es crear:

1. **Controllers** - HTTP request handlers
2. **Routes** - Endpoints de API
3. **DTOs** - Schemas de validación
4. **Tests** - Suite de pruebas
