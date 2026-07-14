"use client";

import { useCallback, useEffect, useState } from "react";
import { InventoryItem, ProcessItem, Store, User } from "@/lib/types";
import Overview from "./Overview";
import StoresView from "./StoresView";
import InventoryView from "./InventoryView";
import ProcessesView from "./ProcessesView";
import UsersView from "./UsersView";
import { Modal, Field, inputClass } from "./ui";
import { translations } from "@/lib/translations";

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [stores, setStores] = useState<Store[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: number; fullName: string; role: string; username: string; storeId?: number | null } | null>(null);

  const [lang, setLang] = useState<"TR" | "EN">("TR");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Load preferences
  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_lang") as "TR" | "EN";
    if (savedLang) setLang(savedLang);

    const savedTheme = localStorage.getItem("preferred_theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  // Update theme class on HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("preferred_theme", theme);
  }, [theme]);

  // Persist language choice
  const changeLanguage = (newLang: "TR" | "EN") => {
    setLang(newLang);
    localStorage.setItem("preferred_lang", newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || key;
  };

  // Profile Action Menu & Password Modal States
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".profile-menu-container")) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [profileMenuOpen]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setChangePasswordError("Tüm alanlar zorunludur.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 4) {
      setChangePasswordError("Yeni şifre en az 4 karakter olmalıdır.");
      return;
    }

    setChangingPassword(true);
    setChangePasswordError("");
    setChangePasswordSuccess("");

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setChangePasswordSuccess("Şifreniz başarıyla güncellendi.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setChangePasswordSuccess("");
        }, 1500);
      } else {
        setChangePasswordError(data.error || "Şifre güncellenemedi.");
      }
    } catch {
      setChangePasswordError("Bir hata oluştu. Tekrar deneyin.");
    } finally {
      setChangingPassword(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const u = await fetch("/api/me").then((r) => (r.ok ? r.json() : null));
      if (u) {
        setUser(u);
        
        // Fetch users, reset requests and activity logs if role is admin
        if (u.role === "admin") {
          try {
            const [uData, rData, lData] = await Promise.all([
              fetch("/api/users").then((r) => (r.ok ? r.json() : [])),
              fetch("/api/admin/reset-requests").then((r) => (r.ok ? r.json() : [])),
              fetch("/api/admin/activity-logs").then((r) => (r.ok ? r.json() : [])),
            ]);
            setUsers(Array.isArray(uData) ? uData : []);
            setResetRequests(Array.isArray(rData) ? rData : []);
            setActivityLogs(Array.isArray(lData) ? lData : []);
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
    { key: "overview", label: t("overview"), icon: "📊" },
    { key: "stores", label: t("stores"), icon: "🏬" },
    { key: "inventory", label: t("inventory"), icon: "📦" },
    { key: "processes", label: t("processes"), icon: "🗂️" },
    ...(user?.role === "admin" ? [{ key: "users", label: t("users"), icon: "👥" }] : []),
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between transform bg-slate-950/90 backdrop-blur-xl border-r border-slate-900/60 text-slate-350 transition-transform lg:static lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-900/50 px-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-xl shadow-lg shadow-indigo-600/30 text-white">
              🏪
            </span>
            <div>
              <p className="text-sm font-extrabold tracking-wide text-white uppercase">Mağaza Paneli</p>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Yönetim Sistemi</p>
            </div>
          </div>
          <nav className="space-y-1.5 p-4 flex-1">
            {navigationItems.map((n) => {
              const active = tab === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => go(n.key)}
                  className={`nav-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold tracking-wide uppercase transition-all duration-200 ${
                    active
                      ? "bg-indigo-650 text-white shadow-lg shadow-indigo-650/20 border border-indigo-500/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="nav-icon text-base select-none inline-block">{n.icon}</span>
                  {n.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Profile & Logout */}
        <div className="border-t border-slate-900/50 bg-slate-950/60 p-4 shrink-0 relative profile-menu-container">
          {/* Animated Popover Menu */}
          {profileMenuOpen && (
            <div className="absolute bottom-20 left-4 right-4 bg-slate-900/95 border border-slate-800 p-2 rounded-2xl shadow-2xl animate-slide-up-fade space-y-1 z-50 backdrop-blur-md">
              <button
                onClick={() => {
                  setShowChangePasswordModal(true);
                  setProfileMenuOpen(false);
                  setChangePasswordError("");
                  setChangePasswordSuccess("");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-350 hover:bg-white/5 hover:text-white transition cursor-pointer"
              >
                🔑 {t("changePassword")}
              </button>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-450 hover:bg-rose-500/10 transition cursor-pointer"
              >
                🚪 {t("logout")}
              </button>
            </div>
          )}

          {user && (
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="mb-0 flex w-full items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all text-left group active:scale-[0.98] cursor-pointer"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white font-bold uppercase text-xs shadow-md shadow-indigo-600/10 group-hover:scale-105 transition-transform duration-200">
                {user.fullName.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white leading-none">{user.fullName}</p>
                <p className="truncate text-[10px] text-slate-500 font-semibold mt-1 uppercase tracking-wider">{user.role}</p>
              </div>
              <span className="text-[10px] text-slate-550 font-extrabold group-hover:text-slate-350 transition-colors select-none">
                {profileMenuOpen ? "▲" : "▼"}
              </span>
            </button>
          )}
          <div className="mt-4 text-center text-[9px] font-bold text-slate-700 uppercase tracking-widest">
            Lokal Yönetim v2.1
          </div>
        </div>
      </aside>

      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/50 bg-slate-50/70 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Menü"
            >
              ☰
            </button>
            <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              {navigationItems.find((n) => n.key === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-xl border border-slate-200/80 bg-white shadow-sm p-2 text-sm transition hover:bg-slate-50 active:scale-95 cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-850"
              title={theme === "light" ? "Karanlık Tema" : "Aydınlık Tema"}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => changeLanguage(e.target.value as "TR" | "EN")}
                className="rounded-xl border border-slate-200/80 bg-white shadow-sm px-3 py-2 text-xs font-bold text-slate-700 outline-none transition hover:bg-slate-50 cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-850"
              >
                <option value="TR">🇹🇷 TR</option>
                <option value="EN">🇺🇸 EN</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={load}
              className="rounded-xl border border-slate-200/80 bg-white shadow-sm px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-850"
            >
              ↻ {t("refresh")}
            </button>
          </div>
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
                  activityLogs={activityLogs}
                  onNavigate={go}
                  lang={lang}
                />
              )}
              {tab === "stores" && (
                <StoresView stores={stores} reload={load} userRole={user?.role} userStoreId={user?.storeId} lang={lang} />
              )}
              {tab === "inventory" && (
                <InventoryView
                  items={inventory}
                  stores={stores}
                  reload={load}
                  userRole={user?.role}
                  userStoreId={user?.storeId}
                  lang={lang}
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

      {/* Change Password Modal */}
      <Modal
        open={showChangePasswordModal}
        title={t("changePassword")}
        onClose={() => setShowChangePasswordModal(false)}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {changePasswordError && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {changePasswordError}
            </div>
          )}
          {changePasswordSuccess && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {changePasswordSuccess}
            </div>
          )}
          <Field label={t("currentPassword")} required>
            <input
              type="password"
              required
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label={t("newPassword")} required>
            <input
              type="password"
              required
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field label={t("confirmNewPassword")} required>
            <input
              type="password"
              required
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowChangePasswordModal(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {changingPassword ? t("updating") : t("save")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
