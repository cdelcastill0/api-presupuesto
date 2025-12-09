// src/pages/TratamientosPage.jsx
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../api/cajaApi";

export default function TratamientosPage() {
  const [form, setForm] = useState({
    nombreTratamiento: "",
    descripcion: "",
    precioBase: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null); // {type, text}
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [tratamientos, setTratamientos] = useState([]);
  const [loadingTratamientos, setLoadingTratamientos] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const errs = {};

    if (!form.nombreTratamiento.trim()) {
      errs.nombreTratamiento = "El nombre del tratamiento es obligatorio";
    }

    if (!form.precioBase || Number(form.precioBase) <= 0) {
      errs.precioBase = "El precio debe ser mayor a 0";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!validate()) return;

    try {
      setLoadingCreate(true);

      const payload = {
        nombreTratamiento: form.nombreTratamiento.trim(),
        descripcion: form.descripcion.trim() || null,
        precioBase: Number(form.precioBase),
      };

      const res = await fetch(`${API_BASE_URL}/api/tratamientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear tratamiento");
      }

      setMessage({
        type: "success",
        text: data?.mensaje || "Tratamiento registrado correctamente",
      });

      // Limpiar formulario
      setForm({
        nombreTratamiento: "",
        descripcion: "",
        precioBase: "",
      });
      setErrors({});

      // Recargar lista
      await loadTratamientos();
    } catch (err) {
      console.error("[FRONT] Error creando tratamiento:", err);
      setMessage({
        type: "error",
        text: err?.message || "Error interno al registrar el tratamiento",
      });
    } finally {
      setLoadingCreate(false);
    }
  }

  async function loadTratamientos() {
    try {
      setLoadingTratamientos(true);
      const res = await fetch(`${API_BASE_URL}/api/tratamientos`);
      const data = await res.json();
      
      const arr = Array.isArray(data) ? data : Array.isArray(data.tratamientos) ? data.tratamientos : [];
      setTratamientos(arr);
    } catch (err) {
      console.error("Error cargando tratamientos:", err);
    } finally {
      setLoadingTratamientos(false);
    }
  }

  // Cargar tratamientos al inicio
  useEffect(() => {
    loadTratamientos();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-xl text-white text-2xl shadow-lg">
            🏥
          </div>
          <div>
            <h1 className="page-title">Tratamientos</h1>
            <p className="text-slate-500 text-sm mt-1">Catálogo de tratamientos disponibles</p>
          </div>
        </div>
      </div>

      {/* Formulario de Creación */}
      <section className="card">
        <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-green-600">➕</span>
          Registrar nuevo tratamiento
        </h2>

        {message && (
          <div className={message.type === "success" ? "alert-success mb-4" : "alert-error mb-4"}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre del Tratamiento */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del Tratamiento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombreTratamiento"
                value={form.nombreTratamiento}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.nombreTratamiento ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Ej: Limpieza dental"
              />
              {errors.nombreTratamiento && (
                <p className="text-xs text-red-500 mt-1">{errors.nombreTratamiento}</p>
              )}
            </div>

            {/* Precio Base */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Precio Base <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="precioBase"
                value={form.precioBase}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.precioBase ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="0.00"
              />
              {errors.precioBase && (
                <p className="text-xs text-red-500 mt-1">{errors.precioBase}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              placeholder="Descripción del tratamiento (opcional)"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingCreate ? "Registrando..." : "Registrar Tratamiento"}
            </button>
          </div>
        </form>
      </section>

      {/* Lista de Tratamientos */}
      <section className="bg-white shadow rounded-xl p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Tratamientos registrados</h2>
          <button
            onClick={loadTratamientos}
            className="text-sm px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
          >
            {loadingTratamientos ? "Cargando..." : "Actualizar lista"}
          </button>
        </div>

        {!loadingTratamientos && tratamientos.length === 0 && (
          <p className="text-sm text-slate-500">No hay tratamientos registrados</p>
        )}

        {tratamientos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2 text-right">Precio Base</th>
                </tr>
              </thead>
              <tbody>
                {tratamientos.map((t) => (
                  <tr
                    key={t.idTratamiento}
                    className="border-b last:border-none hover:bg-slate-50"
                  >
                    <td className="px-3 py-2">{t.idTratamiento}</td>
                    <td className="px-3 py-2 font-medium">{t.nombreTratamiento}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {t.descripcion || "Sin descripción"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-600">
                      ${Number(t.precioBase).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
