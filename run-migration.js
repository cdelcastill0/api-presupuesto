// Script para ejecutar la migración de base de datos
import { pool } from './src/config/db.js';
import fs from 'fs';

async function runMigration() {
  try {
    console.log('[MIGRACIÓN] Iniciando migración...');
    
    const sql = fs.readFileSync('./migration_add_idPaciente.sql', 'utf8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('[MIGRACIÓN] Ejecutando:', statement.substring(0, 50) + '...');
        const [result] = await pool.query(statement);
        if (Array.isArray(result) && result.length > 0) {
          console.log('[MIGRACIÓN] Resultado:', result);
        }
      }
    }

    console.log('[MIGRACIÓN] ✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('[MIGRACIÓN] ❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();
