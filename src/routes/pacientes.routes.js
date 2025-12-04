import { Router } from 'express';
import {
  crearPaciente,
  sincronizarPacientesDesdeSIGCD,
} from '../controllers/pacientes.controller.js';

const router = Router();

// POST /api/pacientes
router.post('/', crearPaciente);

// POST /api/pacientes/sync-desde-sigcd
router.post('/sync-desde-sigcd', sincronizarPacientesDesdeSIGCD);

export default router;
