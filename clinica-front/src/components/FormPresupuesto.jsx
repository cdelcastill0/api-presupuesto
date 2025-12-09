import { useState } from "react";

export default function FormPresupuesto({ onSubmit }) {
  const [idPaciente, setIdPaciente] = useState("");
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [tratamientos, setTratamientos] = useState([{ idTratamiento: "", cantidad: "" }]);

  const agregarTratamiento = () => {
    setTratamientos([...tratamientos, { idTratamiento: "", cantidad: "" }]);
  };

  const actualizarTratamiento = (index, field, value) => {
    const newTratamientos = [...tratamientos];
    newTratamientos[index][field] = value;
    setTratamientos(newTratamientos);
  };

  const enviar = (e) => {
    e.preventDefault();
    onSubmit({ idPaciente, nombrePaciente, tratamientos });
  };

  return (
    <form onSubmit={enviar} className="bg-white p-6 rounded-xl shadow-md space-y-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center">Solicitar Presupuesto</h2>

      <div>
        <label className="block font-medium">ID Paciente:</label>
        <input
          type="number"
          className="border p-2 rounded w-full"
          value={idPaciente}
          onChange={(e) => setIdPaciente(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-medium">Nombre del Paciente:</label>
        <input
          type="text"
          className="border p-2 rounded w-full"
          value={nombrePaciente}
          onChange={(e) => setNombrePaciente(e.target.value)}
          placeholder="Ej: Juan Pérez"
        />
      </div>

      <div>
        <h3 className="font-medium mb-2">Tratamientos:</h3>

        {tratamientos.map((t, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <input
              type="number"
              placeholder="ID Trat."
              className="border p-2 rounded w-1/2"
              value={t.idTratamiento}
              onChange={(e) => actualizarTratamiento(index, "idTratamiento", e.target.value)}
            />

            <input
              type="number"
              placeholder="Cantidad"
              className="border p-2 rounded w-1/2"
              value={t.cantidad}
              onChange={(e) => actualizarTratamiento(index, "cantidad", e.target.value)}
            />
          </div>
        ))}

        <button type="button" onClick={agregarTratamiento} className="text-blue-600 underline">
          + Agregar tratamiento
        </button>
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
        Enviar
      </button>
    </form>
  );
}
