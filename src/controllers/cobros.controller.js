// src/controllers/cobros.controller.js
import { pool } from '../config/db.js';
import {
  obtenerCitasPendientesDesdeSIGCD,
  registrarPagoEnSIGCD,
} from '../services/sigcd.service.js';
import { crearPago, getPagoById, getPagosByPaciente } from '../services/caja.service.js';
import PDFDocument from 'pdfkit';


// GET /api/cobros/citas-pendientes
export async function listarCitasPendientes(req, res) {
  try {
    const citas = await obtenerCitasPendientesDesdeSIGCD();
    return res.json(citas);
  } catch (error) {
    console.error('[Caja] Error consultando citas en SIGCD:', error.message);
    return res
      .status(502)
      .json({ error: 'No se pudieron obtener las citas desde SIGCD' });
  }
}

// POST /api/cobros
export async function crearCobro(req, res) {
  try {
    const { idCita, idPaciente, monto, metodoPago, idPresupuesto = null } = req.body || {};

    const idPacienteNum = parseInt(idPaciente, 10);
    const montoNum = Number(monto);
    const idCitaNum = idCita ? parseInt(idCita, 10) : null;

    // Validar campos obligatorios (idCita es opcional)
    if (
      Number.isNaN(idPacienteNum) ||
      Number.isNaN(montoNum) ||
      montoNum <= 0 ||
      !metodoPago
    ) {
      return res.status(400).json({
        error:
          'idPaciente, monto (>0) y metodoPago son obligatorios y válidos',
      });
    }

    // 1) Guardar el cobro en MySQL (Caja) usando el servicio centralizado `crearPago`
    const pago = await crearPago({
      idPaciente: idPacienteNum,
      monto: montoNum,
      metodoPago,
      idPresupuesto: idPresupuesto ? Number(idPresupuesto) : null,
    });

    const idCobro = pago.idPago; // La tabla se llama pago y la PK es idPago

    // 2) Intentar informar a SIGCD del pago (solo si hay idCita)
    if (idCitaNum && !Number.isNaN(idCitaNum)) {
      try {
        await registrarPagoEnSIGCD({
          idCita: idCitaNum,
          idPaciente: idPacienteNum,
          monto: montoNum,
          metodoPago,
          idCobroCaja: idCobro,
        });
      } catch (syncError) {
        console.error(
          '[Caja] Cobro creado, pero falló actualizar SIGCD:',
          syncError.message
        );
        // Aquí podrías marcar algo en BD si quieres manejar "pendiente de sincronizar"
      }
    }

    return res.status(201).json({
      mensaje: 'Cobro registrado correctamente',
      idCobro,
    });
  } catch (error) {
    console.error('[Caja] Error creando cobro:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function obtenerCobroPorId(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const pago = await getPagoById(id);
    if (!pago) return res.status(404).json({ error: 'Cobro no encontrado' });

    return res.json({ pago });
  } catch (error) {
    console.error('[Caja] Error obteniendo cobro:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarPagos(req, res) {
  try {
    const pacienteId = Number(req.query.pacienteId || req.query.idPaciente || req.query.id);
    if (!pacienteId) return res.status(400).json({ error: 'Falta idPaciente en query' });

    const pagos = await getPagosByPaciente(pacienteId);
    return res.json({ pagos });
  } catch (error) {
    console.error('[Caja] Error listando pagos:', error);
    return res.status(500).json({ error: 'Error interno listando pagos' });
  }
}

export async function obtenerComprobantePdf(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    // Traer pago + paciente directamente (ahora pago tiene idPaciente)
    const [rowsPago] = await pool.query(
      `
      SELECT 
        p.idPago,
        p.fechaPago,
        p.monto,
        p.metodoPago,
        p.referencia,
        p.idPresupuesto,
        p.idPaciente,
        pa.nombre,
        pa.apellido
      FROM pago p
      LEFT JOIN paciente pa ON p.idPaciente = pa.idPaciente
      WHERE p.idPago = ?
      `,
      [id]
    );

    const pago = rowsPago[0];
    if (!pago) return res.status(404).json({ error: 'Cobro no encontrado' });

    const fechaPago = pago.fechaPago ? new Date(pago.fechaPago) : new Date();
    const nombrePaciente = `${pago.nombre || ''} ${pago.apellido || ''}`.trim();
    const formatoFecha = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fechaPago);

    // Generar PDF en memoria y enviarlo
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="comprobante_${id}.pdf"`
    );

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(18).text('Clínica - Comprobante de Pago', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`ID Cobro: ${id}`);
    doc.text(`Fecha: ${formatoFecha}`);
    doc.text(`Método: ${pago.metodoPago || pago.metodo_pago || 'N/A'}`);
    doc.moveDown();

    doc.text(`Paciente: ${nombrePaciente || 'N/D'}`);
    doc.text(`ID Paciente: ${pago.idPaciente || 'N/D'}`);
    doc.text(`Presupuesto: ${pago.idPresupuesto || 'N/D'}`);
    doc.moveDown();

    doc.fontSize(14).text(`Monto pagado: $ ${Number(pago.monto || 0).toFixed(2)}`);
    if (pago.referencia) {
      doc.fontSize(12).text(`Referencia: ${pago.referencia}`);
    }
    doc.moveDown();

    // Pie
    doc.fontSize(10).text('Gracias por su pago.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('[Caja] Error generando comprobante PDF:', error);
    return res.status(500).json({ error: 'Error generando comprobante' });
  }
}

