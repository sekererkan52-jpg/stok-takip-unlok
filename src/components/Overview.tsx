"use client";

import { useEffect, useState } from "react";
import { ProcessItem, Store, InventoryItem } from "@/lib/types";
import { Badge } from "./ui";

interface WidgetConfig {
  id: string;
  name: string;
  visible: boolean;
  size: "1/3" | "2/3" | "full";
  icon: string;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "stats", name: "Özet İstatistik Kartları", visible: false, size: "full", icon: "📊" },
  { id: "critical_stock", name: "Kritik Stok Uyarısı", visible: false, size: "2/3", icon: "🚨" },
  { id: "process_distribution", name: "Süreç Dağılım Grafiği", visible: false, size: "1/3", icon: "📈" },
  { id: "recent_processes", name: "Son Süreçler Listesi", visible: false, size: "2/3", icon: "📅" },
  { id: "quick_actions", name: "Hızlı Menü Kartı", visible: false, size: "1/3", icon: "⚡" },
  { id: "reset_requests", name: "Şifre Sıfırlama Talepleri (Admin)", visible: false, size: "full", icon: "🔑" },
  { id: "activity_logs", name: "Sistem Aktivite Günlüğü (Admin)", visible: false, size: "full", icon: "📜" },
];

export default function Overview({
  stores,
  processes,
  inventory = [],
  userRole,
  resetRequests = [],
  activityLogs = [],
  onResolveReset,
  onResetPassword,
  onNavigate,
}: {
  stores: Store[];
  processes: ProcessItem[];
  inventory?: InventoryItem[];
  userRole?: string;
  resetRequests?: any[];
  activityLogs?: any[];
  onResolveReset?: (id: number) => void;
  onResetPassword?: (id: number, password: string) => Promise<{ success: boolean; error?: string }>;
  onNavigate: (tab: string) => void;
}) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Password reset modal state
  const [resetTarget, setResetTarget] = useState<{ id: number; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || !newPassword.trim()) return;
    setResetLoading(true);
    setResetError("");
    if (onResetPassword) {
      const res = await onResetPassword(resetTarget.id, newPassword.trim());
      if (res.success) {
        setResetTarget(null);
        setNewPassword("");
      } else {
        setResetError(res.error || "Şifre sıfırlanamadı.");
      }
    }
    setResetLoading(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem("overview_widgets_layout");
    if (saved) {
      try {
        const parsed: WidgetConfig[] = JSON.parse(saved);
        const merged = [...parsed];
        DEFAULT_WIDGETS.forEach((defW) => {
          if (!merged.some((w) => w.id === defW.id)) {
            merged.push(defW);
          }
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWidgets(merged);
      } catch (e) {
        console.error("Layout parse error:", e);
      }
    }
    setMounted(true);
  }, []);

  const saveLayout = (newLayout: WidgetConfig[]) => {
    setWidgets(newLayout);
    localStorage.setItem("overview_widgets_layout", JSON.stringify(newLayout));
  };

  const toggleVisibility = (id: string) => {
    const next = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    saveLayout(next);
  };

  const changeSize = (id: string, size: "1/3" | "2/3" | "full") => {
    const next = widgets.map((w) => (w.id === id ? { ...w, size } : w));
    saveLayout(next);
  };

  const moveUp = (id: string) => {
    const idx = widgets.findIndex((w) => w.id === id);
    if (idx <= 0) return;
    const next = [...widgets];
    const temp = next[idx];
    next[idx] = next[idx - 1];
    next[idx - 1] = temp;
    saveLayout(next);
  };

  const moveDown = (id: string) => {
    const idx = widgets.findIndex((w) => w.id === id);
    if (idx === -1 || idx === widgets.length - 1) return;
    const next = [...widgets];
    const temp = next[idx];
    next[idx] = next[idx + 1];
    next[idx + 1] = temp;
    saveLayout(next);
  };

  // Calculations
  const activeStores = stores.filter((s) => s.status === "aktif").length;
  const pendingCount = processes.filter((p) => p.status === "beklemede").length;
  const inProgressCount = processes.filter((p) => p.status === "devam").length;
  const completedCount = processes.filter((p) => p.status === "tamamlandi").length;
  const cancelledCount = processes.filter((p) => p.status === "iptal").length;

  const totalProducts = inventory.length;
  const totalStockQty = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const criticalItems = inventory.filter(
    (item) => (item.minStock ?? 0) > 0 && item.quantity <= (item.minStock ?? 0)
  );

  const statsItems = [
    {
      label: "Toplam Mağaza",
      value: stores.length,
      sub: `${activeStores} aktif mağaza`,
      icon: "🏬",
      color: "from-indigo-500 to-blue-600 shadow-indigo-500/20",
      tab: "stores",
    },
    {
      label: "Aktif Süreçler",
      value: pendingCount + inProgressCount,
      sub: `${inProgressCount} devam eden, ${pendingCount} bekleyen`,
      icon: "🔄",
      color: "from-amber-500 to-orange-600 shadow-amber-500/20",
      tab: "processes",
    },
    {
      label: "Toplam Ürün Çeşidi",
      value: totalProducts,
      sub: `${totalStockQty.toLocaleString("tr-TR")} adet toplam stok`,
      icon: "📦",
      color: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
      tab: "inventory",
    },
    {
      label: "Kritik Stok Uyarısı",
      value: criticalItems.length,
      sub: criticalItems.length > 0 ? "Yetersiz stok seviyesi!" : "Tüm stoklar güvende",
      icon: "⚠️",
      color: criticalItems.length > 0 
        ? "from-rose-500 to-red-600 shadow-rose-500/20 animate-pulse" 
        : "from-slate-500 to-slate-700 shadow-slate-500/20",
      tab: "inventory",
    },
  ];

  // Prevent SSR mismatch
  if (!mounted) {
    return (
      <div className="grid place-items-center py-24 text-slate-400">
        <div className="text-center">
          <div className="mb-3 text-3xl">⏳</div>
          Genel Bakış Yükleniyor...
        </div>
      </div>
    );
  }

  // Filter widgets for the current user (only admins see reset requests and activity logs options)
  const settingsWidgets = widgets.filter((w) => (w.id !== "reset_requests" && w.id !== "activity_logs") || userRole === "admin");
  const visibleWidgets = widgets.filter((w) => w.visible && ((w.id !== "reset_requests" && w.id !== "activity_logs") || userRole === "admin"));

  const renderWidget = (id: string, size: "1/3" | "2/3" | "full") => {
    switch (id) {
      case "stats":
        const colsClass =
          size === "1/3"
            ? "grid-cols-1"
            : size === "2/3"
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

        return (
          <div className={`grid gap-6 ${colsClass}`}>
            {statsItems.map((s) => (
              <button
                key={s.label}
                onClick={() => onNavigate(s.tab)}
                className="group text-left rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300 focus:outline-none w-full"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-lg shadow-md text-white`}
                  >
                    {s.icon}
                  </div>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-300 text-xs font-bold">
                    →
                  </span>
                </div>
                <p className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">{s.value}</p>
                <p className="text-xs font-bold text-slate-700 mt-1">{s.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
              </button>
            ))}
          </div>
        );

      case "critical_stock":
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>🚨</span> Kritik Stok Seviyeleri
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Minimum limit altındaki ürünler</p>
                </div>
                <button
                  onClick={() => onNavigate("inventory")}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 px-3 py-1.5 rounded-lg transition"
                >
                  Tümü →
                </button>
              </div>

              {criticalItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                  <span className="text-3xl">🛡️</span>
                  <p className="text-sm font-semibold text-emerald-800 mt-2">Tüm Stoklar Güvende</p>
                  <p className="text-xs text-emerald-600/80 mt-0.5">Kritik stok seviyesinde ürün bulunmuyor.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Ürün</th>
                        <th className="px-4 py-2.5">Mağaza</th>
                        <th className="px-4 py-2.5 text-center">Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {criticalItems.slice(0, 5).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/30">
                          <td className="px-4 py-2.5 font-semibold text-slate-800">
                            {item.productName}
                            {item.sku && <span className="block text-[10px] text-slate-400 font-normal">SKU: {item.sku}</span>}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{item.storeName || "-"}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700">
                              {item.quantity} / {item.minStock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {criticalItems.length > 5 && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => onNavigate("inventory")}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  +{criticalItems.length - 5} kritik ürün daha var
                </button>
              </div>
            )}
          </div>
        );

      case "recent_processes":
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>📅</span> Son Operasyonlar
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">En son güncellenen süreçler</p>
                </div>
                <button
                  onClick={() => onNavigate("processes")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-lg transition"
                >
                  Tümü →
                </button>
              </div>

              {processes.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Henüz süreç kaydı yok.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {processes.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {p.storeName} • {p.category || "Kategorisiz"}
                        </p>
                      </div>
                      <Badge
                        color={
                          p.status === "tamamlandi" ? "green" :
                          p.status === "devam" ? "blue" :
                          p.status === "iptal" ? "red" : "gray"
                        }
                      >
                        {p.status === "tamamlandi" ? "Bitti" :
                         p.status === "devam" ? "Devam" :
                         p.status === "iptal" ? "İptal" : "Bekliyor"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "process_distribution":
        const total = processes.length;
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-full">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <span>📈</span> Süreç Analizi
            </h3>
            <div className="space-y-3.5">
              {[
                { label: "Beklemede", count: pendingCount, color: "bg-slate-400", pct: total ? (pendingCount / total) * 100 : 0 },
                { label: "Devam Ediyor", count: inProgressCount, color: "bg-blue-500", pct: total ? (inProgressCount / total) * 100 : 0 },
                { label: "Tamamlandı", count: completedCount, color: "bg-emerald-500", pct: total ? (completedCount / total) * 100 : 0 },
                { label: "İptal", count: cancelledCount, color: "bg-rose-500", pct: total ? (cancelledCount / total) * 100 : 0 },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-slate-950">
                      {item.count} <span className="text-slate-400 font-normal">({Math.round(item.pct)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "quick_actions":
        return (
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-md text-white h-full flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base mb-1">Hızlı Erişim</h3>
              <p className="text-xs text-slate-400 mb-4">İstediğiniz ekrana tek tıkla geçiş yapın</p>
              
              <div className="space-y-2">
                {[
                  { label: "Mağazalar", tab: "stores", icon: "🏬" },
                  { label: "Görev / Süreçler", tab: "processes", icon: "🗂️" },
                  { label: "Envanter Paneli", tab: "inventory", icon: "📦" },
                ].map((act) => (
                  <button
                    key={act.label}
                    onClick={() => onNavigate(act.tab)}
                    className="flex w-full items-center justify-between rounded-xl bg-white/10 hover:bg-white/15 border border-white/5 p-3 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>{act.icon}</span>
                      {act.label}
                    </span>
                    <span>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "reset_requests":
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>🔑</span> Şifre Sıfırlama Talepleri
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sıfırlama bekleyen kullanıcı hesapları</p>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {resetRequests.length} Yeni
                </span>
              </div>

              {resetRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <span className="text-2xl">🎉</span>
                  <p className="text-xs font-semibold text-slate-700 mt-2">Bekleyen Talep Yok</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Aktif şifre sıfırlama talebi bulunmuyor.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
                  {resetRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <button
                          onClick={() => {
                            setResetTarget({ id: req.id, username: req.username });
                            setNewPassword("");
                            setResetError("");
                          }}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer text-left block"
                        >
                          @{req.username}
                        </button>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Tarih: {new Date(req.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                      <button
                        onClick={() => onResolveReset && onResolveReset(req.id)}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 text-[10px] font-bold text-white transition cursor-pointer shrink-0"
                      >
                        Tamamlandı İşaretle
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "activity_logs":
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>📜</span> Sistem Aktivite Günlüğü
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sistemde yapılan son işlemler</p>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Son {activityLogs.length} İşlem
                </span>
              </div>

              {activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <span className="text-2xl">🔍</span>
                  <p className="text-xs font-semibold text-slate-700 mt-2">Kayıt Bulunmamaktadır</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Henüz sistemde kaydedilmiş bir işlem yok.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="py-3 flex items-start gap-3 justify-between first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            log.action.includes("Ekle") || log.action.includes("Tanımla") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            log.action.includes("Güncelle") || log.action.includes("Şifre") ? "bg-blue-50 text-blue-700 border border-blue-100" :
                            "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            @{log.username || "sistem"} ({log.userFullName || "Bilinmiyor"})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                          {log.details}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Zaman: {new Date(log.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Genel Bakış</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem durumunu takip edin ve panel düzenini özelleştirin
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition border ${
            showSettings
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          ⚙️ {showSettings ? "Ayarları Kapat" : "Görünümü Özelleştir"}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 shadow-inner space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              🛠️ Panel Bileşen Ayarları
            </span>
            <button
              onClick={() => saveLayout(DEFAULT_WIDGETS)}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
            >
              Varsayılana Sıfırla
            </button>
          </div>
          <div className="space-y-2">
            {settingsWidgets.map((w) => {
              const mainIndex = widgets.findIndex((orig) => orig.id === w.id);
              return (
                <div
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-[200px]">
                    <span className="text-lg">{w.icon}</span>
                    <span className="text-xs font-semibold text-slate-800">{w.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Visibility Toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={w.visible}
                        onChange={() => toggleVisibility(w.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="text-[11px] text-slate-600 font-medium">Göster</span>
                    </label>

                    {/* Size Selector */}
                    <select
                      value={w.size}
                      disabled={!w.visible}
                      onChange={(e) => changeSize(w.id, e.target.value as any)}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value="1/3">Küçük (1/3)</option>
                      <option value="2/3">Orta (2/3)</option>
                      <option value="full">Tam Genişlik (3/3)</option>
                    </select>

                    {/* Move Up/Down */}
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                      <button
                        onClick={() => moveUp(w.id)}
                        disabled={mainIndex === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Yukarı Taşı"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveDown(w.id)}
                        disabled={mainIndex === widgets.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Aşağı Taşı"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid Layout Container */}
      {visibleWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-300 p-8">
          <span className="text-4xl">🎛️</span>
          <p className="text-sm font-bold text-slate-800 mt-4">Kişisel Paneline Hoş Geldiniz</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
            Paneli boş bıraktınız. Görmek istediğiniz özet kartlarını, tabloları ve grafikleri seçmek için sağ üstteki <strong>Görünümü Özelleştir</strong> butonuna tıklayarak bileşenleri ekleyebilirsiniz.
          </p>
          <button
            onClick={() => setShowSettings(true)}
            className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition cursor-pointer"
          >
            + Bileşen Ekle / Ayarla
          </button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {visibleWidgets.map((w) => {
            const sizeClass =
              w.size === "1/3"
                ? "lg:col-span-1"
                : w.size === "2/3"
                ? "lg:col-span-2"
                : "lg:col-span-3";

            return (
              <div key={w.id} className={`${sizeClass} transition-all duration-300`}>
                {renderWidget(w.id, w.size)}
              </div>
            );
          })}
        </div>
      )}
      {/* Password Reset Modal for Admin */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-left">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Şifre Sıfırla</h3>
            <p className="text-xs text-slate-500 mb-4">
              <strong>@{resetTarget.username}</strong> kullanıcısı için yeni bir şifre girin. Şifre güncellendikten sonra talep kapatılacaktır.
            </p>

            {resetError && (
              <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  required
                  disabled={resetLoading}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  placeholder="Yeni şifreyi girin..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading ? "Kaydediliyor..." : "Şifreyi Güncelle ve Talebi Kapat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
