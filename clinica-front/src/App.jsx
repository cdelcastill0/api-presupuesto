import { useState } from "react";
import CobrosPage from "./pages/CobrosPage";
import PacientesPage from "./pages/PacientesPage";
import PresupuestoPage from "./pages/PresupuestoPage";
import TratamientosPage from "./pages/TratamientosPage";
import ArqueoPage from "./pages/ArqueoPage";

export default function App() {
  const [tab, setTab] = useState("cobros");
  const [presupuestoData, setPresupuestoData] = useState(null);

  function handleNavigateToCobros(data) {
    setPresupuestoData(data);
    setTab("cobros");
  }

  const menuItems = [
    { id: "cobros", name: "Cobros", icon: "💰" },
    { id: "pacientes", name: "Pacientes", icon: "👤" },
    { id: "presupuesto", name: "Presupuestos", icon: "📋" },
    { id: "tratamientos", name: "Tratamientos", icon: "🏥" },
    { id: "arqueo", name: "Arqueo de Caja", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl border-r border-slate-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-cyan-600">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">🏥</span>
            <div>
              <div className="text-lg">Sistema de Caja</div>
              <div className="text-xs text-blue-100 font-normal">Clínica Dental</div>
            </div>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                tab === item.id
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "text-slate-700 hover:bg-slate-100 hover:scale-102"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            © 2025 Sistema de Caja
          </p>
          <p className="text-xs text-slate-400 mt-1">
            v1.0.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {tab === "cobros" && <CobrosPage presupuestoData={presupuestoData} />}
          {tab === "pacientes" && <PacientesPage />}
          {tab === "presupuesto" && <PresupuestoPage onNavigateToCobros={handleNavigateToCobros} />}
          {tab === "tratamientos" && <TratamientosPage />}
          {tab === "arqueo" && <ArqueoPage />}
        </div>
      </main>
    </div>
  );
}
