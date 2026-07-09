"use client";

import { useCallback, useEffect, useState } from "react";
import { InventoryItem, ProcessItem, Store } from "@/lib/types";
import Overview from "./Overview";
import StoresView from "./StoresView";
import InventoryView from "./InventoryView";
import ProcessesView from "./ProcessesView";

const nav = [
  { key: "overview", label: "Genel Bakış", icon: "📊" },
  { key: "stores", label: "Mağazalar", icon: "🏬" },
  { key: "inventory", label: "Envanter", icon: "📦" },
  { key: "processes", label: "Süreçler", icon: "🗂️" },
];

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [stores, setStores] = useState<Store[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, i, p] = await Promise.all([
        fetch("/api/stores").then((r) => r.json()),
        fetch("/api/inventory").then((r) => r.json()),
        fetch("/api/processes").then((r) => r.json()),
      ]);
      setStores(Array.isArray(s) ? s : []);
      setInventory(Array.isArray(i) ? i : []);
      setProcesses(Array.isArray(p) ? p : []);
    } catch {
      setStores([]);
      setInventory([]);
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function go(t: string) {
    setTab(t);
    setMenuOpen(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-300 transition-transform lg:static lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-lg">
            🏪
          </span>
          <div>
            <p className="text-sm font-bold text-white">Mağaza Paneli</p>
            <p className="text-[11px] text-slate-400">Yönetim Sistemi</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((n) => (
            <button
              key={n.key}
              onClick={() => go(n.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                tab === n.key
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-slate-800 p-4 text-[11px] text-slate-500">
          Lokal Mağaza Yönetim Paneli
        </div>
      </aside>

      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Menü"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold text-slate-800">
              {nav.find((n) => n.key === tab)?.label}
            </h1>
          </div>
          <button
            onClick={load}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
          >
            ↻ Yenile
          </button>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          {loading ? (
            <div className="grid place-items-center py-24 text-slate-400">
              <div className="text-center">
                <div className="mb-3 text-3xl">⏳</div>
                Yükleniyor...
              </div>
            </div>
          ) : (
            <>
              {tab === "overview" && (
                <Overview
                  stores={stores}
                  inventory={inventory}
                  processes={processes}
                  onNavigate={go}
                />
              )}
              {tab === "stores" && (
                <StoresView stores={stores} reload={load} />
              )}
              {tab === "inventory" && (
                <InventoryView
                  items={inventory}
                  stores={stores}
                  reload={load}
                />
              )}
              {tab === "processes" && (
                <ProcessesView
                  items={processes}
                  stores={stores}
                  reload={load}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
