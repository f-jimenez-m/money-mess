# Guía de Despliegue en Render.com

## Resumen de Cambios Realizados

✅ **Cambios completados para producción:**
- [x] Schema de Prisma actualizado a PostgreSQL
- [x] DATABASE_URL configurada desde variables de entorno
- [x] Scripts de npm listos para producción
- [x] CORS configurado para dominio específico
- [x] Server escuchando en 0.0.0.0 para Render
- [x] Prisma Client se genera automáticamente con `postinstall`

---

## Step-by-Step: Desplegar en Render

### Paso 1: Preparar el Repositorio

```bash
# Asegúrate de que todos los cambios están en git
git add .
git commit -m "feat: migrate to PostgreSQL and prepare for Render deployment"
git push origin main
```

### Paso 2: Crear PostgreSQL Database en Render

1. Ir a [render.com](https://render.com)
2. Click en "New +" → "PostgreSQL"
3. Configurar:
   - **Name**: `moneymess-db`
   - **Region**: Elige la más cercana a ti
   - **PostgreSQL Version**: 15 o superior
   - **Datadog API Key**: Dejar vacío
4. Click en "Create Database"
5. **Esperar 2-3 minutos** a que se cree

### Paso 3: Crear Backend Service en Render

1. Click en "New +" → "Web Service"
2. Conectar con GitHub:
   - Link tu repositorio `money-mess`
   - Selecciona la rama `main`
3. Configuración:
   - **Name**: `moneymess-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
  - **Start Command**: `npm run prisma:migrate:deploy && npm start`
4. **Environment Variables**: Agregar desde la sección "Environment"

### Paso 4: Configurar Variables de Entorno en Render

Copiar desde la base de datos PostgreSQL creada y agregar:

```
DATABASE_URL=<copiar desde PostgreSQL credentials>
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
JWT_SECRET=<generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://tu-frontend-url.com
LOG_LEVEL=info
```

### Paso 5: Deploy y Migración de Base de Datos

1. Render hará build automáticamente
2. El `startCommand` ejecutará `prisma migrate deploy` en cada inicio antes de levantar la app
3. Verifica en logs que aparezca la ejecución de migraciones sin errores

### Paso 6: Verificar que Todo Funciona

```bash
curl https://tu-backend-url.render.app/health
```

Deberías recibir:
```json
{
  "status": "ok"
}
```

---

## Migración de Datos (Optional)

Si necesitas migrar datos de MySQL local a PostgreSQL en Render:

### Opción 1: Usando Prisma (Recomendado)

```bash
# 1. Exportar datos desde MySQL local
mysqldump -u root -p moneymess > backup.sql

# 2. Conectar con PostgreSQL remoto usando psql
psql -h <host-postgresql-render> -U <user> -d moneymess -f backup.sql
```

### Opción 2: Usando Prisma Studio

```bash
# 1. Copiar la DATABASE_URL de PostgreSQL Render
export DATABASE_URL="postgresql://..."

# 2. Conectar a Prisma Studio
npx prisma studio

# 3. Copiar datos manualmente desde views
```

---

## Estructura de Archivos Modificados

### 1. **prisma/schema.prisma**
```prisma
datasource db {
  provider = "postgresql"  # ← Cambió de "mysql"
  url      = env("DATABASE_URL")
}
```

### 2. **.env.example**
```
DATABASE_URL="postgresql://user:password@localhost:5432/moneymess"
```

### 3. **.env.production.example**
```
DATABASE_URL="postgresql://user:password@your-render-db-host:5432/moneymess"
NODE_ENV="production"
# ... otros valores
```

### 4. **src/config/env.ts**
```typescript
database: {
  url: process.env.DATABASE_URL || 'postgresql://localhost:5432/moneymess',
}
```

### 5. **package.json**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "postinstall": "prisma generate",
    ...
  }
}
```

---

## Verificación Pre-Producción (Local)

Ejecuta esto localmente con PostgreSQL para validar:

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar TypeScript
npm run build

# 3. Iniciar el servidor
npm start
```

Debería mostrar:
```
✓ Server running on http://0.0.0.0:3000
✓ Environment: production
```

---

## Troubleshooting

### Error: "Cannot find module 'prisma'"
**Solución**: El script `postinstall` genera Prisma Client automáticamente

### Error: "Connection timeout on PostgreSQL"
**Solución**: Verificar DATABASE_URL en Render environment variables

### Error: "CORS blocked request"
**Solución**: Actualizar `CORS_ORIGIN` con el URL correcto del frontend

### Migración fallida: "CREATE TABLE failed"
**Solución**: 
```bash
# Forzar reset de base de datos
npx prisma migrate reset --force
npx prisma migrate deploy
```

---

## Variables de Entorno Requeridas

| Variable | Ejemplo | Obligatoria |
|----------|---------|------------|
| DATABASE_URL | `postgresql://...` | ✅ Sí |
| NODE_ENV | `production` | ✅ Sí |
| JWT_SECRET | (random string) | ✅ Sí |
| PORT | `3000` | ⚠️ Render lo define |
| HOST | `0.0.0.0` | ⚠️ Render lo define |
| CORS_ORIGIN | `https://...` | ✅ Sí (para frontend) |

---

## Monitoreo en Producción

1. **Logs en Render**: Ir a "Logs" en el dashboard
2. **Base de Datos**: Acceder a PostgreSQL en Render:
   ```bash
   psql -h <render-host> -U <user> -d <dbname>
   ```
3. **Health Check**: `GET /health` debe retornar `200 OK`

---

## Próximos Pasos

1. ✅ Desplegar frontend en Vercel
2. ✅ Configurar dominio personalizado
3. ✅ Configurar SSL/HTTPS
4. ✅ Monitorear logs en producción
5. ✅ Implementar alertas

---

## Notas Importantes

- **PostgreSQL es más robusto** que MySQL para producción
- **Render ofrece backup automático** de PostgreSQL
- **Los datos en MySQL local se pierden** si no migras
- **JWT_SECRET debe ser fuerte y secreto** - generarlo siempre antes de producción
- **Cambiar CORS_ORIGIN** al dominio real del frontend

---

**¿Necesitas ayuda?** Revisa los logs de Render o ejecuta:
```bash
npm run build && npm start
```
