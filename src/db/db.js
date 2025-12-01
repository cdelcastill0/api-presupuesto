// src/db/db.js
import mysql from "mysql2/promise";

// Pool de conexiones a MySQL para el microservicio de Caja/Presupuestos
export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "mysqlcamila",
  database: process.env.DB_NAME || "clinica",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Testear conexión al inicio para mostrar un error claro si faltan credenciales
(async function testConnection() {
  try {
    const conn = await db.getConnection();
    await conn.ping();
    conn.release();
    console.log("[DB] Conexión a MySQL OK");
  } catch (err) {
    console.error("[DB] Error al conectar a MySQL:", err.code || err.message);
    if (!process.env.DB_PASSWORD) {
      console.error(
        "[DB] Parece que falta la variable de entorno DB_PASSWORD. Añade tu contraseña en .env (DB_USER, DB_PASSWORD, DB_HOST, DB_NAME)"
      );
    }
    // Salir con código 1 para evitar que el servidor corra en un estado inconsistente
    process.exit(1);
  }
})();
