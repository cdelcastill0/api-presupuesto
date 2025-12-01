// index.js
import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(
    `🚑  API de Caja y Presupuestos corriendo en http://localhost:${PORT}`
  );
});
