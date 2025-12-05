// Compatibilidad: exportar `pool` para controladores que importan desde `src/config/db.js`
import { db as pool } from "../db/db.js";

export { pool };

export default pool;
