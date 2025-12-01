// src/routes/paciente.routes.js
import express from "express";
import {
  obtenerPacientes,
  registrarPaciente,
  actualizarPaciente,
  eliminarPaciente,
} from "../controllers/paciente.controller.js";

const router = express.Router();

router.get("/", obtenerPacientes);
router.post("/", registrarPaciente);
router.put("/:id", actualizarPaciente);
router.delete("/:id", eliminarPaciente);

export default router;
