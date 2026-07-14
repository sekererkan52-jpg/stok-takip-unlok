"use client";

import { useState } from "react";
import { ProcessItem, Store } from "@/lib/types";
import { Modal, Field, inputClass, Badge, EmptyState } from "./ui";

const emptyForm = {
  storeId: "",
  title: "",
  description: "",
  category: "",
  status: "beklemede",
  priority: "orta",
  assignedTo: "",
  dueDate: "",
};

import { translations } from "@/lib/translations";

const statusColors: Record<string, "gray" | "blue" | "green" | "red"> = {
  beklemede: "gray",
  devam: "blue",
  tamamlandi: "green",
  iptal: "red",
};

const priorityColors: Record<string, "gray" | "amber" | "red"> = {
  dusuk: "gray",
  orta: "amber",
  yuksek: "red",
};

export default function ProcessesView({
  items,
  stores,
  reload,
  userRole,
  lang = "TR",
}: {
  items: ProcessItem[];
  stores: Store[];
  reload: () => void;
  userRole?: string;
  lang?: "TR" | "EN";
}) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const t = (key: string): string => {
    return translations[lang]?.[key] || key;
  };

  const statusLabels: Record<string, string> = {
    beklemede: lang === "TR" ? "Beklemede" : "Pending",
    devam: lang === "TR" ? "Devam Ediyor" : "In Progress",
    tamamlandi: lang === "TR" ? "Tamamlandı" : "Completed",
    iptal: lang === "TR" ? "İptal" : "Cancelled",
  };

  const priorityLabels: Record<string, string> = {
    dusuk: lang === "TR" ? "Düşük" : "Low",
    orta: lang === "TR" ? "Orta" : "Medium",
    yuksek: lang === "TR" ? "Yüksek" : "High",
  };

  function openNew() {
    setForm({ ...emptyForm, storeId: stores[0]?.id ? String(stores[0].id) : "" });
    setEditId(null);
    setError("");
    setOpen(true);
  }

  function openEdit(p: ProcessItem) {
    setForm({
      storeId: String(p.storeId),
      title: p.title,
      description: p.description || "",
      category: p.category || "",
      status: p.status,
      priority: p.priority,
      assignedTo: p.assignedTo || "",
      dueDate: p.dueDate ? p.dueDate.slice(0, 10) : "",
    });
    setEditId(p.id);
    setError("");
    setOpen(true);
  }

  async function save() {
    if (!form.storeId) {
      setError(lang === "TR" ? "Mağaza seçimi zorunludur." : "Store selection is required.");
      return;
    }
    if (!form.title.trim()) {
      setError(lang === "TR" ? "Süreç başlığı zorunludur." : "Process title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editId ? `/api/processes/${editId}` : "/api/processes",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || (lang === "TR" ? "Kayıt başarısız." : "Save failed."));
      }
      setOpen(false);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : (lang === "TR" ? "Bir hata oluştu." : "An error occurred."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm(t("processDeleteConfirm"))) return;
    await fetch(`/api/processes/${id}`, { method: "DELETE" });
    reload();
  }

  const filtered = items.filter((p) =>
    statusFilter ? p.status === statusFilter : true
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t("processesTitle")}</h2>
          <p className="text-sm text-slate-500">{t("processesDesc")}</p>
        </div>
        {userRole === "admin" && (
          <button
            onClick={openNew}
            disabled={stores.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {t("newProcess")}
          </button>
        )}
      </div>

      {stores.length === 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("noStoresProcessWarning")}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {["", "beklemede", "devam", "tamamlandi", "iptal"].map((st) => (
          <button
            key={st || "all"}
            onClick={() => setStatusFilter(st)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition cursor-pointer ${
              statusFilter === st
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {st === "" ? t("allFilter") : statusLabels[st]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title={items.length === 0 ? t("noProcessesText") : t("noResult")}
          desc={
            items.length === 0
              ? t("noProcessesDesc")
              : t("noResultProcessDesc")
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">
                  {p.title}
                </h3>
                <div className="flex shrink-0 gap-1.5">
                  <Badge color={statusColors[p.status] || "gray"}>
                    {statusLabels[p.status] || p.status}
                  </Badge>
                </div>
              </div>
              {p.description && (
                <p className="mt-2 text-sm text-slate-600">{p.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>🏬 {p.storeName || "-"}</span>
                <Badge color={priorityColors[p.priority] || "gray"}>
                  {t("priority")}: {priorityLabels[p.priority] || p.priority}
                </Badge>
                {p.category && <span>🏷️ {p.category}</span>}
                {p.assignedTo && <span>👤 {p.assignedTo}</span>}
                {p.dueDate && (
                  <span>
                    📅 {new Date(p.dueDate).toLocaleDateString("tr-TR")}
                  </span>
                )}
              </div>
              {userRole === "admin" && (
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 cursor-pointer"
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                  >
                    {t("delete")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editId ? t("editProcessTitle") : t("newProcessTitle")}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <Field label={t("storeName")} required>
            <select
              className={inputClass}
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              <option value="">{t("storeSelectPlaceholder")}</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("processTitleField")} required>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label={t("processDescField")}>
            <textarea
              className={inputClass}
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("processCategoryField")}>
              <input
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder={lang === "TR" ? "Sevkiyat, temizlik..." : "Shipping, cleaning..."}
              />
            </Field>
            <Field label={t("processAssignedToField")}>
              <input
                className={inputClass}
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
              />
            </Field>
            <Field label={t("processStatusField")}>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="beklemede">{statusLabels.beklemede}</option>
                <option value="devam">{statusLabels.devam}</option>
                <option value="tamamlandi">{statusLabels.tamamlandi}</option>
                <option value="iptal">{statusLabels.iptal}</option>
              </select>
            </Field>
            <Field label={t("processPriorityField")}>
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="dusuk">{priorityLabels.dusuk}</option>
                <option value="orta">{priorityLabels.orta}</option>
                <option value="yuksek">{priorityLabels.yuksek}</option>
              </select>
            </Field>
            <Field label={t("processDueDateField")}>
              <input
                type="date"
                className={inputClass}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
            >
              {saving ? t("savingProcess") : t("save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
