// src/services/caja.service.js
import { pool } from "../config/db.js";


export async function getPagosByPaciente(idPaciente) {
  // La tabla en BD es `pago` y no guarda idPaciente; se relaciona vía presupuesto.
  const sql = `
    SELECT p.*
    FROM pago p
    JOIN presupuesto pr ON p.idPresupuesto = pr.idPresupuesto
    WHERE pr.idPaciente = ?
    ORDER BY p.fechaPago DESC
  `;
  const [rows] = await pool.query(sql, [idPaciente]);
  return rows;
}

export async function getTotalPagado(idPaciente) {
  const sql = `
    SELECT IFNULL(SUM(p.monto), 0) AS totalPagado
    FROM pago p
    JOIN presupuesto pr ON p.idPresupuesto = pr.idPresupuesto
    WHERE pr.idPaciente = ?
  `;
  const [rows] = await pool.query(sql, [idPaciente]);
  return rows[0].totalPagado;
}

export async function getTotalPresupuestos(idPaciente) {
  const sql = `SELECT IFNULL(SUM(total), 0) AS totalPresupuestos 
               FROM presupuestos WHERE idPaciente = ?`;
  const [rows] = await pool.query(sql, [idPaciente]);
  return rows[0].totalPresupuestos;
}

export async function getTotalTratamientosAplicados(idPaciente) {
  const sql = `
      SELECT IFNULL(SUM(ta.precio), 0) AS totalTratamientos
      FROM tratamientos_aplicados ta
      WHERE ta.idPaciente = ?
  `;
  const [rows] = await pool.query(sql, [idPaciente]);
  return rows[0].totalTratamientos;
}

export async function getSaldoPendiente(idPaciente) {
  const totalPagado = await getTotalPagado(idPaciente);
  const totalPresupuestos = await getTotalPresupuestos(idPaciente);
  const totalTratamientos = await getTotalTratamientosAplicados(idPaciente);

  const saldo = Number(totalPresupuestos) + Number(totalTratamientos) - Number(totalPagado);

  return {
    saldoPendiente: saldo,
    totalPagado,
    totalPresupuestos,
    totalTratamientos,
  };
}

export async function crearPago({ idPaciente, monto, metodoPago, idPresupuesto = null }) {
  const sql = `
      INSERT INTO pago (idPresupuesto, fechaPago, monto, metodoPago, referencia)
      VALUES (?, NOW(), ?, ?, NULL)
  `;
  const [result] = await pool.query(sql, [
    idPresupuesto,
    monto,
    metodoPago,
  ]);

  const [rows] = await pool.query(
    `SELECT * FROM pago WHERE idPago = ?`,
    [result.insertId]
  );

  return rows[0];
}

export async function getPagoById(idPago) {
  const sql = `SELECT * FROM pago WHERE idPago = ?`;
  const [rows] = await pool.query(sql, [idPago]);
  return rows[0] || null;
}
