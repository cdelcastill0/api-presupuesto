// Script para verificar la estructura de la tabla pago
import { pool } from './src/config/db.js';

async function checkTable() {
  try {
    console.log('[CHECK] Verificando estructura de tabla pago...');
    
    const [columns] = await pool.query('DESCRIBE pago');
    console.log('[CHECK] Columnas de la tabla pago:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });

    const [rows] = await pool.query('SELECT * FROM pago LIMIT 1');
    console.log('\n[CHECK] Ejemplo de registro:', rows[0] || 'No hay registros');

    process.exit(0);
  } catch (error) {
    console.error('[CHECK] Error:', error.message);
    process.exit(1);
  }
}

checkTable();
