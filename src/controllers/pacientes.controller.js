// src/controllers/pacientes.controller.js
import { pool } from '../config/db.js';
import { obtenerPacientesDesdeSIGCD } from '../services/sigcd.service.js';

/*
 GET /api/pacientes
 Obtiene todos los pacientes registrados en la BD de Caja
*/
export async function obtenerPacientes(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT idPaciente, nombre, apellido, fecha_nac, direccion, correo 
       FROM PACIENTE 
       ORDER BY idPaciente DESC`
    );

    return res.json({
      pacientes: rows,
      total: rows.length
    });
  } catch (error) {
    console.error('[Caja] Error obteniendo pacientes:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor al obtener pacientes' 
    });
  }
}

/*
 POST /api/pacientes
  Registra un paciente/cliente en la BD de Caja.
 
  Espera algo como:
  {
    "nombre": "Juan",
    "apellido": "Pérez",
    "fecha_nac": "1995-04-12",
    "direccion": "Calle 123",
    "correo": "juan@example.com"
  }
 */
export async function crearPaciente(req, res) {
  try {
    const { nombre, apellido, fecha_nac, direccion, correo } = req.body;

    if (!nombre || !apellido) {
      return res.status(400).json({
        error: 'nombre y apellido son obligatorios',
      });
    }

    // Inserta en la tabla de pacientes de Caja
    // Cambia "PACIENTE_CAJA" y las columnas si tu tabla se llama distinto.
    const [result] = await pool.query(
    `INSERT INTO paciente (nombre, apellido, fecha_nac, direccion, correo)
    VALUES (?, ?, ?, ?, ?)`,
    [nombre, apellido, fecha_nac || null, direccion || null, correo || null]
  );


  const idPaciente = result.insertId;

  return res.status(201).json({
    mensaje: 'Paciente registrado correctamente en Caja',
    idPaciente,
  });

  } catch (error) {
    console.error('[Caja] Error creando paciente:', error);
    return res
      .status(500)
      .json({ error: 'Error interno del servidor al crear paciente' });
  }
}

// NUEVO: sincronizar pacientes desde SIGCD hacia MySQL
export async function sincronizarPacientesDesdeSIGCD(req, res) {
  try {
    // 1. Pedir pacientes a SIGCD
    const { pacientes } = await obtenerPacientesDesdeSIGCD(1, 1000);

    if (!Array.isArray(pacientes)) {
      return res.status(500).json({
        error: 'La respuesta de SIGCD no contiene el arreglo "pacientes".',
      });
    }

    let insertados = 0;
    let actualizados = 0;

    for (const p of pacientes) {
      const id = p.id_paciente; // nombre según tu API de SIGCD
      const nombre = p.nombre || '';
      const apellido = p.apellidos || '';
      const fecha_nac = p.fecha_nacimiento
        ? p.fecha_nacimiento.substring(0, 10)
        : null;
      const correo = p.email || null;
      const direccion = null; // SIGCD no la maneja, lo dejas null

      const [result] = await pool.query(
        `
        INSERT INTO PACIENTE (
          idPaciente, nombre, apellido, fecha_nac, correo, direccion
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nombre    = VALUES(nombre),
          apellido  = VALUES(apellido),
          fecha_nac = VALUES(fecha_nac),
          correo    = VALUES(correo),
          direccion = VALUES(direccion);
        `,
        [id, nombre, apellido, fecha_nac, correo, direccion,]
      );

      // result.affectedRows: 1 insert, 2 insert+update, etc.
      if (result.affectedRows === 1) insertados += 1;
      else if (result.affectedRows === 2) actualizados += 1;
    }

    return res.json({
      mensaje: 'Sincronización completada',
      total_recibidos: pacientes.length,
      insertados,
      actualizados,
    });
  } catch (error) {
    console.error('[Caja] Error sincronizando pacientes desde SIGCD:', error);
    return res
      .status(500)
      .json({ error: 'Error al sincronizar pacientes desde SIGCD' });
  }
}
