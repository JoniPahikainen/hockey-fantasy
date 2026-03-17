import { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import MarketOverviewTable from "../components/admin/MarketOverviewTable";
import EconomyControls from "../components/admin/EconomyControls";
import BalanceView from "../components/admin/BalanceView";

type Tab = "players" | "economy" | "balance";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("players");

  const tabs: { id: Tab; label: string }[] = [
    { id: "players", label: "Players – Market Overview" },
    { id: "economy", label: "Economy Controls" },
    { id: "balance", label: "Balance" },
  ];

  return (
    <div className="flex h-screen bg-bg-secondary text-text-primary">
      <Sidebar />
      <div className="flex-1 overflow-auto px-6 py-8 ml-16">
        <header className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic text-text-primary">
            Admin <span className="text-text-secondary">Market Control</span>
          </h1>
          <p className="text-text-muted font-medium tracking-tight mt-1">
            Calibrate pricing • Adjust economy
          </p>
        </header>

        <nav className="flex gap-1 border-b border-border-default mb-8">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === id
                  ? "bg-bg-sidebar text-text-inverse border-b-2 border-accent-primary -mb-px"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "players" && <MarketOverviewTable />}
        {activeTab === "economy" && <EconomyControls />}
        {activeTab === "balance" && <BalanceView />}
      </div>
    </div>
  );
}
