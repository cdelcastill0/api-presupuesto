// Script para agregar columna idPaciente a la tabla pago
import { pool } from './src/config/db.js';

async function addColumn() {
  try {
    console.log('[MIGRACIÓN] Verificando si existe la columna idPaciente...');
    
    const [columns] = await pool.query("SHOW COLUMNS FROM pago LIKE 'idPaciente'");
    
    if (columns.length > 0) {
      console.log('[MIGRACIÓN] La columna idPaciente ya existe');
    } else {
      console.log('[MIGRACIÓN] Agregando columna idPaciente...');
      await pool.query('ALTER TABLE pago ADD COLUMN idPaciente INT AFTER idPago');
      console.log('[MIGRACIÓN] ✅ Columna idPaciente agregada');
      
      console.log('[MIGRACIÓN] Agregando índice...');
      await pool.query('ALTER TABLE pago ADD INDEX idx_idPaciente (idPaciente)');
      console.log('[MIGRACIÓN] ✅ Índice agregado');
      
      console.log('[MIGRACIÓN] Migrando datos existentes...');
      const [result] = await pool.query(`
        UPDATE pago p
        JOIN presupuesto pr ON p.idPresupuesto = pr.idPresupuesto
        SET p.idPaciente = pr.idPaciente
        WHERE p.idPaciente IS NULL AND p.idPresupuesto IS NOT NULL
      `);
      console.log(`[MIGRACIÓN] ✅ ${result.affectedRows} registros actualizados`);
    }

    const [newColumns] = await pool.query('DESCRIBE pago');
    console.log('\n[MIGRACIÓN] Estructura final:');
    newColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('[MIGRACIÓN] ❌ Error:', error.message);
    process.exit(1);
  }
}

addColumn();
