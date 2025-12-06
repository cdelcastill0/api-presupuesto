// src/controllers/saldo.controller.js
import { pool } from "../config/db.js";


/**
 * GET /api/saldo/:idPaciente
 * Devuelve:
 *  - totalTratamientos
 *  - totalPagado
 *  - saldoPendiente
 *  - tratamientosPendientes (detalle)
 */
export const obtenerSaldoPorPaciente = async (req, res) => {
  try {
    const idPaciente = Number(req.params.idPaciente);

    if (!idPaciente) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    // 1) TOTAL DE TRATAMIENTOS (suma de precios en detalle_presupuesto)
    const [totalTratRows] = await pool.query(
      `
      SELECT 
        COALESCE(SUM(dp.precioTotal), 0) AS totalTratamientos
      FROM presupuesto p
      JOIN detalle_presupuesto dp ON p.idPresupuesto = dp.idPresupuesto
      WHERE p.idPaciente = ?
      `,
      [idPaciente]
    );

    const totalTratamientos = totalTratRows[0]?.totalTratamientos || 0;

    // 2) TOTAL PAGADO (suma de pagos realizados)
    const [totalPagadoRows] = await pool.query(
      `
      SELECT 
        COALESCE(SUM(p.monto), 0) AS totalPagado
      FROM pago p
      WHERE p.idPaciente = ?
      `,
      [idPaciente]
    );

    const totalPagado = totalPagadoRows[0]?.totalPagado || 0;

    // 3) SALDO PENDIENTE
    const saldoPendiente = totalTratamientos - totalPagado;

    // 4) DETALLE DE TRATAMIENTOS PENDIENTES
    const [detallesRows] = await pool.query(
      `
      SELECT 
        dp.idPresupuesto,
        t.nombreTratamiento,
        dp.cantidad,
        dp.precioUnitario,
        dp.precioTotal
      FROM presupuesto p
      JOIN detalle_presupuesto dp ON p.idPresupuesto = dp.idPresupuesto
      JOIN tratamiento t ON dp.idTratamiento = t.idTratamiento
      WHERE p.idPaciente = ?
      ORDER BY p.idPresupuesto DESC
      `,
      [idPaciente]
    );

    return res.json({
      idPaciente,
      totalTratamientos,
      totalPagado,
      saldoPendiente,
      tratamientosPendientes: detallesRows,
    });
  } catch (error) {
    console.error("[SALDO] Error obteniendo saldo:", error);
    return res.status(500).json({ error: "Error interno al obtener saldo" });
  }
};
