// src/routes/saldo.routes.js
import { Router } from "express";
import { obtenerSaldoPorPaciente } from "../controllers/saldo.controller.js";

const router = Router();

router.get("/:idPaciente", obtenerSaldoPorPaciente);

export default router;
