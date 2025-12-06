// src/controllers/tratamientosSync.controller.js
import { pool } from '../config/db.js';

/**
 * POST /api/tratamientos/sync-desde-sigcd
 *
 * Body esperado:
 * {
 *   tratamientos: [
 *     {
 *       id_tratamiento,
 *       cve_trat,
 *       nombre,
 *       descripcion,
 *       precio_base,
 *       duracion_min,
 *       activo
 *     }
 *   ]
 * }
 *
 * Por ahora se guardan los campos que sí existen en la BD de Caja:
 *   tratamiento(idTratamiento, nombreTratamiento, descripcion, precioBase)
 */
export async function syncTratamientosDesdeSIGCD(req, res) {
  try {
    const { tratamientos } = req.body || {};

    if (!Array.isArray(tratamientos) || tratamientos.length === 0) {
      return res.status(400).json({
        error:
          'El body debe incluir un arreglo "tratamientos" con al menos un elemento.',
      });
    }

    let insertados = 0;
    let actualizados = 0;

    for (const t of tratamientos) {
      const {
        id_tratamiento,
        nombre,
        descripcion,
        precio_base,
      } = t || {};

      if (!nombre) {
        // si viene mal uno, lo saltamos y seguimos
        console.warn(
          '[CAJA] Tratamiento sin nombre recibido desde SIGCD, se omite:',
          t
        );
        continue;
      }

      // Nota:
      // - id_tratamiento viene de SIGCD.
      // - Lo usamos como idTratamiento en Caja para mantener alineados los IDs.
      //
      // Si no quieres alinear IDs, puedes poner NULL en la primera columna
      // y dejar que Caja autogenere sus propios idTratamiento.
      const [result] = await pool.query(
        `
        INSERT INTO tratamiento (
          idTratamiento,
          nombreTratamiento,
          descripcion,
          precioBase
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nombreTratamiento = VALUES(nombreTratamiento),
          descripcion       = VALUES(descripcion),
          precioBase        = VALUES(precioBase)
      `,
        [
          id_tratamiento || null,
          nombre,
          descripcion || null,
          precio_base || 0,
        ]
      );

      // En MySQL, con ON DUPLICATE KEY:
      // - 1 fila afectada → insert
      // - 2 filas afectadas → update
      if (result.affectedRows === 1) insertados += 1;
      else if (result.affectedRows === 2) actualizados += 1;
    }

    return res.json({
      mensaje: 'Sincronización de tratamientos desde SIGCD completada',
      total_recibidos: tratamientos.length,
      insertados,
      actualizados,
    });
  } catch (error) {
    console.error(
      '[CAJA] Error sincronizando tratamientos desde SIGCD:',
      error
    );
    return res
      .status(500)
      .json({ error: 'Error al sincronizar tratamientos desde SIGCD' });
  }
}