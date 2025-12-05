import { Router } from 'express';
import {
  crearCobro,
  listarCitasPendientes,
  obtenerCobroPorId,
} from '../controllers/cobros.controller.js';

const router = Router();

// GET /api/cobros/citas-pendientes
router.get('/citas-pendientes', listarCitasPendientes);

// POST /api/cobros
router.post('/', crearCobro);

/*
Ejemplo body:
{
  "idCita": 19,
  "idPaciente": 1,
  "monto": 500,
  "metodoPago": "EFECTIVO"
}
*/

// Listar pagos por paciente: /api/cobros/list?pacienteId=1
router.get('/list', async (req, res, next) => {
  try {
    const { listarPagos } = await import('../controllers/cobros.controller.js');
    return listarPagos(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Obtener comprobante PDF de un cobro
router.get('/:id/comprobante', async (req, res, next) => {
  // delegar al controlador (se importa dinámicamente para evitar ciclos)
  try {
    const { obtenerComprobantePdf } = await import('../controllers/cobros.controller.js');
    return obtenerComprobantePdf(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Obtener un cobro/pago por id
router.get('/:id', obtenerCobroPorId);

export default router;
