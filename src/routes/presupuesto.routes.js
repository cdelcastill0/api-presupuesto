// src/routes/presupuesto.routes.js
import express from "express";
import {
  crearPresupuesto,
  obtenerPresupuestoPorId,
  obtenerPresupuestos,
} from "../controllers/presupuesto.controller.js";

const router = express.Router();

// Servicio 6 de la matriz: SOLICITA_PRESP (alias legado)
router.post("/solicita_presp", crearPresupuesto);

// Alias para el frontend React (usa /api/presupuestos/crear)
router.post("/crear", crearPresupuesto);

// Servicio auxiliar para consultar un presupuesto concreto (PRESUPUESTO)
router.get("/:id", obtenerPresupuestoPorId);

// Listar presupuestos (para frontend)
router.get("/", obtenerPresupuestos);

export default router;
