import { Router } from 'express';
import {
  obtenerPacientes,
  crearPaciente,
  sincronizarPacientesDesdeSIGCD,
} from '../controllers/pacientes.controller.js';

const router = Router();

// GET /api/pacientes
router.get('/', obtenerPacientes);

// POST /api/pacientes
router.post('/', crearPaciente);

// POST /api/pacientes/sync-desde-sigcd
router.post('/sync-desde-sigcd', sincronizarPacientesDesdeSIGCD);

export default router;
