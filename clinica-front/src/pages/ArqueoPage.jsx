import { useState, useEffect } from "react";

export default function ArqueoPage() {
  const [arqueos, setArqueos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  
  // Estados para el modal de generación
  const [showModal, setShowModal] = useState(false);
  const [datosArqueo, setDatosArqueo] = useState(null);
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  const API_URL = import.meta.env.VITE_CAJA_API_URL || "https://api-presupuesto.onrender.com";

  // Cargar historial de arqueos al montar
  useEffect(() => {
    cargarArqueos();
  }, []);

  const cargarArqueos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/arqueo`);
      const data = await response.json();
      
      if (response.ok) {
        setArqueos(data.arqueos || []);
      } else {
        setError(data.message || "Error al cargar arqueos");
      }
    } catch (err) {
      setError("Error de conexión al cargar arqueos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generar arqueo (calcular sin guardar)
  const handleGenerarArqueo = async () => {
    try {
      setLoading(true);
      setError("");
      setMensaje("");

      const response = await fetch(`${API_URL}/api/arqueo/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioRegistro: "temp" }) // Validación temporal
      });

      const data = await response.json();

      if (response.ok) {
        setDatosArqueo(data);
        setShowModal(true);
        setResponsable("");
        setObservaciones("");
      } else {
        setError(data.message || "Error al generar arqueo");
      }
    } catch (err) {
      setError("Error de conexión al generar arqueo");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Guardar arqueo en la BD
  const handleGuardarArqueo = async () => {
    if (!responsable.trim()) {
      setError("El campo 'Responsable' es obligatorio");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const payload = {
        ...datosArqueo,
        usuarioRegistro: responsable,
        observaciones: observaciones || null
      };

      const response = await fetch(`${API_URL}/api/arqueo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("Arqueo guardado exitosamente");
        setShowModal(false);
        cargarArqueos(); // Recargar historial
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMensaje(""), 3000);
      } else {
        setError(data.message || "Error al guardar arqueo");
      }
    } catch (err) {
      setError("Error de conexión al guardar arqueo");
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(valor || 0);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    // Extraer solo la parte de la fecha si viene con timestamp
    const fechaSolo = fecha.toString().split('T')[0];
    const [year, month, day] = fechaSolo.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatearHora = (hora) => {
    if (!hora) return "N/A";
    // La hora viene en formato HH:MM:SS, simplemente mostrarla
    return hora;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-xl text-white text-2xl shadow-lg">
            📊
          </div>
          <div>
            <h1 className="page-title">Arqueo de Caja</h1>
            <p className="text-slate-500 text-sm mt-1">Control y conciliación de pagos</p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Botón para generar arqueo */}
      <div className="mb-6">
        <button
          onClick={handleGenerarArqueo}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? "Generando..." : "Generar Arqueo Ahora"}
        </button>
      </div>

      {/* Historial de arqueos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Historial de Arqueos</h2>
          <button
            onClick={cargarArqueos}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
          >
            Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efectivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarjeta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transferencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {arqueos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    {loading ? "Cargando..." : "No hay arqueos registrados"}
                  </td>
                </tr>
              ) : (
                arqueos.map((arqueo) => (
                  <tr key={arqueo.idArqueo} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{arqueo.idArqueo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatearFecha(arqueo.fecha)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatearHora(arqueo.horaGeneracion)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatearMoneda(arqueo.totalEfectivo)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatearMoneda(arqueo.totalTarjeta)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatearMoneda(arqueo.totalTransferencia)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{formatearMoneda(arqueo.totalGeneral)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{arqueo.cantidadPagos}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{arqueo.usuarioRegistro}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para confirmar y guardar arqueo */}
      {showModal && datosArqueo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Resumen del Arqueo</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}

              {/* Información del arqueo */}
              <div className="mb-6 space-y-2">
                <p><strong>Fecha:</strong> {formatearFecha(datosArqueo.fecha)}</p>
                <p><strong>Hora:</strong> {formatearHora(datosArqueo.horaGeneracion)}</p>
                <p><strong>Cantidad de Pagos:</strong> {datosArqueo.cantidadPagos}</p>
              </div>

              {/* Desglose por método de pago */}
              <div className="mb-6 bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-3">Desglose por Método de Pago</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Efectivo:</span>
                    <span className="font-semibold">{formatearMoneda(datosArqueo.totalEfectivo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarjeta:</span>
                    <span className="font-semibold">{formatearMoneda(datosArqueo.totalTarjeta)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transferencia:</span>
                    <span className="font-semibold">{formatearMoneda(datosArqueo.totalTransferencia)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-bold">TOTAL GENERAL:</span>
                    <span className="font-bold text-lg text-green-600">{formatearMoneda(datosArqueo.totalGeneral)}</span>
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Responsable <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del responsable"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas adicionales sobre el arqueo"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                  disabled={guardando}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarArqueo}
                  disabled={guardando || !responsable.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {guardando ? "Guardando..." : "Guardar Arqueo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
