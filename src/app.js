// src/app.js
import express from "express";
import cors from "cors";

import presupuestoRoutes from "./routes/presupuesto.routes.js";
import pacienteRoutes from "./routes/paciente.routes.js";
import integracionAtencionRoutes from "./routes/integracionAtencion.routes.js";
import pacientesRouter from './routes/pacientes.routes.js';
import cobrosRouter from './routes/cobros.routes.js';
import saldoRoutes from "./routes/saldo.routes.js";
import tratamientosSyncRoutes from './routes/tratamientosSync.routes.js';
const app = express();

// Middlewares globales
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173")
      .split(",")
      .map((o) => o.trim()),
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint de salud (útil para pruebas y monitoreo)
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "clinica-caja-api",
    timestamp: new Date().toISOString(),
  });
});

// Rutas de negocio
// Servicios 6 y 7 de la matriz: SOLICITA_PRESP / PRESUPUESTO
app.use("/api/presupuestos", presupuestoRoutes);
// Alias por si en algún lugar usan singular
app.use("/api/presupuesto", presupuestoRoutes);

// Gestión local de pacientes
//app.use("/api/pacientes", pacienteRoutes);

// Integración con Atención Clínica (envío de catálogo de tratamientos)
app.use(integracionAtencionRoutes);
// Rutas
app.use('/api/pacientes', pacientesRouter);
app.use('/api/cobros', cobrosRouter);


app.use("/api/saldo", saldoRoutes);


app.use('/api/tratamientos', tratamientosSyncRoutes);

// Endpoint de salud para monitoreo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'caja' });
});
export default app;
