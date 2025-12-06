// src/routes/tratamientosSync.routes.js
import { Router } from 'express';
import { syncTratamientosDesdeSIGCD } from '../controllers/tratamientosSync.controller.js';

const router = Router();

// POST /api/tratamientos/sync-desde-sigcd
router.post('/sync-desde-sigcd', syncTratamientosDesdeSIGCD);

export default router;