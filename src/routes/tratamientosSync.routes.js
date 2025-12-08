// src/routes/tratamientosSync.routes.js
import { Router } from 'express';
import { syncTratamientosDesdeSIGCD } from '../controllers/tratamientosSync.controller.js';
import { pool } from '../config/db.js';

const router = Router();

// GET /api/tratamientos - Listar todos los tratamientos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT idTratamiento, nombreTratamiento, descripcion, precioBase FROM tratamiento ORDER BY idTratamiento DESC'
    );
    return res.json({ tratamientos: rows });
  } catch (error) {
    console.error('[Tratamientos] Error listando:', error);
    return res.status(500).json({ error: 'Error al obtener tratamientos' });
  }
});

// POST /api/tratamientos - Crear nuevo tratamiento
router.post('/', async (req, res) => {
  try {
    const { nombreTratamiento, descripcion, precioBase } = req.body;

    if (!nombreTratamiento || !precioBase || Number(precioBase) <= 0) {
      return res.status(400).json({ 
        error: 'nombreTratamiento y precioBase son obligatorios' 
      });
    }

    const [result] = await pool.query(
      'INSERT INTO tratamiento (nombreTratamiento, descripcion, precioBase) VALUES (?, ?, ?)',
      [nombreTratamiento, descripcion || null, Number(precioBase)]
    );

    return res.status(201).json({
      mensaje: 'Tratamiento creado correctamente',
      idTratamiento: result.insertId,
    });
  } catch (error) {
    console.error('[Tratamientos] Error creando:', error);
    return res.status(500).json({ error: 'Error al crear tratamiento' });
  }
});

// POST /api/tratamientos/sync-desde-sigcd
router.post('/sync-desde-sigcd', syncTratamientosDesdeSIGCD);

export default router;