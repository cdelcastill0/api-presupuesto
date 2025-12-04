// src/controllers/cobros.controller.js
import { pool } from '../config/db.js';
import {
  obtenerCitasPendientesDesdeSIGCD,
  registrarPagoEnSIGCD,
} from '../services/sigcd.service.js';


// GET /api/cobros/citas-pendientes
export async function listarCitasPendientes(req, res) {
  try {
    const citas = await obtenerCitasPendientesDesdeSIGCD();
    return res.json(citas);
  } catch (error) {
    console.error('[Caja] Error consultando citas en SIGCD:', error.message);
    return res
      .status(502)
      .json({ error: 'No se pudieron obtener las citas desde SIGCD' });
  }
}

// POST /api/cobros
export async function crearCobro(req, res) {
  try {
    const { idCita, idPaciente, monto, metodoPago } = req.body || {};

    const idCitaNum = parseInt(idCita, 10);
    const idPacienteNum = parseInt(idPaciente, 10);
    const montoNum = Number(monto);

    if (
      Number.isNaN(idCitaNum) ||
      Number.isNaN(idPacienteNum) ||
      Number.isNaN(montoNum) ||
      montoNum <= 0 ||
      !metodoPago
    ) {
      return res.status(400).json({
        error:
          'idCita, idPaciente, monto (>0) y metodoPago son obligatorios y válidos',
      });
    }

    // 1) Guardar el cobro en MySQL (Caja)
    const [result] = await pool.query(
      `INSERT INTO COBRO (idCita, idPaciente, monto, metodoPago)
       VALUES (?, ?, ?, ?)`,
      [idCitaNum, idPacienteNum, montoNum, metodoPago]
    );

    const idCobro = result.insertId;

    // 2) Intentar informar a SIGCD del pago
    try {
      await registrarPagoEnSIGCD({
        idCita: idCitaNum,
        idPaciente: idPacienteNum,
        monto: montoNum,
        metodoPago,
        idCobroCaja: idCobro,
      });
    } catch (syncError) {
      console.error(
        '[Caja] Cobro creado, pero falló actualizar SIGCD:',
        syncError.message
      );
      // Aquí podrías marcar algo en BD si quieres manejar "pendiente de sincronizar"
    }

    return res.status(201).json({
      mensaje: 'Cobro registrado correctamente',
      idCobro,
    });
  } catch (error) {
    console.error('[Caja] Error creando cobro:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

