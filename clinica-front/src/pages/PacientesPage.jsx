// src/pages/PacientesPage.jsx
import { useState, useEffect } from "react";
import {
  crearPaciente,
  syncPacientesDesdeSIGCD,
  fetchPacientes,
} from "../api/cajaApi";

export default function PacientesPage() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    fecha_nac: "",
    direccion: "",
    correo: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null); // {type, text}
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [syncSummary, setSyncSummary] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const errs = {};

    if (!form.nombre.trim()) {
      errs.nombre = "El nombre es obligatorio";
    }

    if (!form.apellido.trim()) {
      errs.apellido = "El apellido es obligatorio";
    }

    if (form.correo) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.correo)) {
        errs.correo = "Correo electrónico no válido";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setSyncSummary(null);

    if (!validate()) return;

    try {
      setLoadingCreate(true);

      const payload = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        fecha_nac: form.fecha_nac || null,
        direccion: form.direccion || null,
        correo: form.correo || null,
      };

      const resp = await crearPaciente(payload);

      setMessage({
        type: "success",
        text:
          resp?.mensaje ||
          "Paciente registrado correctamente en Caja",
      });

      // limpiar formulario
      setForm({
        nombre: "",
        apellido: "",
        fecha_nac: "",
        direccion: "",
        correo: "",
      });
      setErrors({});
    } catch (err) {
      console.error("[FRONT] Error creando paciente:", err);
      setMessage({
        type: "error",
        text:
          err?.message ||
          "Error interno al registrar el paciente",
      });
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleSync() {
    setMessage(null);
    setSyncSummary(null);

    try {
      setLoadingSync(true);
      const resp = await syncPacientesDesdeSIGCD();
      setSyncSummary(resp);
      setMessage({
        type: "success",
        text:
          resp?.mensaje ||
          "Sincronización completada correctamente",
      });
    } catch (err) {
      console.error(
        "[FRONT] Error sincronizando pacientes:",
        err
      );
      setMessage({
        type: "error",
        text:
          err?.message ||
          "Error al sincronizar pacientes desde SIGCD",
      });
    } finally {
      setLoadingSync(false);
    }
  }

  // Lista de pacientes (provenientes de gestión de citas / SIGCD)
  const [pacientes, setPacientes] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);

  async function loadPacientes() {
    try {
      setLoadingPacientes(true);
      const data = await fetchPacientes();
      // API puede devolver array o objeto
      const arr = Array.isArray(data) ? data : Array.isArray(data.pacientes) ? data.pacientes : [];
      setPacientes(arr);
    } catch (err) {
      console.error('Error cargando pacientes:', err);
    } finally {
      setLoadingPacientes(false);
    }
  }

  // Cargar pacientes al inicio
  useEffect(() => {
    loadPacientes();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-xl text-white text-2xl shadow-lg">
            👥
          </div>
          <div>
            <h1 className="page-title">
              Gestión de pacientes
            </h1>
            <p className="text-slate-500 text-sm mt-1">Registro y sincronización de pacientes</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* === Alta manual === */}
        <section className="card">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-green-600">➕</span>
            Registrar paciente en Caja
          </h2>

          {message && (
            <div className={message.type === "success" ? "alert-success" : "alert-error"}>
              {message.text}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            noValidate
          >
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.nombre
                    ? "border-red-400"
                    : "border-slate-300"
                }`}
                placeholder="Ej. Juan"
              />
              {errors.nombre && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Apellido(s)
              </label>
              <input
                type="text"
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.apellido
                    ? "border-red-400"
                    : "border-slate-300"
                }`}
                placeholder="Ej. Pérez López"
              />
              {errors.apellido && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.apellido}
                </p>
              )}
            </div>

            {/* Fecha de nacimiento */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                name="fecha_nac"
                value={form.fecha_nac}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dirección
              </label>
              <textarea
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none border-slate-300 focus:ring-2 focus:ring-sky-500 resize-none"
                placeholder="Calle, número, colonia..."
              />
            </div>

            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.correo
                    ? "border-red-400"
                    : "border-slate-300"
                }`}
                placeholder="ejemplo@correo.com"
              />
              {errors.correo && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.correo}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loadingCreate}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed w-full"
              >
                {loadingCreate
                  ? "Guardando..."
                  : "Registrar paciente"}
              </button>
            </div>
          </form>
        </section>

        {/* === Sincronización desde SIGCD === */}
        <section className="bg-white shadow rounded-xl p-4 border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-3">
            Sincronizar pacientes desde SIGCD
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            Este proceso llama a la API de SIGCD (
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
              /pacientes
            </code>
            ) y actualiza la tabla{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
              PACIENTE
            </code>{" "}
            de Caja usando{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
              INSERT ... ON DUPLICATE KEY UPDATE
            </code>
            .
          </p>

          <button
            type="button"
            onClick={handleSync}
            disabled={loadingSync}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingSync
              ? "Sincronizando..."
              : "Sincronizar ahora"}
          </button>

          {syncSummary && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <p className="font-medium text-slate-800 mb-1">
                Resumen de sincronización
              </p>
              <ul className="text-slate-700 space-y-0.5">
                <li>
                  Total recibidos:{" "}
                  <span className="font-semibold">
                    {syncSummary.total_recibidos}
                  </span>
                </li>
                <li>
                  Insertados:{" "}
                  <span className="font-semibold">
                    {syncSummary.insertados}
                  </span>
                </li>
                <li>
                  Actualizados:{" "}
                  <span className="font-semibold">
                    {syncSummary.actualizados}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </section>

          {/* === Lista de pacientes (provenientes de SIGCD) === */}
          <section className="bg-white shadow rounded-xl p-4 border border-slate-200">
            <h2 className="font-semibold text-slate-800 mb-3">Pacientes</h2>

            <div className="mb-3">
              <button
                type="button"
                onClick={loadPacientes}
                disabled={loadingPacientes}
                className="text-sm px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingPacientes ? "Actualizando..." : "Actualizar lista"}
              </button>
            </div>

            {!loadingPacientes && pacientes.length === 0 && (
              <p className="text-sm text-slate-500">No hay pacientes registrados.</p>
            )}

            {pacientes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-slate-600">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientes.map((p) => (
                      <tr key={p.idPaciente} className="border-b last:border-none hover:bg-slate-50">
                        <td className="px-3 py-2">{p.idPaciente}</td>
                        <td className="px-3 py-2">{p.nombre} {p.apellido}</td>
                        <td className="px-3 py-2">{p.correo || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
      </div>
    </div>
  );
}
