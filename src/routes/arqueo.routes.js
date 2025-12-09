import express from 'express';
import { 
    generarArqueo, 
    guardarArqueo, 
    obtenerArqueos, 
    obtenerArqueoPorId 
} from '../controllers/arqueo.controller.js';

const router = express.Router();

// POST /api/arqueo/generar - Calcular arqueo del día (sin guardar)
router.post('/generar', generarArqueo);

// POST /api/arqueo - Guardar arqueo en la BD
router.post('/', guardarArqueo);

// GET /api/arqueo - Listar todos los arqueos
router.get('/', obtenerArqueos);

// GET /api/arqueo/:id - Obtener un arqueo específico
router.get('/:id', obtenerArqueoPorId);

export default router;
