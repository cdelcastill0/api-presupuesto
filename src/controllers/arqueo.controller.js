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

        const fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const horaActual = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

        // Consultar pagos del día actual agrupados por método de pago
        const query = `
            SELECT 
                metodoPago,
                COUNT(*) as cantidad,
                SUM(monto) as total
            FROM pago
            WHERE DATE(fechaPago) = ?
            GROUP BY metodoPago
        `;

        const [resultados] = await pool.query(query, [fechaHoy]);

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
