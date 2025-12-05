// src/services/sigcd.service.js
import axios from 'axios';

// Por defecto apuntamos al backend de Gestión de Citas en Render; se puede sobrescribir con SIGCD_BASE_URL.
const sigcdBaseUrl = process.env.SIGCD_BASE_URL || 'https://gestion-citas-wmty.onrender.com';

const sigcdApi = axios.create({
  baseURL: sigcdBaseUrl,
  timeout: 8000, // Aumentar timeout a 8s
});

// Ya existe:
export async function obtenerCitasPendientesDesdeSIGCD() {
  const response = await sigcdApi.get('/citas/resumen', {
    params: { estado_pago: 'PENDIENTE' },
  });
  return response.data;
}

// NUEVO: obtener pacientes desde SIGCD
export async function obtenerPacientesDesdeSIGCD(page = 1, pageSize = 1000) {
  const response = await sigcdApi.get('/pacientes', {
    params: { page, pageSize },
  });

  // Ajusta esto según lo que devuelva tu API de SIGCD
  // por ejemplo: { total, page, pageSize, pacientes: [...] }
  return response.data;
}

// Ya existente:
export async function registrarPagoEnSIGCD({
  idCita,
  idPaciente,
  monto,
  metodoPago,
  idCobroCaja,
}) {
  await sigcdApi.post(`/citas/${idCita}/confirmar-pago`, {
    id_pago: idCobroCaja,
    monto_pagado: monto,
    metodo_pago: metodoPago,
    origen: 'CAJA',
    id_paciente: idPaciente,
  });
}
