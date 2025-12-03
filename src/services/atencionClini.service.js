// src/services/atencionClini.service.js
import fetch from "node-fetch";

// Base del otro servicio (Atención Clínica)
const ATENCION_CLINI_BASE_URL =
  process.env.ATENCION_CLINI_BASE_URL ||   "htpp://apiatencionclinica.rtakabinetsolutions.com";

function buildUrl(path) {
  return `${ATENCION_CLINI_BASE_URL.replace(/\/$/, "")}${path}`;
}

/**
 * Envía al microservicio de Atención Clínica el resultado del servicio 7: PRESUPUESTO.
 *
 * payloadMatriz: array de objetos con la forma:
 * {
 *   id_presup,
 *   id_paciente,
 *   cve_trat,
 *   cant,
 *   precio_unit,
 *   precio_total,
 *   fecha
 * }
 */
export async function enviarPresupuestoAAtencionClini(payloadMatriz) {
  const url = buildUrl("/api/presupuesto"); // aquí Atención Clínica debe exponer su endpoint

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadMatriz),
    });

    const textBody = await response.text().catch(() => "");

    if (!response.ok) {
      console.error(
        `[AtencionClini] Error ${response.status} al enviar PRESUPUESTO: ${textBody}`
      );
      return {
        ok: false,
        status: response.status,
        body: textBody || null,
      };
    }

    let data = null;
    try {
      data = textBody ? JSON.parse(textBody) : null;
    } catch {
      data = textBody || null;
    }

    console.log("[AtencionClini] PRESUPUESTO enviado correctamente ✔");
    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error(
      "[AtencionClini] Error de red al conectar con el servicio de Atención Clínica:",
      error
    );
    return { ok: false, error: error.message };
  }
}
