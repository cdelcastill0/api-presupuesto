# Guía de Deployment - Servicio Caja

## Arquitectura del Sistema

- **Local**: Backend + Frontend en desarrollo (MySQL local)
- **Render**: Backend en producción (conectado a Railway)
- **Railway**: MySQL en la nube (base de datos de producción)

## Cambios Importantes Realizados

### 1. Migración de Base de Datos
Se agregó la columna `idPaciente` a la tabla `pago` para mejorar el rendimiento y permitir cobros sin presupuesto obligatorio.

**Ejecutar en Railway (producción):**
```sql
-- Verificar si existe la columna
SHOW COLUMNS FROM pago LIKE 'idPaciente';

-- Si no existe, ejecutar:
ALTER TABLE pago ADD COLUMN idPaciente INT AFTER idPago;
ALTER TABLE pago ADD INDEX idx_idPaciente (idPaciente);

-- Migrar datos existentes
UPDATE pago p
JOIN presupuesto pr ON p.idPresupuesto = pr.idPresupuesto
SET p.idPaciente = pr.idPaciente
WHERE p.idPaciente IS NULL AND p.idPresupuesto IS NOT NULL;
```

### 2. Nuevas Funcionalidades

- **GET /api/pacientes**: Listar todos los pacientes
- **idCita opcional**: Ya no es obligatorio al crear cobros
- **Navegación mejorada**: Botón "Cobrar" en presupuestos funcional
- **Campo nombrePaciente**: Agregado a la tabla de presupuestos
- **Historial de pagos**: Corregido el formato de fechas

### 3. Archivos Modificados

**Backend:**
- `src/controllers/cobros.controller.js` - idCita opcional, idPaciente en comprobante
- `src/controllers/pacientes.controller.js` - Nuevo endpoint GET /api/pacientes
- `src/controllers/presupuesto.controller.js` - JOIN con paciente para nombrePaciente
- `src/routes/pacientes.routes.js` - Ruta GET agregada
- `src/services/caja.service.js` - Consultas actualizadas para usar idPaciente

**Frontend:**
- `clinica-front/src/App.jsx` - Navegación sin React Router
- `clinica-front/src/pages/PresupuestoPage.jsx` - Botón Cobrar funcional
- `clinica-front/src/pages/CobrosPage.jsx` - idCita opcional, fechas corregidas
- `clinica-front/src/pages/PacientesPage.jsx` - Usa fetchPacientes correctamente
- `clinica-front/src/components/FormPresupuesto.jsx` - Campo nombrePaciente

## Pasos para Deployment

### Paso 1: Ejecutar Migración en Railway

1. Ir a Railway dashboard: https://railway.app
2. Seleccionar tu base de datos MySQL
3. Ir a la pestaña "Query" o conectarte por CLI
4. Ejecutar el script SQL de arriba

**O usar el script Node.js:**
```bash
# En Render, agregar variable de entorno que apunte a Railway
DB_HOST=<railway-host>
DB_PORT=<railway-port>
DB_USER=root
DB_PASSWORD=<railway-password>
DB_NAME=clinica

# Ejecutar la migración
node fix-migration.js
```

### Paso 2: Actualizar Código en GitHub

```bash
# Agregar todos los cambios
git add .

# Hacer commit
git commit -m "feat: Add idPaciente to pago table, improve frontend navigation and features"

# Subir a GitHub
git push origin main
```

### Paso 3: Verificar Deployment en Render

Render detectará automáticamente el push a GitHub y hará el redeploy.

**Variables de entorno necesarias en Render:**
```
DB_HOST=<railway-host>
DB_PORT=<railway-port>
DB_USER=root
DB_PASSWORD=<railway-password>
DB_NAME=clinica
PORT=3002
CORS_ORIGIN=http://localhost:5173,https://<tu-frontend-en-render>.onrender.com
SIGCD_BASE_URL=https://gestion-citas-wmty.onrender.com
```

### Paso 4: Conectar Frontend Local a Backend de Producción (Opcional)

Si quieres ver los presupuestos de anoche en tu frontend local:

**Opción A: Conectar frontend local a Render**
```bash
# En clinica-front/.env
VITE_CAJA_API_URL=https://<tu-backend-en-render>.onrender.com
```

**Opción B: Conectar backend local a Railway**
```bash
# En .env del backend
DB_HOST=<railway-host>
DB_PORT=<railway-port>
DB_USER=root
DB_PASSWORD=<railway-password>
DB_NAME=clinica
```

## Verificación Post-Deployment

### En Render (Producción):
```bash
# Verificar salud del servicio
curl https://<tu-backend>.onrender.com/api/health

# Ver presupuestos
curl https://<tu-backend>.onrender.com/api/presupuestos

# Ver pacientes
curl https://<tu-backend>.onrender.com/api/pacientes
```

### En Local:
```bash
# Backend
node index.js

# Frontend
cd clinica-front && npm run dev
```

## Notas Importantes

1. **Los datos de anoche están en Railway**, no en tu MySQL local
2. **Render se actualiza automáticamente** cuando haces push a GitHub
3. **La migración SQL debe ejecutarse en Railway** antes o después del deploy
4. **Backup**: Railway hace backups automáticos, pero considera hacer uno manual antes de la migración

## Troubleshooting

### Frontend local no muestra presupuestos de anoche
- Tu frontend local está conectado a MySQL local (vacío)
- Solución: Cambiar VITE_CAJA_API_URL a la URL de Render

### Error en Render después del deploy
- Verificar que la migración SQL se ejecutó en Railway
- Revisar logs en Render dashboard
- Verificar variables de entorno

### Comprobante PDF con datos vacíos
- La columna idPaciente no existe en Railway
- Ejecutar la migración SQL en Railway
