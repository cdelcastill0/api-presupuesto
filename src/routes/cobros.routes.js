import { Router } from 'express';
import {
  crearCobro,
  listarCitasPendientes
} from '../controllers/cobros.controller.js';

const router = Router();
// get /api/cobros/citas-pendientes
router.get('/citas-pendientes', listarCitasPendientes);
// post /api/cobros
router.post('/', crearCobro);
/*ejemplo
{
  "idCita": 19,
  "idPaciente": 1,
  "monto": 500,
  "metodoPago": "EFECTIVO"
}
*/

export default router;
