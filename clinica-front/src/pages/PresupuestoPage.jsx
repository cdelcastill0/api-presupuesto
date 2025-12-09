import { useEffect, useState } from "react";
import FormPresupuesto from "../components/FormPresupuesto";
import ResultadoPresupuesto from "../components/ResultadoPresupuesto";
import { fetchPresupuestos, crearPresupuesto, API_BASE_URL } from "../api/cajaApi";

export default function PresupuestoPage({ onNavigateToCobros }) {
  const [resultado, setResultado] = useState(null);
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detalleModal, setDetalleModal] = useState(null); // {presupuesto: {...}, detalles: [...]}

  useEffect(() => {
    loadPresupuestos();
  }, []);

  async function loadPresupuestos() {
    try {
      setLoading(true);
      const data = await fetchPresupuestos();
      // data: { presupuestos: [...] }
      setPresupuestos(Array.isArray(data.presupuestos) ? data.presupuestos : []);
    } catch (err) {
      console.error("Error cargando presupuestos:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrearPresupuesto(payload) {
    try {
      setLoading(true);
      const data = await crearPresupuesto(payload);
      setResultado(data);
      await loadPresupuestos();
    } catch (err) {
      console.error("Error creando presupuesto:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerDetalle(idPresupuesto) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/presupuestos/${idPresupuesto}`);
      const data = await res.json();
      setDetalleModal(data);
    } catch (err) {
      console.error("Error obteniendo detalle:", err);
      alert(`Error: ${err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-xl text-white text-2xl shadow-lg">
            📋
          </div>
          <div>
            <h1 className="page-title">Presupuestos</h1>
            <p className="text-slate-500 text-sm mt-1">Generación y consulta de presupuestos</p>
          </div>
        </div>
      </div>

      <section className="card">
        <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-blue-600">➕</span>
          Generar presupuesto
        </h2>
        <FormPresupuesto onSubmit={handleCrearPresupuesto} />
        <ResultadoPresupuesto data={resultado} />
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <span className="text-purple-600">📊</span>
            Presupuestos generados
          </h2>
          <button onClick={loadPresupuestos} className="btn-primary text-sm">{loading ? 'Cargando...' : 'Actualizar'}</button>
        </div>

        {!loading && presupuestos.length === 0 && (
          <p className="text-sm text-slate-500">No hay presupuestos generados.</p>
        )}

        {presupuestos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">ID Paciente</th>
                  <th className="px-3 py-2">Nombre Paciente</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {presupuestos.map((p) => (
                  <tr key={p.idPresupuesto} className="border-b last:border-none hover:bg-slate-50">
                    <td className="px-3 py-2">{p.idPresupuesto}</td>
                    <td className="px-3 py-2">{p.idPaciente}</td>
                    <td className="px-3 py-2">{p.nombrePaciente || 'N/D'}</td>
                    <td className="px-3 py-2 text-xs">{new Date(p.fechaEmision).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-medium">${p.total}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => handleVerDetalle(p.idPresupuesto)}
                          className="text-xs px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Ver Detalle
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToCobros) {
                              onNavigateToCobros({
                                idPresupuesto: p.idPresupuesto,
                                idPaciente: p.idPaciente,
                                monto: p.total,
                              });
                            }
                          }}
                          className="text-xs px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Cobrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Detalle */}
      {detalleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDetalleModal(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Detalle del Presupuesto #{detalleModal.idPresupuesto}</h3>
              <button onClick={() => setDetalleModal(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Info del Presupuesto */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">ID Paciente:</span> {detalleModal.idPaciente}
                  </div>
                  <div>
                    <span className="font-semibold">Fecha:</span> {new Date(detalleModal.fechaEmision).toLocaleString()}
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold">Total:</span> <span className="text-lg font-bold text-emerald-600">${detalleModal.total}</span>
                  </div>
                </div>
              </div>

              {/* Tratamientos */}
              <div>
                <h4 className="font-semibold mb-3">Tratamientos</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Tratamiento</th>
                        <th className="px-4 py-2 text-center">Cantidad</th>
                        <th className="px-4 py-2 text-right">Precio Unit.</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleModal.detalles?.map((det, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-2">{det.nombreTratamiento || `Tratamiento ${det.idTratamiento}`}</td>
                          <td className="px-4 py-2 text-center">{det.cantidad}</td>
                          <td className="px-4 py-2 text-right">${Number(det.precioUnitario).toFixed(2)}</td>
                          <td className="px-4 py-2 text-right font-medium">${Number(det.precioTotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold">
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-right">TOTAL:</td>
                        <td className="px-4 py-2 text-right text-emerald-600">${detalleModal.total}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
              <button onClick={() => setDetalleModal(null)} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
