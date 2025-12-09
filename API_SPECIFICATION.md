# API Specification Doc

**Clinica Caja y Facturación - APIs de Interconexión**

| Atributo | Valor |
|----------|-------|
| **Versión** | 1.0 |
| **Fecha** | 04-Dic-2025 |
| **Autor** | Sistema de Caja |
| **Descripción** | APIs para interconexión entre Gestión de Citas, Atención Clínica y Caja & Facturación |

---

## Index

1. [Crear Presupuesto](#1-crear-presupuesto)
2. [Obtener Saldo del Paciente](#2-obtener-saldo-del-paciente)
3. [Registrar Cobro/Pago](#3-registrar-cobropago)
4. [Obtener Comprobante PDF](#4-obtener-comprobante-pdf)
5. [Obtener Historial de Pagos](#5-obtener-historial-de-pagos)

---

## Conventions

| Convención | Descripción |
|-----------|------------|
| **Client** | Aplicación cliente (Gestión de Citas, Atención Clínica) |
| **Status** | Código de estado HTTP de la respuesta |
| **Formato** | Todas las respuestas están en JSON |
| **Parámetros** | Obligatorios a menos que se indique [opcional] |
| **Valores** | Se muestran como [valor1\|valor2] donde \| significa OR |

---

## Status Codes

| Código | Descripción |
|--------|------------|
| **200** | OK - Solicitud exitosa |
| **201** | Created - Recurso creado exitosamente |
| **400** | Bad Request - Error en los parámetros del cliente |
| **401** | Unauthorized - Autenticación fallida |
| **404** | Not Found - Recurso no encontrado |
| **500** | Internal Server Error - Error del servidor |
| **502** | Bad Gateway - Servicio externo no disponible |

---

## Methods

### 1. Crear Presupuesto

Endpoint solicitado por Atención Clínica para que Caja genere un presupuesto con los tratamientos a realizar.

**Request**

| Atributo | Valor |
|----------|-------|
| **Método** | POST |
| **URL** | `/api/presupuestos/crear` |

**Parámetros**

| Tipo | Parámetro | Tipo de Dato | Requerido | Ejemplo |
|------|-----------|-------------|----------|---------|
| BODY | idPaciente | integer | Sí | 36 |
| BODY | nombrePaciente | string | [opcional] | "Juan Pérez" |
| BODY | tratamientos | array | Sí | [{ idTratamiento: 1, cantidad: 2 }] |
| BODY | tratamientos[].idTratamiento | integer | Sí | 1 |
| BODY | tratamientos[].cantidad | integer | Sí | 2 |

**Request Example**

```json
POST /api/presupuestos/crear HTTP/1.1
Host: localhost:3002
Content-Type: application/json

{
  "idPaciente": 36,
  "nombrePaciente": "Juan Pérez",
  "tratamientos": [
    {
      "idTratamiento": 1,
      "cantidad": 2
    },
    {
      "idTratamiento": 2,
      "cantidad": 1
    }
  ]
}
```

**Response**

| Status | Respuesta | Descripción |
|--------|-----------|------------|
| **201** | Presupuesto creado exitosamente | `{"idPresupuesto": 25, "idPaciente": 36, "total": 5000, "detalles": [...]}` |
| **400** | Error en validación | `{"error": "Falta idPaciente."}` |
| **400** | Tratamientos vacíos | `{"error": "Debe incluir al menos un tratamiento."}` |
| **500** | Error interno | `{"error": "Error interno al crear el presupuesto"}` |

**Response Example (201)**

```json
{
  "idPresupuesto": 25,
  "idPaciente": 36,
  "nombrePaciente": "Juan Pérez",
  "fechaEmision": "2025-12-04T10:30:00.000Z",
  "fechaVigencia": "2025-01-04T10:30:00.000Z",
  "total": 5000,
  "detalles": [
    {
      "idTratamiento": 1,
      "cantidad": 2,
      "precioUnitario": 1500,
      "precioTotal": 3000
    },
    {
      "idTratamiento": 2,
      "cantidad": 1,
      "precioUnitario": 2000,
      "precioTotal": 2000
    }
  ]
}
```

---

### 2. Obtener Saldo del Paciente

Endpoint solicitado por Gestión de Citas para verificar cuánto adeuda un paciente antes de permitir agendar cita.

**Request**

| Atributo | Valor |
|----------|-------|
| **Método** | GET |
| **URL** | `/api/saldo/:idPaciente` |

**Parámetros**

| Tipo | Parámetro | Tipo de Dato | Requerido | Ejemplo |
|------|-----------|-------------|----------|---------|
| URL | idPaciente | integer | Sí | 36 |

**Request Example**

```http
GET /api/saldo/36 HTTP/1.1
Host: localhost:3002
```

**Response**

| Status | Respuesta | Descripción |
|--------|-----------|------------|
| **200** | Saldo obtenido | `{"idPaciente": 36, "saldoPendiente": 24400, "totalTratamientos": 24500, "totalPagado": 100, "tratamientosPendientes": [...]}` |
| **400** | ID inválido | `{"error": "ID de paciente inválido"}` |
| **500** | Error interno | `{"error": "Error interno al obtener saldo"}` |

**Response Example (200)**

```json
{
  "idPaciente": 36,
  "totalTratamientos": 24500,
  "totalPagado": 100,
  "saldoPendiente": 24400,
  "tratamientosPendientes": [
    {
      "idPresupuesto": 25,
      "nombreTratamiento": "Limpieza dental",
      "cantidad": 1,
      "precioUnitario": 500,
      "precioTotal": 500
    },
    {
      "idPresupuesto": 24,
      "nombreTratamiento": "Extracción molar",
      "cantidad": 2,
      "precioUnitario": 2500,
      "precioTotal": 5000
    }
  ]
}
```

**Lógica de Decisión (Gestión de Citas)**

Gestión de Citas usa estos valores para decidir:

- Si `saldoPendiente = 0`: ✅ Puede agendar sin restricción
- Si `saldoPendiente > 0`: Aplica su propia política de pago
  - Ejemplo: "Debe pagar al menos el 50% antes de agendar"
  - O: "Solo puede agendar si debe menos de $1,000"

---

### 3. Registrar Cobro/Pago

Endpoint para registrar un pago realizado por el paciente en Caja.

**Request**

| Atributo | Valor |
|----------|-------|
| **Método** | POST |
| **URL** | `/api/cobros` |

**Parámetros**

| Tipo | Parámetro | Tipo de Dato | Requerido | Valores Aceptados |
|------|-----------|-------------|----------|------------------|
| BODY | idCita | integer | Sí | 1-999999 |
| BODY | idPaciente | integer | Sí | 1-999999 |
| BODY | idPresupuesto | integer | [opcional] | 1-999999 |
| BODY | monto | decimal | Sí | >0 |
| BODY | metodoPago | string | Sí | EFECTIVO\|TARJETA\|TRANSFERENCIA |

**Request Example**

```json
POST /api/cobros HTTP/1.1
Host: localhost:3002
Content-Type: application/json

{
  "idCita": 999,
  "idPaciente": 36,
  "idPresupuesto": 25,
  "monto": 12200,
  "metodoPago": "EFECTIVO"
}
```

**Response**

| Status | Respuesta | Descripción |
|--------|-----------|------------|
| **201** | Cobro registrado | `{"mensaje": "Cobro registrado correctamente", "idCobro": 1}` |
| **400** | Parámetro faltante | `{"error": "idCita, idPaciente, monto (>0) y metodoPago son obligatorios"}` |
| **500** | Error interno | `{"error": "Error interno del servidor"}` |

**Response Example (201)**

```json
{
  "mensaje": "Cobro registrado correctamente",
  "idCobro": 1
}
```

**Notas**

- El cobro se registra automáticamente en la tabla `pago`
- Se notifica a Gestión de Citas con el nuevo saldo (asincrónico)
- El campo `idPresupuesto` es recomendado para rastrabilidad

---

### 4. Obtener Comprobante PDF

Endpoint para descargar el comprobante en PDF del pago realizado.

**Request**

| Atributo | Valor |
|----------|-------|
| **Método** | GET |
| **URL** | `/api/cobros/:id/comprobante` |

**Parámetros**

| Tipo | Parámetro | Tipo de Dato | Requerido | Ejemplo |
|------|-----------|-------------|----------|---------|
| URL | id | integer | Sí | 1 |

**Request Example**

```http
GET /api/cobros/1/comprobante HTTP/1.1
Host: localhost:3002
Accept: application/pdf
```

**Response**

| Status | Respuesta | Descripción |
|--------|-----------|------------|
| **200** | PDF generado | Archivo PDF descargable con el comprobante |
| **400** | ID inválido | `{"error": "ID inválido"}` |
| **404** | No encontrado | `{"error": "Cobro no encontrado"}` |
| **500** | Error interno | `{"error": "Error generando comprobante"}` |

**Response Headers (200)**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="comprobante_1.pdf"
```

**Contenido del PDF**

```
═══════════════════════════════════
    Clínica - Comprobante de Pago
═══════════════════════════════════

ID Cobro:      1
Fecha:         04/12/2025, 10:30
Método:        EFECTIVO

Paciente:      Juan Pérez
ID Paciente:   36
Presupuesto:   25

Monto pagado:  $ 12,200.00

Gracias por su pago.
═══════════════════════════════════
```

---

### 5. Obtener Historial de Pagos

Endpoint para obtener el historial de todos los pagos de un paciente.

**Request**

| Atributo | Valor |
|----------|-------|
| **Método** | GET |
| **URL** | `/api/cobros/list` |

**Parámetros**

| Tipo | Parámetro | Tipo de Dato | Requerido | Ejemplo |
|------|-----------|-------------|----------|---------|
| QUERY | pacienteId | integer | Sí | 36 |

**Request Example**

```http
GET /api/cobros/list?pacienteId=36 HTTP/1.1
Host: localhost:3002
```

**Response**

| Status | Respuesta | Descripción |
|--------|-----------|------------|
| **200** | Lista de pagos | `{"pagos": [{ idPago: 1, monto: 100, ... }]}` |
| **400** | Falta parámetro | `{"error": "Falta idPaciente en query"}` |
| **500** | Error interno | `{"error": "Error interno listando pagos"}` |

**Response Example (200)**

```json
{
  "pagos": [
    {
      "idPago": 1,
      "idPresupuesto": 25,
      "fechaPago": "2025-12-04T10:30:00.000Z",
      "monto": 100,
      "metodoPago": "EFECTIVO",
      "referencia": null
    },
    {
      "idPago": 2,
      "idPresupuesto": 25,
      "fechaPago": "2025-12-03T15:45:00.000Z",
      "monto": 12100,
      "metodoPago": "TRANSFERENCIA",
      "referencia": "TRF-2025-001"
    }
  ]
}
```

---

## Glossary

| Término | Definición |
|---------|-----------|
| **Presupuesto** | Estimación de costo de tratamientos generada por Caja a solicitud de Atención Clínica |
| **Saldo Pendiente** | Monto total que un paciente aún debe por tratamientos completados |
| **Cobro/Pago** | Registro de dinero recibido del paciente por servicios prestados |
| **Comprobante** | Documento PDF que evidencia el pago realizado |
| **idPresupuesto** | Identificador único del presupuesto en la BD |
| **idCobro** | Identificador único del pago/cobro en la BD |
| **idPaciente** | Identificador único del paciente en el sistema |
| **idCita** | Identificador único de la cita médica |
| **metodoPago** | Forma en que se realiza el pago (Efectivo, Tarjeta, Transferencia) |

---

## Flujos de Interconexión

### Escenario 1: Paciente Nuevo

```
Atención Clínica
       ↓
  POST /api/presupuestos/crear
       ↓
    Caja
       ↓
  Retorna idPresupuesto + total
       ↓
  Atención emite presupuesto al paciente
       ↓
  Paciente realiza pago
       ↓
  Caja: POST /api/cobros
       ↓
  GET /api/cobros/:id/comprobante
       ↓
  Comprobante PDF generado
```

### Escenario 2: Paciente con Seguimiento

```
Gestión de Citas
       ↓
  GET /api/saldo/:idPaciente
       ↓
    Caja retorna saldoPendiente
       ↓
  Gestión de Citas decide si permite agendar
       ↓
  (Si falta pagar) Caja: POST /api/cobros
       ↓
  GET /api/cobros/:id/comprobante
       ↓
  Comprobante PDF generado
       ↓
  Gestión de Citas procede con cita
```

---

## Notas de Implementación

1. **Timeouts**: Se recomienda timeout de 8 segundos para todas las llamadas
2. **Errores de Conexión**: Si Gestión de Citas no responde, Caja continúa sin fallar
3. **Notificaciones Asincrónicas**: Los cambios de saldo se notifican en background
4. **Validación**: Todos los parámetros numéricos deben ser > 0
5. **PDF**: El comprobante se genera en tiempo real con datos actualizados

---

**Fin de la Documentación**
