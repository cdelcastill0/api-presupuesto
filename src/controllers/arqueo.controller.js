import { pool } from '../config/db.js';

// Generar arqueo del día actual
export const generarArqueo = async (req, res) => {
    try {
        const { usuarioRegistro, observaciones } = req.body;

        if (!usuarioRegistro || usuarioRegistro.trim() === '') {
            return res.status(400).json({ 
                message: 'El campo "Responsable" es obligatorio' 
            });
        }

        // Obtener fecha y hora en zona horaria de México (UTC-6)
        const ahora = new Date();
        const opciones = { timeZone: 'America/Mexico_City' };
        const fechaHoy = ahora.toLocaleDateString('en-CA', opciones); // YYYY-MM-DD
        const horaActual = ahora.toLocaleTimeString('en-GB', { ...opciones, hour12: false }); // HH:MM:SS

        // Buscar el último arqueo guardado del día
        const [ultimosArqueos] = await pool.query(
            `SELECT DATE_FORMAT(fecha, '%Y-%m-%d') as fecha, 
                    horaGeneracion, 
                    createdAt 
             FROM arqueo 
             WHERE fecha = ? 
             ORDER BY createdAt DESC 
             LIMIT 1`,
            [fechaHoy]
        );

        let fechaDesde;
        if (ultimosArqueos.length > 0) {
            // Si hay un arqueo previo hoy, contar desde ese momento
            const ultimoArqueo = ultimosArqueos[0];
            fechaDesde = `${ultimoArqueo.fecha} ${ultimoArqueo.horaGeneracion}`;
        } else {
            // Si no hay arqueo previo, contar desde el inicio del día
            fechaDesde = `${fechaHoy} 00:00:00`;
        }

        // Consultar pagos desde el último arqueo hasta ahora
        // Convertir fechaPago a zona horaria de México antes de comparar
        const query = `
            SELECT 
                metodoPago,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM pago
            WHERE CONVERT_TZ(fechaPago, '+00:00', '-06:00') > ?
              AND DATE(CONVERT_TZ(fechaPago, '+00:00', '-06:00')) = ?
            GROUP BY metodoPago
        `;

        const [resultados] = await pool.query(query, [fechaDesde, fechaHoy]);

        // Inicializar totales
        let totalEfectivo = 0;
        let totalTarjeta = 0;
        let totalTransferencia = 0;
        let cantidadPagos = 0;

        // Procesar resultados
        resultados.forEach(row => {
            cantidadPagos += row.cantidad;
            
            const metodo = row.metodoPago.toUpperCase();
            
            if (metodo === 'EFECTIVO') {
                totalEfectivo = parseFloat(row.total || 0);
            } else if (metodo === 'TARJETA') {
                totalTarjeta = parseFloat(row.total || 0);
            } else if (metodo === 'TRANSFERENCIA') {
                totalTransferencia = parseFloat(row.total || 0);
            }
        });

        const totalGeneral = totalEfectivo + totalTarjeta + totalTransferencia;

        // Retornar datos calculados (sin guardar aún)
        res.json({
            fecha: fechaHoy,
            horaGeneracion: horaActual,
            totalEfectivo,
            totalTarjeta,
            totalTransferencia,
            totalGeneral,
            cantidadPagos,
            desglose: resultados
        });

    } catch (error) {
        console.error('Error al generar arqueo:', error);
        res.status(500).json({ 
            message: 'Error al generar el arqueo',
            error: error.message 
        });
    }
};

// Guardar arqueo en la base de datos
export const guardarArqueo = async (req, res) => {
    try {
        const {
            fecha,
            horaGeneracion,
            totalEfectivo,
            totalTarjeta,
            totalTransferencia,
            totalGeneral,
            cantidadPagos,
            usuarioRegistro,
            observaciones
        } = req.body;

        // Validaciones
        if (!usuarioRegistro || usuarioRegistro.trim() === '') {
            return res.status(400).json({ 
                message: 'El campo "Responsable" es obligatorio' 
            });
        }

        if (!fecha || !totalGeneral) {
            return res.status(400).json({ 
                message: 'Datos incompletos para guardar el arqueo' 
            });
        }

        const query = `
            INSERT INTO arqueo (
                fecha, 
                horaGeneracion, 
                totalEfectivo, 
                totalTarjeta, 
                totalTransferencia, 
                totalGeneral, 
                cantidadPagos, 
                usuarioRegistro, 
                observaciones
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            fecha,
            horaGeneracion,
            totalEfectivo || 0,
            totalTarjeta || 0,
            totalTransferencia || 0,
            totalGeneral,
            cantidadPagos || 0,
            usuarioRegistro.trim(),
            observaciones || null
        ]);

        res.status(201).json({
            message: 'Arqueo guardado exitosamente',
            idArqueo: result.insertId
        });

    } catch (error) {
        console.error('Error al guardar arqueo:', error);
        res.status(500).json({ 
            message: 'Error al guardar el arqueo',
            error: error.message 
        });
    }
};

// Obtener todos los arqueos
export const obtenerArqueos = async (req, res) => {
    try {
        const query = `
            SELECT * FROM arqueo 
            ORDER BY fecha DESC, horaGeneracion DESC
        `;
        
        const [arqueos] = await pool.query(query);
        
        res.json({ arqueos });

    } catch (error) {
        console.error('Error al obtener arqueos:', error);
        res.status(500).json({ 
            message: 'Error al obtener los arqueos',
            error: error.message 
        });
    }
};

// Obtener arqueo por ID
export const obtenerArqueoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'SELECT * FROM arqueo WHERE idArqueo = ?';
        const [arqueos] = await pool.query(query, [id]);

        if (arqueos.length === 0) {
            return res.status(404).json({ 
                message: 'Arqueo no encontrado' 
            });
        }

        res.json(arqueos[0]);

    } catch (error) {
        console.error('Error al obtener arqueo:', error);
        res.status(500).json({ 
            message: 'Error al obtener el arqueo',
            error: error.message 
        });
    }
};
