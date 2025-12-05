// src/controllers/paciente.controller.js
import { pool } from "../config/db.js";


/**
 * NOTA ARQUITECTURA:
 * En el diseño final, los pacientes vendrán del microservicio de Gestión de Citas.
 * Estos endpoints se dejan para:
 *  - pruebas del microservicio de Caja
 *  - poder poblar la tabla `paciente` manualmente si hace falta
 */

export const obtenerPacientes = async (req, res) => {
  try {
    const [pacientes] = await pool.query(
      "SELECT * FROM paciente ORDER BY idPaciente DESC"
    );
    res.json(pacientes);
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const registrarPaciente = async (req, res) => {
  try {
    console.log("BODY RECIBIDO PACIENTE:", req.body);
    const { nombre, apellido, fecha_nac, direccion, correo } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El campo 'nombre' es obligatorio." });
    }

    // Detectar columnas existentes en la tabla `paciente`
    const [colRows] = await pool.query("SHOW COLUMNS FROM paciente");
    const existingCols = colRows.map((c) => c.Field);

    const insertCols = [];
    const insertVals = [];

    if (existingCols.includes("nombre")) {
      insertCols.push("nombre");
      insertVals.push(nombre);
    }
    if (existingCols.includes("apellido") && apellido) {
      insertCols.push("apellido");
      insertVals.push(apellido);
    }
    if (existingCols.includes("fecha_nac") && fecha_nac) {
      insertCols.push("fecha_nac");
      insertVals.push(fecha_nac);
    }
    if (existingCols.includes("direccion") && direccion) {
      insertCols.push("direccion");
      insertVals.push(direccion);
    }
    if (existingCols.includes("correo") && correo) {
      insertCols.push("correo");
      insertVals.push(correo);
    }
    if (existingCols.includes("fechaRegistro")) {
      insertCols.push("fechaRegistro");
      insertVals.push(new Date());
    }

    if (insertCols.length === 0) {
      return res.status(500).json({ error: "Esquema de tabla paciente incompatible." });
    }

    const placeholders = insertCols.map(() => "?").join(", ");
    const sql = `INSERT INTO paciente (${insertCols.join(", ")}) VALUES (${placeholders})`;

    await pool.query(sql, insertVals);

    return res.json({ mensaje: "Paciente registrado correctamente ✔" });
  } catch (error) {
    console.error("Error registrando paciente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const actualizarPaciente = async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, apellido, fecha_nac, direccion, correo } = req.body;

    await pool.query(
      `UPDATE paciente
       SET nombre = ?, apellido = ?, fecha_nac = ?, direccion = ?, correo = ?
       WHERE idPaciente = ?`,
      [nombre, apellido, fecha_nac, direccion, correo, id]
    );

    res.json({ mensaje: "Paciente actualizado correctamente ✔" });
  } catch (error) {
    console.error("Error actualizando paciente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const eliminarPaciente = async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query("DELETE FROM paciente WHERE idPaciente = ?", [id]);

    res.json({ mensaje: "Paciente eliminado correctamente ❌" });
  } catch (error) {
    console.error("Error eliminando paciente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
