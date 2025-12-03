// src/controllers/integracionAtencion.controller.js
import fetch from "node-fetch";
import { db as pool } from "../db/db.js";

// URL del servicio de Atención Clínica
const ATENCION_API_URL = (process.env.ATENCION_API_URL ||   "http://apiatencionclinica.rtakabinetsolutions.com"
).replace(
  /\/$/,
  ""
);
// Endpoint que expusimos en ATNC
const ATENCION_CATALOGO_ENDPOINT =
  process.env.ATENCION_CATALOGO_ENDPOINT ||
  "/api/atencion/integracion/caja/tratamientos";

/**
 * Envía el catálogo completo de tratamientos de Caja → Atención Clínica
 * POST local: /api/integracion/atencion/enviar-catalogo-tratamientos
 */
export async function enviarCatalogoTratamientosAAtencion(req, res) {
  console.log("[CAJA] 🔍 Preparando catálogo de tratamientos para enviar a ATNC...");

  try {
    // Leer catálogo local de Caja
    const [rows] = await pool.query(
      "SELECT cve_trat, nombre, descripcion, precio_base, activo FROM tratamientos ORDER BY cve_trat"
    );

    const payload = {
      origen: "caja",
      fecha_envio: new Date().toISOString(),
      tratamientos: rows.map((t) => ({
        cve_trat: t.cve_trat,
        nombre: t.nombre,
        descripcion: t.descripcion,
        precio_base: Number(t.precio_base),
        activo: t.activo ?? 1,
      })),
    };

    const url = `${ATENCION_API_URL}${ATENCION_CATALOGO_ENDPOINT}`;
    console.log("[CAJA] 🌐 Enviando catálogo a ATNC:", url);
    console.log("[CAJA] 📦 Total tratamientos:", payload.tratamientos.length);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    console.log(
      "[CAJA] 📡 Respuesta de ATNC - Status:",
      response.status,
      response.statusText
    );
    console.log("[CAJA] 📡 Body ATNC:", data);

    if (!response.ok) {
      return res.status(502).json({
        status: "ERROR",
        message: "Error al enviar catálogo a Atención Clínica",
        error: data?.error || response.statusText,
        detail: data,
      });
    }

    return res.status(200).json({
      status: "OK",
      message: "Catálogo enviado a Atención Clínica correctamente",
      detalle_atencion: data,
    });
  } catch (err) {
    console.error("[CAJA] ❌ Error enviarCatalogoTratamientosAAtencion:", err);
    return res.status(500).json({
      status: "ERROR",
      message: "Error al preparar/enviar el catálogo a Atención Clínica",
      error: err.message,
    });
  }
}
