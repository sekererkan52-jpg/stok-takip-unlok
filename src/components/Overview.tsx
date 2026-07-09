"use client";

import { InventoryItem, ProcessItem, Store } from "@/lib/types";

export default function Overview({
  stores,
  inventory,
  processes,
  onNavigate,
}: {
  stores: Store[];
  inventory: InventoryItem[];
  processes: ProcessItem[];
  onNavigate: (tab: string) => void;
}) {
  const activeStores = stores.filter((s) => s.status === "aktif").length;
  const lowStock = inventory.filter(
    (i) => (i.minStock ?? 0) > 0 && i.quantity <= (i.minStock ?? 0)
  ).length;
  const totalValue = inventory.reduce(
    (sum, i) => sum + (i.price ? Number(i.price) * i.quantity : 0),
    0
  );
  const openProcesses = processes.filter(
    (p) => p.status === "beklemede" || p.status === "devam"
  ).length;

  const stats = [
    {
      label: "Toplam Mağaza",
      value: stores.length,
      sub: `${activeStores} aktif`,
      icon: "🏬",
      color: "from-indigo-500 to-indigo-600",
      tab: "stores",
    },
    {
      label: "Envanter Ürünü",
      value: inventory.length,
      sub: lowStock > 0 ? `${lowStock} düşük stok` : "Stok normal",
      icon: "📦",
      color: "from-emerald-500 to-emerald-600",
      tab: "inventory",
    },
    {
      label: "Açık Süreç",
      value: openProcesses,
      sub: `${processes.length} toplam`,
      icon: "🗂️",
      color: "from-amber-500 to-amber-600",
      tab: "processes",
    },
    {
      label: "Envanter Değeri",
      value: `₺${totalValue.toLocaleString("tr-TR")}`,
      sub: "Tahmini toplam",
      icon: "💰",
      color: "from-violet-500 to-violet-600",
      tab: "inventory",
    },
  ];

  const recentProcesses = processes.slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Genel Bakış</h2>
        <p className="text-sm text-slate-500">
          Mağaza operasyonlarınızın özeti
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigate(s.tab)}
            className="group text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div
                className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-xl shadow-sm`}
              >
                {s.icon}
              </div>
              <span className="text-slate-300 transition group-hover:text-slate-500">
                →
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm font-medium text-slate-600">{s.label}</p>
            <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Son Süreçler</h3>
            <button
              onClick={() => onNavigate("processes")}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Tümü →
            </button>
          </div>
          {recentProcesses.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Henüz süreç kaydı yok.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentProcesses.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {p.title}
                    </p>
                    <p className="text-xs text-slate-400">{p.storeName}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Mağazalar</h3>
            <button
              onClick={() => onNavigate("stores")}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Tümü →
            </button>
          </div>
          {stores.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Henüz mağaza kaydı yok.
            </p>
          ) : (
            <ul className="space-y-3">
              {stores.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {s.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {s.city || "Şehir belirtilmemiş"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium ${
                      s.status === "aktif"
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    {s.status === "aktif" ? "Aktif" : "Pasif"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
