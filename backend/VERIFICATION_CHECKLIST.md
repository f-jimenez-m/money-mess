# Pre-Production Verification Checklist

## 📋 Verificación de Cambios

### Schema de Prisma
- [x] `provider = "postgresql"` está configurado (antes era "mysql")
- [x] `url = env("DATABASE_URL")` se lee desde variables de entorno
- [x] Todos los modelos mantienen sus propiedades (sin cambios de tipos)

Archivo modificado: `prisma/schema.prisma`

### Variables de Entorno

- [x] `.env.example` actualizado con URL PostgreSQL
- [x] `.env.production.example` creado con instrucciones
- [x] `src/config/env.ts` con URL por defecto PostgreSQL

Archivos modificados:
- `.env.example`
- `.env.production.example`
- `src/config/env.ts`

### Package.json Scripts

- [x] `npm run build` → compila TypeScript
- [x] `npm start` → inicia servidor en producción
- [x] `npm run dev` → desarrollo con tsx watch
- [x] `postinstall` → genera Prisma Client automáticamente

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "postinstall": "prisma generate"
  }
}
```

Archivo: `package.json`

### Configuración de Servidor

- [x] Puerto: `process.env.PORT || 3000`
- [x] Host: `0.0.0.0` (escucha en todas las interfaces)
- [x] CORS: configurado desde `config.cors.origin`
- [x] Helmet: habilitado para seguridad
- [x] Logger: automático (pino-pretty en dev, simple en prod)

Archivo: `src/app.ts` y `src/server.ts`

### Base de Datos

- [x] PostgreSQL como provider
- [x] `DATABASE_URL` desde variables de entorno
- [x] Conexión con Prisma client generado automáticamente
- [x] Migraciones listas con `npx prisma migrate deploy`

---

## ✅ Verificación Local (Antes de Subir)

### 1. Build y Compilación

```bash
cd backend
npm install
npm run build
```

**Resultado esperado**: No hay errores, carpeta `dist/` creada con archivos `.js`

### 2. Type Checking

```bash
npm run type-check
```

**Resultado esperado**: Sin errores TypeScript

### 3. Verificación de Variables

```bash
# Ver que las variables están disponibles
npm run dev
```

Debería mostrar:
```
✓ Server running on http://0.0.0.0:3000
✓ Environment: development
```

### 4. Health Check

```bash
curl http://localhost:3000/health
```

**Resultado esperado**:
```json
{"status":"ok"}
```

### 5. Migración de Base de Datos

```bash
# Si estás usando PostgreSQL local para testing:
npx prisma migrate deploy

# O para desarrollo:
npx prisma migrate dev
```

---

## 🚀 Verificación en Render

### 1. Logs del Deploy

El servicio debe mostrar:
```
build completed successfully
✓ Server running on http://0.0.0.0:3000
✓ Environment: production
```

### 2. Health Check Remoto

```bash
curl https://moneymess-backend.render.app/health
```

### 3. Base de Datos Conectada

```bash
# En logs de Render
curl https://moneymess-backend.render.app/api/users/profile
# Debería retornar 401 (sin token) o datos del usuario
```

---

## 📦 Archivos Modificados

| Archivo | Cambio | Motivo |
|---------|--------|--------|
| `prisma/schema.prisma` | provider: mysql → postgresql | PostgreSQL en Render |
| `.env.example` | DATABASE_URL: mysql:// → postgresql:// | Configuración local |
| `.env.production.example` | NUEVO | Referencia para Render |
| `src/config/env.ts` | url por defecto a postgresql | Validación de tipo |
| `package.json` | + postinstall script | Prisma Client auto-generate |
| `render.yaml` | NUEVO (opcional) | Infrastructure as Code |
| `RENDER_DEPLOYMENT.md` | NUEVO | Guía de despliegue |

---

## ⚠️ Notas Importantes

1. **Cambios de Tipos de Datos**: PostgreSQL maneja Decimal, DateTime y otros tipos igual que MySQL, así que NO hay cambios en el schema de modelos.

2. **Migración de Datos**: 
   - Los datos en MySQL local NO se migran automáticamente
   - Ver `RENDER_DEPLOYMENT.md` para instrucciones de migración

3. **Production vs Development**:
   - Dev: `NODE_ENV=development`, pino-pretty logs
   - Prod: `NODE_ENV=production`, logs simples

4. **CORS Crítico**:
   - Sin `CORS_ORIGIN` correcto, el frontend no puede llamar a la API
   - Actualizar con dominio real del frontend

5. **JWT_SECRET**:
   - DEBE ser generado aleatoriamente
   - NUNCA usar el valor por defecto en producción
   - Generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 🔄 Próximo Paso

Una vez verificado todo localmente:

```bash
git add .
git commit -m "chore: configure PostgreSQL and prepare for Render deployment"
git push origin main
```

Render hará auto-deploy cuando detecte cambios en `main`.

---

## 📞 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Cannot find module 'prisma'" | `npm install` ejecutará postinstall automáticamente |
| "Connection refused on PostgreSQL" | Verificar DATABASE_URL en Render env vars |
| "CORS error" | Actualizar CORS_ORIGIN con URL correcto |
| "401 Unauthorized" | JWT_SECRET debe estar configurado |
| "Build fails" | Revisar `npm run build` localmente primero |

---

Status: ✅ **LISTO PARA PRODUCCIÓN**
