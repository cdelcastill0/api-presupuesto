// src/controllers/presupuesto.controller.js
import fetch from "node-fetch";
import { pool } from "../config/db.js";


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

    // permitir que Atención mande también el nombre del paciente
    const nombrePacientePayload = (solicitud.nombrePaciente || "").trim();

    // Verificar si existe el paciente en la BD de Caja
    const [pacienteRows] = await pool.query(
      "SELECT * FROM paciente WHERE idPaciente = ?",
      [solicitud.idPaciente]
    );

    // Usaremos este id local para el presupuesto (si creamos paciente nuevo, lo actualizamos)
    let idPaciente = Number(solicitud.idPaciente);
    let nombrePacienteFinal = null;

    if (pacienteRows.length === 0) {
      if (nombrePacientePayload) {
        // Crear un paciente mínimo usando el nombre recibido
        try {
          const parts = String(nombrePacientePayload).trim().split(/\s+/);
          const nombre = parts.shift() || nombrePacientePayload;
          const apellido = parts.join(" ") || "";
          const fechaRegistro = new Date();

          // Detectar columnas existentes en la tabla `paciente` para insertar sólo las que haya
          const [colRows] = await pool.query("SHOW COLUMNS FROM paciente");
          const existingCols = colRows.map((c) => c.Field);

          const insertCols = [];
          const insertVals = [];

          if (existingCols.includes("nombre")) {
            insertCols.push("nombre");
            insertVals.push(nombre);
          }
          if (existingCols.includes("apellido")) {
            insertCols.push("apellido");
            insertVals.push(apellido);
          }
          if (existingCols.includes("fechaRegistro")) {
            insertCols.push("fechaRegistro");
            insertVals.push(fechaRegistro);
          }

          // Fallback mínimo: si sólo existe `nombre`, insertCols contendrá sólo ese campo
          if (insertCols.length === 0) {
            console.error(
              "[GCAJA] ❌ La tabla paciente no tiene columnas esperadas para insertar."
            );
            return res
              .status(500)
              .json({ error: "Esquema de tabla paciente incompatible." });
          }

          const placeholders = insertCols.map(() => "?").join(", ");
          const sql = `INSERT INTO paciente (${insertCols.join(", ")}) VALUES (${placeholders})`;

          const [insertRes] = await pool.query(sql, insertVals);

          idPaciente = insertRes.insertId;
          nombrePacienteFinal = [
            existingCols.includes("nombre") ? nombre : null,
            existingCols.includes("apellido") ? apellido : null,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

          console.log(
            "[GCAJA] ➕ Paciente creado automáticamente desde ATNC con ID:",
            idPaciente
          );
        } catch (err) {
          console.error("[GCAJA] ❌ Error creando paciente desde ATNC:", err);
          return res
            .status(500)
            .json({ error: "No se pudo crear paciente automáticamente." });
        }
      } else {
        return res.status(400).json({ error: "Paciente no encontrado en Caja." });
      }
    } else {
      const p = pacienteRows[0];
      nombrePacienteFinal = `${p.nombre || ""} ${p.apellido || ""}`.trim();
      idPaciente = p.idPaciente;
    }

    // Crear registro de presupuesto
    const fechaEmision = new Date();
    const fechaVigencia = new Date();
    fechaVigencia.setMonth(fechaVigencia.getMonth() + 1);
    const estadoPresupuesto = "Pendiente";

    const [presResult] = await pool.query(
      `INSERT INTO presupuesto (idPaciente, fechaEmision, fechaVigencia, total, estadoPresupuesto)
       VALUES (?, ?, ?, 0, ?)`,
      [idPaciente, fechaEmision, fechaVigencia, estadoPresupuesto]
    );

    const idPresupuesto = presResult.insertId;
    console.log("[GCAJA] 🧾 Presupuesto creado con ID:", idPresupuesto);

    // Insertar detalles y calcular total
    let total = 0;
    const detallesRespuesta = [];

    for (const item of solicitud.tratamientos) {
      const idTratamiento = item.idTratamiento;
      const cantidad = Number(item.cantidad || 1);

      if (!idTratamiento || cantidad <= 0) continue;

      const [tratRows] = await pool.query(
        "SELECT * FROM tratamiento WHERE idTratamiento = ?",
        [idTratamiento]
      );

      if (tratRows.length === 0) continue;

      const tratamiento = tratRows[0];
      const precioUnitario = Number(tratamiento.precioBase || 0);
      const precioTotal = precioUnitario * cantidad;

      await pool.query(
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
    await pool.query("UPDATE presupuesto SET total = ? WHERE idPresupuesto = ?", [
      total,
      idPresupuesto,
    ]);

    console.log("[GCAJA] 💰 Total del presupuesto:", total);

    // Preparar payload para enviar a Atención Clínica (incluimos nombre si lo tenemos)
    const payloadAtencion = {
      idPresupuesto,
      idPaciente,
      nombrePaciente: nombrePacienteFinal,
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
      idPaciente,
      nombrePaciente: nombrePacienteFinal,
      fechaEmision,
      fechaVigencia,
      total,
      detalles: detallesRespuesta,
    });
  } catch (error) {
    console.error("[GCAJA] ❌ Error en crearPresupuesto:", error);
    return res.status(500).json({ error: "Error interno al crear el presupuesto" });
  }
};

export const obtenerPresupuestoPorId = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "ID de presupuesto inválido." });
    }

    const [presRows] = await pool.query(
      "SELECT * FROM presupuesto WHERE idPresupuesto = ?",
      [id]
    );

    if (presRows.length === 0) {
      return res.status(404).json({ error: "Presupuesto no encontrado." });
    }

    const presupuesto = presRows[0];

    const [detRows] = await pool.query(
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

export const obtenerPresupuestos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        p.idPresupuesto, 
        p.idPaciente, 
        p.fechaEmision, 
        p.fechaVigencia, 
        p.total, 
        p.estadoPresupuesto,
        CONCAT(pa.nombre, ' ', COALESCE(pa.apellido, '')) as nombrePaciente
       FROM presupuesto p
       LEFT JOIN paciente pa ON p.idPaciente = pa.idPaciente
       ORDER BY p.fechaEmision DESC
       LIMIT 200`
    );

    return res.json({ presupuestos: rows });
  } catch (error) {
    console.error("Error obteniendo presupuestos:", error);
    return res.status(500).json({ error: "Error interno al listar presupuestos" });
  }
};
