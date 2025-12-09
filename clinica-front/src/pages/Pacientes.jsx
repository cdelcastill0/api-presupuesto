import { useEffect, useState } from "react";

export default function Pacientes() {
  const API = "https://api-presupuesto.onrender.com/api/pacientes";

  const [pacientes, setPacientes] = useState([]);
  const [form, setForm] = useState({
    idPaciente: null,
    nombre: "",
    apellido: "",
    fecha_nac: "",
    correo: "",
    direccion: ""
  });

  const cargarPacientes = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setPacientes(data);
    } catch (err) {
      console.error("Error al cargar pacientes:", err);
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const guardarPaciente = async () => {
    if (!form.nombre || !form.apellido || !form.fecha_nac) {
      alert("Completa los datos obligatorios");
      return;
    }

    try {
      let res;

      if (form.idPaciente) {
        res = await fetch(`${API}/${form.idPaciente}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`${API}/registrar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      const json = await res.json();
      alert(json.mensaje);

      setForm({
        idPaciente: null,
        nombre: "",
        apellido: "",
        fecha_nac: "",
        correo: "",
        direccion: ""
      });

      cargarPacientes();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const editarPaciente = (p) => {
    setForm({
      idPaciente: p.idPaciente,
      nombre: p.nombre,
      apellido: p.apellido,
      fecha_nac: p.fecha_nac,
      correo: p.correo,
      direccion: p.direccion
    });
  };

  const eliminarPaciente = async (id) => {
    if (!window.confirm("¿Eliminar paciente?")) return;

    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      const json = await res.json();
      alert(json.mensaje);
      cargarPacientes();
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gestión de Pacientes</h1>

      <div className="bg-white shadow p-4 rounded mb-6">
        <h2 className="font-semibold text-lg mb-3">
          {form.idPaciente ? "Editar Paciente" : "Registrar Paciente"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="border p-2 rounded" />
          <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" className="border p-2 rounded" />

          <input type="date" name="fecha_nac" value={form.fecha_nac} onChange={handleChange} className="border p-2 rounded" />
          <input name="correo" value={form.correo} onChange={handleChange} placeholder="Correo" className="border p-2 rounded" />
          <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" className="border p-2 rounded col-span-2" />
        </div>

        <button
          onClick={guardarPaciente}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {form.idPaciente ? "Actualizar" : "Registrar"}
        </button>
      </div>

      <div className="bg-white shadow p-4 rounded">
        <h2 className="font-semibold text-lg mb-3">Pacientes Registrados</h2>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">ID</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Apellido</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {pacientes.map((p) => (
              <tr key={p.idPaciente} className="border-b">
                <td className="p-2">{p.idPaciente}</td>
                <td className="p-2">{p.nombre}</td>
                <td className="p-2">{p.apellido}</td>

                <td className="p-2 flex gap-2">
                  <button onClick={() => editarPaciente(p)} className="bg-yellow-500 text-white px-2 py-1 rounded">
                    Editar
                  </button>

                  <button onClick={() => eliminarPaciente(p.idPaciente)} className="bg-red-600 text-white px-2 py-1 rounded">
                    Eliminar
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
