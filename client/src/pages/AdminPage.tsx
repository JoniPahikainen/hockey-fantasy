import { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import MarketOverviewTable from "../components/admin/MarketOverviewTable";
import EconomyControls from "../components/admin/EconomyControls";

type Tab = "players" | "economy";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("players");

  const tabs: { id: Tab; label: string }[] = [
    { id: "players", label: "Players – Market Overview" },
    { id: "economy", label: "Economy Controls" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 overflow-auto px-6 py-8 ml-16">
        <header className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">
            Admin <span className="text-slate-700">Market Control</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight mt-1">
            Calibrate pricing • Adjust economy
          </p>
        </header>

        <nav className="flex gap-1 border-b border-slate-200 mb-8">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === id
                  ? "bg-slate-900 text-white border-b-2 border-indigo-500 -mb-px"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "players" && <MarketOverviewTable />}
        {activeTab === "economy" && <EconomyControls />}
      </div>
    </div>
  );
}
