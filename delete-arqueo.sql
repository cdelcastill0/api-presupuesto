-- Script para limpiar la tabla arqueo
-- ADVERTENCIA: Esto borrará TODOS los registros de arqueo

-- Ver cuántos registros hay antes de borrar
SELECT COUNT(*) as total_registros FROM arqueo;

-- Descomentar la siguiente línea para ejecutar el borrado
-- DELETE FROM arqueo;

-- Reiniciar el auto-increment (opcional)
-- ALTER TABLE arqueo AUTO_INCREMENT = 1;

-- Verificar que se borraron
-- SELECT COUNT(*) as total_registros FROM arqueo;
