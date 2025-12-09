-- Migración: Agregar columna idPaciente a la tabla pago
-- Fecha: 2025-12-05
-- Propósito: Permitir que los pagos se asocien directamente a pacientes
--           sin necesidad de tener un presupuesto obligatorio

-- 1. Agregar columna idPaciente a la tabla pago
ALTER TABLE pago 
ADD COLUMN idPaciente INT AFTER idPago;

-- 2. Agregar índice para mejorar performance de búsquedas
ALTER TABLE pago 
ADD INDEX idx_idPaciente (idPaciente);

-- 3. Migrar datos existentes: copiar idPaciente desde presupuesto
UPDATE pago p
JOIN presupuesto pr ON p.idPresupuesto = pr.idPresupuesto
SET p.idPaciente = pr.idPaciente
WHERE p.idPaciente IS NULL AND p.idPresupuesto IS NOT NULL;

-- 4. Verificar migración
SELECT 
  COUNT(*) as total_pagos,
  SUM(CASE WHEN idPaciente IS NOT NULL THEN 1 ELSE 0 END) as con_paciente,
  SUM(CASE WHEN idPaciente IS NULL THEN 1 ELSE 0 END) as sin_paciente
FROM pago;

SELECT 'Migración completada exitosamente' AS status;
