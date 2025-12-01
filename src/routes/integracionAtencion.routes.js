// src/routes/integracionAtencion.routes.js
import { Router } from "express";
import { enviarCatalogoTratamientosAAtencion } from "../controllers/integracionAtencion.controller.js";

const router = Router();

/**
 * Endpoint local para disparar el envío del catálogo
 * Lo puedes llamar desde Postman:
 * POST http://localhost:3002/api/integracion/atencion/enviar-catalogo-tratamientos
 */
router.post(
  "/api/integracion/atencion/enviar-catalogo-tratamientos",
  enviarCatalogoTratamientosAAtencion
);

export default router;
