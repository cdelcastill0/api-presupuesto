export default function ResultadoPresupuesto({ data }) {
  if (!data) return null;

  return (
    <div className="bg-green-100 p-6 mt-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">Presupuesto Generado</h2>

      <p><strong>ID Presupuesto:</strong> {data.idPresupuesto}</p>
      <p><strong>ID Paciente:</strong> {data.idPaciente}</p>
      <p><strong>Total:</strong> ${data.total}</p>

      <h3 className="text-lg font-semibold mt-4">Detalles</h3>
      <ul className="list-disc ml-6">
        {data.detalles.map((d, i) => (
          <li key={i}>
            Tratamiento {d.idTratamiento} × {d.cantidad} → ${d.precioTotal}
          </li>
        ))}
      </ul>
    </div>
  );
}
