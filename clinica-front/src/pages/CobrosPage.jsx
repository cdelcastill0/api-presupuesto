// src/pages/CobrosPage.jsx
import { useEffect, useState } from "react";
import {
  fetchCitasPendientes,
  crearCobro,
  API_BASE_URL,
  fetchSaldo,
  fetchPacientes,
  fetchPagosByPaciente,
} from "../api/cajaApi";

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

export default function CobrosPage({ presupuestoData }) {
  const [citas, setCitas] = useState([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [errorCitas, setErrorCitas] = useState("");

  const [form, setForm] = useState({
    idCita: "",
    idPaciente: "",
    monto: "",
    metodoPago: "EFECTIVO",
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }
  const [lastCobroId, setLastCobroId] = useState(null);
  const [pacientesList, setPacientesList] = useState([]);
  const [saldoInfo, setSaldoInfo] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [patientQuery, setPatientQuery] = useState("");

  useEffect(() => {
    loadCitas();
    loadPacientes();
  }, []);

  // Prefill from presupuestoData when navigating from Presupuesto page
  useEffect(() => {
    if (presupuestoData) {
      const toSet = {};
      if (presupuestoData.idPresupuesto) toSet.idPresupuesto = presupuestoData.idPresupuesto;
      if (presupuestoData.idPaciente) toSet.idPaciente = presupuestoData.idPaciente;
      if (presupuestoData.monto) toSet.monto = presupuestoData.monto;

      if (Object.keys(toSet).length > 0) {
        setForm((prev) => ({ ...prev, ...toSet }));
        if (presupuestoData.idPaciente) loadPagos(Number(presupuestoData.idPaciente));
      }
    }
  }, [presupuestoData]);

  async function loadPacientes() {
    try {
      const data = await fetchPacientes();
      // API puede devolver array o objeto
      const arr = Array.isArray(data) ? data : Array.isArray(data.pacientes) ? data.pacientes : [];
      setPacientesList(arr);
    } catch (err) {
      console.error('[FRONT] Error cargando pacientes:', err);
    }
  }

  async function loadCitas() {
    try {
      setLoadingCitas(true);
      setErrorCitas("");
      const data = await fetchCitasPendientes();

      // el backend puede devolver un array o un objeto { citas: [...] }
      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data.citas)
        ? data.citas
        : [];

      setCitas(lista);
    } catch (err) {
      console.error("[FRONT] Error cargando citas:", err);
      // Si SIGCD está caído (502/timeout), no mostrar error molesto al usuario
      if (err?.message?.includes('502') || err?.message?.includes('timeout')) {
        setErrorCitas("Servicio de citas temporalmente no disponible");
      } else {
        setErrorCitas(err?.message || "Error al cargar las citas pendientes");
      }
    } finally {
      setLoadingCitas(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const errors = {};

    // idCita es opcional, pero si se proporciona debe ser válido
    if (form.idCita && !/^\d+$/.test(form.idCita)) {
      errors.idCita = "El ID de la cita debe ser un número entero";
    }

    // idPaciente
    if (!form.idPaciente) {
      errors.idPaciente = "El ID del paciente es obligatorio";
    } else if (!/^\d+$/.test(form.idPaciente)) {
      errors.idPaciente =
        "El ID del paciente debe ser un número entero";
    }

    // monto
    if (!form.monto) {
      errors.monto = "El monto es obligatorio";
    } else {
      const montoNum = Number(form.monto);
      if (Number.isNaN(montoNum)) {
        errors.monto = "El monto debe ser un número válido";
      } else if (montoNum <= 0) {
        errors.monto = "El monto debe ser mayor que cero";
      }
    }

    // metodoPago
    if (!form.metodoPago) {
      errors.metodoPago = "Selecciona un método de pago";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLastCobroId(null);

    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload = {
        idPaciente: Number(form.idPaciente),
        monto: Number(form.monto),
        metodoPago: form.metodoPago,
      };

      // Solo incluir idCita si tiene un valor
      if (form.idCita) {
        payload.idCita = Number(form.idCita);
      }

      // Incluir idPresupuesto si viene desde el botón Cobrar de presupuestos
      if (form.idPresupuesto) {
        payload.idPresupuesto = Number(form.idPresupuesto);
      }

      const resp = await crearCobro(payload);

      let nuevoCobroId = resp?.idCobro ?? null;
      let pagosYaCargados = false;

      // Si la API no devuelve idCobro, intentar derivarlo del historial del paciente
      if (!nuevoCobroId && payload.idPaciente) {
        const listaPagos = await loadPagos(payload.idPaciente);
        pagosYaCargados = true;
        if (listaPagos.length > 0) {
          const sorted = [...listaPagos].sort((a, b) => {
            const fechaA = a.fechaPago || a.fecha ? new Date(a.fechaPago || a.fecha).getTime() : 0;
            const fechaB = b.fechaPago || b.fecha ? new Date(b.fechaPago || b.fecha).getTime() : 0;
            if (fechaA !== fechaB) return fechaB - fechaA;
            const idA = a.idPago ?? 0;
            const idB = b.idPago ?? 0;
            return idB - idA;
          });
          nuevoCobroId = sorted[0]?.idPago ?? null;
        }
      }

      setLastCobroId(nuevoCobroId);

      // abrir comprobante solo si la API lo devolvió explícitamente
      if (resp?.idCobro) {
        try {
          window.open(`${API_BASE_URL}/api/cobros/${resp.idCobro}/comprobante`, "_blank");
        } catch (e) {
          /* noop */
        }
      }

      // actualizar historial de pagos si aún no se cargó en el paso anterior
      if (payload.idPaciente && !pagosYaCargados) {
        await loadPagos(payload.idPaciente);
      }

      setMessage({
        type: "success",
        text:
          resp?.mensaje || "Cobro registrado correctamente",
      });

      // limpiar campos numéricos, dejar método de pago seleccionado
      setForm((prev) => ({
        ...prev,
        idCita: "",
        idPaciente: "",
        monto: "",
      }));

      // recargar citas porque una ya no estará pendiente
      await loadCitas();
    } catch (err) {
      console.error("[FRONT] Error creando cobro:", err);
      setMessage({
        type: "error",
        text: err?.message || "Error al registrar el cobro",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectCita(cita) {
    // helper para intentar varios nombres de propiedad
    const get = (obj, keys, fallback = "") => {
      for (const k of keys) {
        if (obj[k] != null) return obj[k];
      }
      return fallback;
    };

    const idCita = get(cita, ["idCita", "id_cita", "id"]);
    const idPaciente = get(cita, [
      "idPaciente",
      "id_paciente",
      "pacienteId",
    ]);
    const monto = get(cita, [
      "montoPendiente",
      "monto",
      "total_pendiente",
      "total",
    ]);

    setForm((prev) => ({
      ...prev,
      idCita: idCita ? String(idCita) : prev.idCita,
      idPaciente: idPaciente ? String(idPaciente) : prev.idPaciente,
      monto: monto ? String(monto) : prev.monto,
    }));

    if (idPaciente) loadPagos(Number(idPaciente));

    setFormErrors({});
    setMessage(null);
  }

  async function handlePatientSearchChange(e) {
    setPatientQuery(e.target.value);
  }

  function filteredPatients() {
    const q = (patientQuery || "").toLowerCase().trim();
    if (!q) return [];
    return pacientesList.filter((p) => {
      const name = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
      return name.includes(q) || String(p.idPaciente).includes(q);
    }).slice(0, 10);
  }

  async function fetchAndShowSaldo() {
    const id = Number(form.idPaciente);
    if (!id) {
      setMessage({ type: 'error', text: 'Proporciona un idPaciente para ver saldo' });
      return;
    }
    try {
      const s = await fetchSaldo(id);
      setSaldoInfo(s);
    } catch (err) {
      console.error('[FRONT] Error obteniendo saldo:', err);
      setMessage({ type: 'error', text: err?.message || 'Error consultando saldo' });
    }
  }

  async function loadPagos(idPaciente) {
    try {
      const res = await fetchPagosByPaciente(idPaciente);
      const list = Array.isArray(res.pagos) ? res.pagos : [];
      setPagos(list);
      return list;
    } catch (err) {
      console.error('[FRONT] Error cargando pagos:', err);
      return [];
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-xl text-white text-2xl shadow-lg">
            💰
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Cobros en Caja
            </h1>
            <p className="text-slate-500 text-sm mt-1">Gestión de pagos y cobros</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* === Citas pendientes === */}
        <section className="bg-white shadow-xl rounded-2xl p-6 border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <span className="text-blue-600">📋</span>
              Citas pendientes de pago
            </h2>
            <button
              type="button"
              onClick={loadCitas}
              disabled={loadingCitas}
              className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
            >
              {loadingCitas ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          {errorCitas && (
            <p className="text-sm text-red-600 mb-2">
              {errorCitas}
            </p>
          )}

          {loadingCitas && (
            <p className="text-sm text-slate-500">
              Cargando citas...
            </p>
          )}

          {!loadingCitas && citas.length === 0 && !errorCitas && (
            <p className="text-sm text-slate-500">
              No hay citas pendientes por cobrar.
            </p>
          )}

          {!loadingCitas && citas.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="px-3 py-2">Folio</th>
                    <th className="px-3 py-2">Paciente</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2 text-right">
                      Monto
                    </th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {citas.map((cita, idx) => {
                    const idCita =
                      cita.idCita ??
                      cita.id_cita ??
                      cita.id ??
                      idx;
                    const folio =
                      cita.folioCita ??
                      cita.folio_cita ??
                      cita.folio ??
                      `Cita #${idCita}`;
                    const paciente =
                      cita.paciente ??
                      cita.nombrePaciente ??
                      cita.nombre_paciente ??
                      cita.nombre ??
                      "-";
                    const fechaRaw =
                      cita.fechaCita ??
                      cita.fecha_cita ??
                      cita.fecha ??
                      null;
                    const monto =
                      cita.montoPendiente ??
                      cita.monto ??
                      cita.total_pendiente ??
                      cita.total ??
                      "";

                    const fecha = fechaRaw
                      ? new Date(fechaRaw).toLocaleString()
                      : "-";

                    return (
                      <tr
                        key={idCita}
                        className="border-b last:border-none hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          {folio}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {paciente}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          {fecha}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {monto !== ""
                            ? `$${monto}`
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectCita(cita)
                            }
                            className="text-xs px-3 py-1 rounded-md bg-sky-600 text-white hover:bg-sky-700"
                          >
                            Cobrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* === Formulario de Cobro === */}
        <section className="bg-white shadow-xl rounded-2xl p-6 border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
          <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-green-600">💳</span>
            Registrar cobro
          </h2>

          {message && (
            <div
              className={`mb-3 rounded-lg px-3 py-2 text-sm ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <div>{message.text}</div>
              {message.type === "success" && lastCobroId && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold">ID cobro: {lastCobroId}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`${API_BASE_URL}/api/cobros/${lastCobroId}/comprobante`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Abrir comprobante
                    </a>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700"
                      onClick={() => navigator?.clipboard?.writeText(String(lastCobroId)).catch(() => {})}
                    >
                      Copiar ID
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            noValidate
          >
            {/* ID Cita */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ID Cita
              </label>
              <input
                type="text"
                name="idCita"
                value={form.idCita}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 ${
                  formErrors.idCita
                    ? "border-red-400"
                    : "border-slate-300"
                }`}
                placeholder="Ej. 19"
              />
              {formErrors.idCita && (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.idCita}
                </p>
              )}
            </div>

            {/* ID Paciente */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ID Paciente
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="idPaciente"
                  value={form.idPaciente}
                  onChange={handleChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 ${
                    formErrors.idPaciente
                      ? "border-red-400"
                      : "border-slate-300"
                  }`}
                  placeholder="Ej. 1"
                />
                <button type="button" onClick={fetchAndShowSaldo} className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm">Ver saldo</button>
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  value={patientQuery}
                  onChange={handlePatientSearchChange}
                  placeholder="Buscar paciente por nombre o id..."
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none border-slate-300"
                />
                {patientQuery && (
                  <div className="mt-1 max-h-40 overflow-auto border bg-white rounded-md">
                    {filteredPatients().map((p) => (
                      <div key={p.idPaciente} className="px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setForm((prev)=>({...prev,idPaciente:String(p.idPaciente)})); setPatientQuery(''); loadPagos(p.idPaciente); }}>
                        <div className="text-sm font-medium">{p.nombre} {p.apellido}</div>
                        <div className="text-xs text-slate-500">ID: {p.idPaciente}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formErrors.idPaciente && (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.idPaciente}
                </p>
              )}
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Monto a cobrar
              </label>
              <div className="flex rounded-md border bg-white border-slate-300 focus-within:ring-2 focus-within:ring-sky-500">
                <span className="inline-flex items-center px-3 text-sm text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="monto"
                  value={form.monto}
                  onChange={handleChange}
                  className="w-full rounded-r-md px-3 py-2 text-sm outline-none"
                  placeholder="Ej. 500"
                />
              </div>
              {formErrors.monto && (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.monto}
                </p>
              )}
            </div>

            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Método de pago
              </label>
              <select
                name="metodoPago"
                value={form.metodoPago}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 ${
                  formErrors.metodoPago
                    ? "border-red-400"
                    : "border-slate-300"
                }`}
              >
                <option value="">Selecciona un método</option>
                {METODOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {formErrors.metodoPago && (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.metodoPago}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed w-full"
              >
                {submitting ? "Registrando cobro..." : "Registrar cobro"}
              </button>
            </div>
          </form>
          {lastCobroId && (
            <div className="mt-4">
              <a
                href={`${API_BASE_URL}/api/cobros/${lastCobroId}/comprobante`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
              >
                Abrir comprobante (PDF)
              </a>
            </div>
          )}
          {saldoInfo && (
            <div className="mt-4 rounded-md border p-3 bg-slate-50 text-sm">
              <div className="font-medium mb-1">Saldo paciente</div>
              <div>Total tratamientos: <strong>${saldoInfo.totalTratamientos}</strong></div>
              <div>Total pagado: <strong>${saldoInfo.totalPagado}</strong></div>
              <div>Saldo pendiente: <strong>${saldoInfo.saldoPendiente}</strong></div>
              {Array.isArray(saldoInfo.tratamientosPendientes) && saldoInfo.tratamientosPendientes.length>0 && (
                <div className="mt-2">
                  <div className="font-medium">Tratamientos pendientes</div>
                  <ul className="text-xs list-disc ml-5">
                    {saldoInfo.tratamientosPendientes.map((t, i)=> (
                      <li key={i}>{t.nombreTratamiento} — {t.cantidad} x ${t.precioUnitario} = ${t.precioTotal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {pagos.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Historial de pagos del paciente</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white">
                    <tr className="text-left text-slate-600">
                      <th className="px-3 py-2">ID Pago</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2 text-right">Monto</th>
                      <th className="px-3 py-2">Método</th>
                      <th className="px-3 py-2"/>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((p)=> (
                      <tr key={p.idPago} className="border-b last:border-none hover:bg-slate-50">
                        <td className="px-3 py-2">{p.idPago}</td>
                        <td className="px-3 py-2 text-xs">{new Date(p.fechaPago || p.fecha).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">${p.monto}</td>
                        <td className="px-3 py-2">{p.metodoPago || p.metodo_pago}</td>
                        <td className="px-3 py-2">
                          <a className="text-sky-600" href={`${API_BASE_URL}/api/cobros/${p.idPago}/comprobante`} target="_blank">Comprobante</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
