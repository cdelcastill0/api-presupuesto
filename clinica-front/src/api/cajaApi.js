// src/api/cajaApi.js
const rawBase = import.meta.env.VITE_CAJA_API_URL || "https://api-presupuesto.onrender.com";

export const API_BASE_URL = rawBase.replace(/\/+$/, ""); // sin slash al final

async function handleResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    // puede venir sin body
  }

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.mensaje ||
      `Error HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data ?? {};
}

// === COBROS ===

// GET /api/cobros/citas-pendientes
export async function fetchCitasPendientes() {
  const res = await fetch(`${API_BASE_URL}/api/cobros/citas-pendientes`);
  return handleResponse(res);
}

// POST /api/cobros
export async function crearCobro(payload) {
  const res = await fetch(`${API_BASE_URL}/api/cobros`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// === SALDO ===
export async function fetchSaldo(idPaciente) {
  const res = await fetch(`${API_BASE_URL}/api/saldo/${idPaciente}`);
  return handleResponse(res);
}

// === PACIENTES ===
export async function fetchPacientes() {
  const res = await fetch(`${API_BASE_URL}/api/pacientes`);
  return handleResponse(res);
}

// === PAGOS ===
export async function fetchPagosByPaciente(idPaciente) {
  const res = await fetch(`${API_BASE_URL}/api/cobros/list?pacienteId=${idPaciente}`);
  return handleResponse(res);
}

// === PACIENTES ===

// POST /api/pacientes
export async function crearPaciente(payload) {
  const res = await fetch(`${API_BASE_URL}/api/pacientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// POST /api/pacientes/sync-desde-sigcd
export async function syncPacientesDesdeSIGCD() {
  const res = await fetch(
    `${API_BASE_URL}/api/pacientes/sync-desde-sigcd`,
    { method: "POST" }
  );
  return handleResponse(res);
}

// === PRESUPUESTOS ===
export async function fetchPresupuestos() {
  const res = await fetch(`${API_BASE_URL}/api/presupuestos`);
  return handleResponse(res);
}

// POST /api/presupuestos/crear
export async function crearPresupuesto(payload) {
  const res = await fetch(`${API_BASE_URL}/api/presupuestos/crear`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
