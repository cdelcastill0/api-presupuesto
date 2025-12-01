// src/controllers/presupuesto.controller.js
import fetch from "node-fetch";
import { db } from "../db/db.js";

// URL base de Atención Clínica (se configura en .env)
const ATENCION_API_URL = (
  process.env.ATENCION_API_URL ||
  "http://192.168.25.188:3000/api/atencion"
).replace(/\/$/, "");

export const crearPresupuesto = async (req, res) => {
  try {
    const solicitud = req.body;

    console.log("[GCAJA] 📥 Solicitud recibida en crearPresupuesto:", solicitud);

    // 1) Validar estructura básica
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
      return res.status(400).json({
        error: "Falta idPaciente en la solicitud.",
      });
    }

    // 2) Verificar que el paciente exista en la BD de Caja
    const [pacienteRows] = await db.query(
      "SELECT * FROM paciente WHERE idPaciente = ?",
      [solicitud.idPaciente]
    );

    if (pacienteRows.length === 0) {
      return res.status(400).json({ error: "Paciente no encontrado en Caja." });
    }

    // 3) Crear el registro de PRESUPUESTO con total = 0 inicialmente
    const fechaEmision = new Date();
    const fechaVigencia = new Date();
    fechaVigencia.setMonth(fechaVigencia.getMonth() + 1);

    const estadoPresupuesto = "Pendiente";

    const [presResult] = await db.query(
      `INSERT INTO PRESUPUESTO (idPaciente, fechaEmision, fechaVigencia, total, estadoPresupuesto)
       VALUES (?, ?, ?, 0, ?)`,
      [solicitud.idPaciente, fechaEmision, fechaVigencia, estadoPresupuesto]
    );

    const idPresupuesto = presResult.insertId;
    console.log("[GCAJA] 🧾 Presupuesto creado con ID:", idPresupuesto);

    // 4) Insertar DETALLE_PRESUPUESTO y calcular total
    let total = 0;
    const detallesRespuesta = [];

    for (const item of solicitud.tratamientos) {
      const idTratamiento = item.idTratamiento;
      const cantidad = Number(item.cantidad || 1);

      if (!idTratamiento || cantidad <= 0) {
        console.warn("[GCAJA] ⚠️ Item de tratamiento inválido, se omite:", item);
        continue;
      }

      // Obtener tratamiento desde la BD de Caja
      const [tratRows] = await db.query(
        "SELECT * FROM TRATAMIENTO WHERE idTratamiento = ?",
        [idTratamiento]
      );

      if (tratRows.length === 0) {
        console.warn(
          "[GCAJA] ⚠️ Tratamiento no encontrado en Caja, se omite:",
          idTratamiento
        );
        continue;
      }

      const tratamiento = tratRows[0];
      const precioUnitario = Number(
        tratamiento.precioBase ?? tratamiento.precio ?? 0
      );
      const precioTotal = precioUnitario * cantidad;

      // Insertar detalle
      await db.query(
        `INSERT INTO DETALLE_PRESUPUESTO
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

    // 5) Actualizar total en PRESUPUESTO
    await db.query(
      "UPDATE PRESUPUESTO SET total = ? WHERE idPresupuesto = ?",
      [total, idPresupuesto]
    );

    console.log("[GCAJA] 💰 Total del presupuesto:", total);

    // 6) Construir payload para enviar a Atención Clínica
    const payloadAtencion = {
      idPresupuesto,
      idPaciente: solicitud.idPaciente,
      fechaEmision,
      fechaVigencia,
      total,
      detalles: detallesRespuesta,
    };

    // 7) Enviar a Atención Clínica (sin romper si falla)
    try {
      const urlAtencion = `${ATENCION_API_URL}/presupuestos`;
      console.log("[GCAJA] 🔗 Enviando resumen de presupuesto a ATNC:", urlAtencion);
      console.log("[GCAJA] 📦 Payload para ATNC:", payloadAtencion);

      const respAtnc = await fetch(urlAtencion, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadAtencion),
      });

      const bodyAtncText = await respAtnc.text();
      console.log(
        "[GCAJA] 🔁 Respuesta de ATNC:",
        respAtnc.status,
        bodyAtncText
      );
    } catch (err) {
      console.error(
        "[GCAJA] ⚠️ Error al enviar presupuesto a Atención Clínica (no se detiene la creación):",
        err
      );
    }

    // 8) Respuesta final al que llamó a Caja
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
    return res
      .status(500)
      .json({ error: "Error interno al crear el presupuesto" });
  }
};

/**
 * Endpoint auxiliar para poder consultar un presupuesto concreto
 * (útil para pruebas, documentación del servicio PRESUPUESTO, etc.)
 *
 * GET /api/presupuestos/:id
 */
export const obtenerPresupuestoPorId = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "ID de presupuesto inválido." });
    }

    const [presRows] = await db.query(
      "SELECT * FROM PRESUPUESTO WHERE idPresupuesto = ?",
      [id]
    );

    if (presRows.length === 0) {
      return res.status(404).json({ error: "Presupuesto no encontrado." });
    }

    const presupuesto = presRows[0];

    const [detRows] = await db.query(
      `SELECT d.idTratamiento,
              t.nombreTratamiento,
              d.cantidad,
              d.precioUnitario,
              d.precioTotal
       FROM DETALLE_PRESUPUESTO d
       JOIN TRATAMIENTO t ON d.idTratamiento = t.idTratamiento
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
    console.error("Error en obtenerPresupuestoPorId:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};
