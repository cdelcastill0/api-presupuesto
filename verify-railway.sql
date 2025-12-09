-- Verificación final de la estructura en Railway
-- Ejecuta esto en la terminal de Railway para confirmar

SHOW COLUMNS FROM pago;

-- Deberías ver:
-- idPago        | int           | NO   | PRI
-- idPaciente    | int           | YES  | MUL  <-- NUEVA COLUMNA
-- idPresupuesto | int           | YES  | MUL
-- fechaPago     | datetime      | YES
-- monto         | decimal(10,2) | YES
-- metodoPago    | varchar(30)   | YES
-- referencia    | varchar(50)   | YES
