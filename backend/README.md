# MoneyMess Backend

Personal finance PWA backend built with Fastify, TypeScript, and Prisma.

## Architecture

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/      # HTTP request handlers
│   ├── plugins/          # Fastify plugins
│   ├── repositories/     # Database access layer
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utilities and helpers
│   ├── app.ts            # Fastify configuration
│   └── server.ts         # Server entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── package.json
├── tsconfig.json
└── .env
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure database

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update `DATABASE_URL` with your MariaDB connection string.

### 3. Run migrations

```bash
npm run prisma:migrate
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

## Development

Start the development server:

```bash
npm run dev
```

The server will be available at `http://localhost:3000`

### Available scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:seed` - Seed database with sample data
- `npm run prisma:studio` - Open Prisma Studio UI
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## API

### Health Check

```
GET /health

Response:
{
  "success": true,
  "message": "Health check passed",
  "data": {
    "status": "ok",
    "timestamp": "2026-03-08T...",
    "uptime": 123.45
  }
}
```

## Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Render will auto-detect the Node.js application
5. Build command: `npm run build && npm run prisma:migrate`
6. Start command: `npm start`

## Stack

- **Framework**: Fastify 4
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: MariaDB
- **Validation**: (coming soon)
- **Authentication**: JWT
- **Logging**: Pino

## Error Handling

The API uses a centralized error handler that returns consistent error responses:

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input"
}
```

## Financial Services

Se han implementado 4 servicios de dominio que encapsulan la lógica financiera:

### BalanceService
Calcula el balance actual de una cuenta basado en transacciones pagadas.
```
Current Balance = Sum(INCOME) - Sum(EXPENSE)
```

### TransactionService
Gestiona transacciones (creación, actualización, eliminación).
- Crear transacciones de ingreso/gasto
- Crear transferencias entre cuentas (genera 2 transacciones)
- Marcar como pagadas/pendientes
- Validaciones de integridad

### RecurringService
Genera transacciones futuras basadas en reglas de recurrencia.
- Soporta frecuencias: WEEKLY, MONTHLY, YEARLY
- Soporta cuotas (installments) para créditos
- Generación automática de transacciones

### ProjectionService
Calcula proyecciones financieras futuras.
```
Projected Balance = Current Balance + Future Pending Income - Future Pending Expense
```

**Ver [SERVICES.md](./SERVICES.md) para documentación detallada**

## Next Steps

- Add authentication endpoints (register, login)
- Create controllers for financial services
- Add route handlers for APIs
- Implement request validation/schemas
- Add service tests
