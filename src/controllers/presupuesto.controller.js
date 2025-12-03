// src/controllers/presupuesto.controller.js
import fetch from "node-fetch";
import { db } from "../db/db.js";

const ATENCION_API_URL = (
  process.env.ATENCION_API_URL ||
  "http://apiatencionclinica.rtakabinetsolutions.com/api/atencion"
).replace(/\/$/, "");

export const crearPresupuesto = async (req, res) => {
  try {
    const solicitud = req.body;
    console.log("[GCAJA] 📥 Solicitud recibida:", solicitud);

    if (
      !solicitud ||
      !Array.isArray(solicitud.tratamientos) ||
      solicitud.tratamientos.length === 0
    ) {
      return res.status(400).json({
        error: "Solicitud inválida. Debe incluir al menos un tratamiento.",
      });
    }

    if (!solicitud.idPaciente) {
      return res.status(400).json({ error: "Falta idPaciente." });
    }

    // 🔍 Verificar paciente en minúsculas
    const [pacienteRows] = await db.query(
      "SELECT * FROM paciente WHERE idPaciente = ?",
      [solicitud.idPaciente]
    );

    if (pacienteRows.length === 0) {
      return res.status(400).json({
        error: "Paciente no encontrado en Caja.",
      });
    }

    // Crear registro de presupuesto
    const fechaEmision = new Date();
    const fechaVigencia = new Date();
    fechaVigencia.setMonth(fechaVigencia.getMonth() + 1);
    const estadoPresupuesto = "Pendiente";

    const [presResult] = await db.query(
      `INSERT INTO presupuesto (idPaciente, fechaEmision, fechaVigencia, total, estadoPresupuesto)
       VALUES (?, ?, ?, 0, ?)`,
      [solicitud.idPaciente, fechaEmision, fechaVigencia, estadoPresupuesto]
    );

    const idPresupuesto = presResult.insertId;
    console.log("[GCAJA] 🧾 Presupuesto creado con ID:", idPresupuesto);

    // Insertar detalles
    let total = 0;
    const detallesRespuesta = [];

    for (const item of solicitud.tratamientos) {
      const idTratamiento = item.idTratamiento;
      const cantidad = Number(item.cantidad || 1);

      if (!idTratamiento || cantidad <= 0) continue;

      // Tratamiento en minúsculas
      const [tratRows] = await db.query(
        "SELECT * FROM tratamiento WHERE idTratamiento = ?",
        [idTratamiento]
      );

      if (tratRows.length === 0) continue;

      const tratamiento = tratRows[0];
      const precioUnitario = Number(tratamiento.precioBase || 0);
      const precioTotal = precioUnitario * cantidad;

      await db.query(
        `INSERT INTO detalle_presupuesto
         (idPresupuesto, idTratamiento, cantidad, precioUnitario, precioTotal)
         VALUES (?, ?, ?, ?, ?)`,
        [idPresupuesto, idTratamiento, cantidad, precioUnitario, precioTotal]
      );

      total += precioTotal;

      detallesRespuesta.push({
        idTratamiento,
        cantidad,
        precioUnitario,
        precioTotal,
      });
    }

    // Actualizar total
    await db.query(
      "UPDATE presupuesto SET total = ? WHERE idPresupuesto = ?",
      [total, idPresupuesto]
    );

    console.log("[GCAJA] 💰 Total del presupuesto:", total);

    // Enviar resumen a Atención Clínica sin detener si falla
    const payloadAtencion = {
      idPresupuesto,
      idPaciente: solicitud.idPaciente,
      fechaEmision,
      fechaVigencia,
      total,
      detalles: detallesRespuesta,
    };

    try {
      const urlAtencion = `${ATENCION_API_URL}/presupuestos`;
      console.log("[GCAJA] 🔗 Enviando a ATNC:", urlAtencion);

      await fetch(urlAtencion, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadAtencion),
      });
    } catch (err) {
      console.error("[GCAJA] ⚠️ Error enviando a ATNC:", err);
    }

    return res.status(201).json({
      idPresupuesto,
      idPaciente: solicitud.idPaciente,
      fechaEmision,
      fechaVigencia,
      total,
      detalles: detallesRespuesta,
    });
  } catch (error) {
    console.error("[GCAJA] ❌ Error en crearPresupuesto:", error);
    return res.status(500).json({
      error: "Error interno al crear el presupuesto",
    });
  }
};

export const obtenerPresupuestoPorId = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "ID inválido." });
    }

    // Presupuesto en minúsculas
    const [presRows] = await db.query(
      "SELECT * FROM presupuesto WHERE idPresupuesto = ?",
      [id]
    );

    if (presRows.length === 0) {
      return res.status(404).json({ error: "Presupuesto no encontrado." });
    }

    const presupuesto = presRows[0];

    // Detalles también en minúsculas
    const [detRows] = await db.query(
      `SELECT d.idTratamiento,
              t.nombreTratamiento,
              d.cantidad,
              d.precioUnitario,
              d.precioTotal
       FROM detalle_presupuesto d
       JOIN tratamiento t ON d.idTratamiento = t.idTratamiento
       WHERE d.idPresupuesto = ?`,
      [id]
    );

    const filasMatriz = detRows.map((d) => ({
      id_presup: presupuesto.idPresupuesto,
      id_paciente: presupuesto.idPaciente,
      cve_trat: d.idTratamiento,
      cant: d.cantidad,
      precio_unit: d.precioUnitario,
      precio_total: d.precioTotal,
      fecha: presupuesto.fechaEmision,
    }));

    return res.json({
      idPresupuesto: presupuesto.idPresupuesto,
      idPaciente: presupuesto.idPaciente,
      fechaEmision: presupuesto.fechaEmision,
      fechaVigencia: presupuesto.fechaVigencia,
      total: presupuesto.total,
      estadoPresupuesto: presupuesto.estadoPresupuesto,
      detalles: detRows,
      presupuesto_matriz: filasMatriz,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};
