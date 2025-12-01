// src/controllers/paciente.controller.js
import { db } from "../db/db.js";

/**
 * NOTA ARQUITECTURA:
 * En el diseño final, los pacientes vendrán del microservicio de Gestión de Citas.
 * Estos endpoints se dejan para:
 *  - pruebas del microservicio de Caja
 *  - poder poblar la tabla `paciente` manualmente si hace falta
 */

export const obtenerPacientes = async (req, res) => {
  try {
    const [pacientes] = await db.query(
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

    if (!nombre || !apellido || !fecha_nac) {
      return res.status(400).json({
        error: "Faltan datos obligatorios (nombre, apellido, fecha_nac).",
      });
    }

    const fechaRegistro = new Date();

    await db.query(
      `INSERT INTO paciente (nombre, apellido, fecha_nac, direccion, correo, fechaRegistro)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, fecha_nac, direccion, correo, fechaRegistro]
    );

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

    await db.query(
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

    await db.query("DELETE FROM paciente WHERE idPaciente = ?", [id]);

    res.json({ mensaje: "Paciente eliminado correctamente ❌" });
  } catch (error) {
    console.error("Error eliminando paciente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
