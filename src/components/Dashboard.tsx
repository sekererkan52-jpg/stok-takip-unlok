"use client";

import { useCallback, useEffect, useState } from "react";
import { InventoryItem, ProcessItem, Store, User } from "@/lib/types";
import Overview from "./Overview";
import StoresView from "./StoresView";
import InventoryView from "./InventoryView";
import ProcessesView from "./ProcessesView";
import UsersView from "./UsersView";

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [stores, setStores] = useState<Store[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: number; fullName: string; role: string; username: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const u = await fetch("/api/me").then((r) => (r.ok ? r.json() : null));
      if (u) {
        setUser(u);
        
        // Fetch users and reset requests if role is admin
        if (u.role === "admin") {
          try {
            const [uData, rData] = await Promise.all([
              fetch("/api/users").then((r) => (r.ok ? r.json() : [])),
              fetch("/api/admin/reset-requests").then((r) => (r.ok ? r.json() : [])),
            ]);
            setUsers(Array.isArray(uData) ? uData : []);
            setResetRequests(Array.isArray(rData) ? rData : []);
          } catch (e) {
            console.error("Failed to load admin data:", e);
          }
        }
      }
      
      const [s, p, i] = await Promise.all([
        fetch("/api/stores").then((r) => r.json()),
        fetch("/api/processes").then((r) => r.json()),
        fetch("/api/inventory").then((r) => r.json()),
      ]);
      setStores(Array.isArray(s) ? s : []);
      setProcesses(Array.isArray(p) ? p : []);
      setInventory(Array.isArray(i) ? i : []);
    } catch {
      setStores([]);
      setProcesses([]);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleResolveResetRequest = useCallback(async (id: number) => {
    try {
      const res = await fetch("/api/admin/reset-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        load();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "İşlem başarısız.");
      }
    } catch {
      alert("Bir hata oluştu.");
    }
  }, [load]);

  const handleResetUserPassword = useCallback(async (id: number, password: string) => {
    try {
      const res = await fetch("/api/admin/reset-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      if (res.ok) {
        load();
        return { success: true };
      } else {
        const d = await res.json().catch(() => ({}));
        return { success: false, error: d.error || "Şifre sıfırlanamadı." };
      }
    } catch {
      return { success: false, error: "Bağlantı hatası oluştu." };
    }
  }, [load]);

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  function go(t: string) {
    setTab(t);
    setMenuOpen(false);
  }

  const navigationItems = [
    { key: "overview", label: "Genel Bakış", icon: "📊" },
    { key: "stores", label: "Mağazalar", icon: "🏬" },
    { key: "inventory", label: "Envanter", icon: "📦" },
    { key: "processes", label: "Süreçler", icon: "🗂️" },
    ...(user?.role === "admin" ? [{ key: "users", label: "Kullanıcılar", icon: "👥" }] : []),
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between transform bg-slate-900 text-slate-300 transition-transform lg:static lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-800 px-6">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-lg">
              🏪
            </span>
            <div>
              <p className="text-sm font-bold text-white">Mağaza Paneli</p>
              <p className="text-[11px] text-slate-400">Yönetim Sistemi</p>
            </div>
          </div>
          <nav className="space-y-1 p-3 flex-1">
            {navigationItems.map((n) => (
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
        </div>

        {/* Sidebar Footer with Profile & Logout */}
        <div className="border-t border-slate-800 bg-slate-950/40 p-4 shrink-0">
          {user && (
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-850 text-white font-bold uppercase text-xs ring-2 ring-indigo-500/20">
                {user.fullName.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{user.fullName}</p>
                <p className="truncate text-[10px] text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 py-2 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/20 active:scale-[0.98]"
          >
            🚪 Çıkış Yap
          </button>
          <div className="mt-3 text-center text-[10px] text-slate-600">
            Lokal Mağaza Yönetim Paneli
          </div>
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
              {navigationItems.find((n) => n.key === tab)?.label}
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
                  processes={processes}
                  inventory={inventory}
                  userRole={user?.role}
                  resetRequests={resetRequests}
                  onResolveReset={handleResolveResetRequest}
                  onResetPassword={handleResetUserPassword}
                  onNavigate={go}
                />
              )}
              {tab === "stores" && (
                <StoresView stores={stores} reload={load} userRole={user?.role} />
              )}
              {tab === "inventory" && (
                <InventoryView
                  items={inventory}
                  stores={stores}
                  reload={load}
                  userRole={user?.role}
                />
              )}

              {tab === "processes" && (
                <ProcessesView
                  items={processes}
                  stores={stores}
                  reload={load}
                  userRole={user?.role}
                />
              )}
              {tab === "users" && user?.role === "admin" && (
                <UsersView
                  users={users}
                  currentUser={user}
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
