"use client";

import { useState } from "react";
import { InventoryItem, Store } from "@/lib/types";
import { Modal, Field, inputClass, Badge, EmptyState } from "./ui";

const emptyForm = {
  storeId: "",
  productName: "",
  sku: "",
  category: "",
  quantity: "0",
  unit: "adet",
  price: "",
  currency: "TL",
  minStock: "0",
  notes: "",
};

import { translations } from "@/lib/translations";

export default function InventoryView({
  items,
  stores,
  reload,
  userRole,
  userStoreId,
  lang = "TR",
}: {
  items: InventoryItem[];
  stores: Store[];
  reload: () => void;
  userRole?: string;
  userStoreId?: number | null;
  lang?: "TR" | "EN";
}) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("");

  const t = (key: string): string => {
    return translations[lang]?.[key] || key;
  };

  function openNew() {
    const defaultStoreId = userRole === "manager" && userStoreId ? String(userStoreId) : (stores[0]?.id ? String(stores[0].id) : "");
    setForm({ ...emptyForm, storeId: defaultStoreId });
    setEditId(null);
    setError("");
    setOpen(true);
  }

  function openEdit(i: InventoryItem) {
    setForm({
      storeId: String(i.storeId),
      productName: i.productName,
      sku: i.sku || "",
      category: i.category || "",
      quantity: String(i.quantity),
      unit: i.unit || "adet",
      price: i.price || "",
      currency: i.currency || "TL",
      minStock: String(i.minStock ?? 0),
      notes: i.notes || "",
    });
    setEditId(i.id);
    setError("");
    setOpen(true);
  }

  async function save() {
    if (!form.storeId) {
      setError("Mağaza seçimi zorunludur.");
      return;
    }
    if (!form.productName.trim()) {
      setError("Ürün adı zorunludur.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editId ? `/api/inventory/${editId}` : "/api/inventory",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Kayıt başarısız.");
      }
      setOpen(false);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    reload();
  }

  const filtered = items.filter((i) => {
    const matchSearch =
      i.productName.toLowerCase().includes(search.toLowerCase()) ||
      (i.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.category || "").toLowerCase().includes(search.toLowerCase());
    const matchStore = storeFilter ? String(i.storeId) === storeFilter : true;
    return matchSearch && matchStore;
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t("inventoryTitle")}</h2>
          <p className="text-sm text-slate-500">{t("inventoryDesc")}</p>
        </div>
        {(userRole === "admin" || userRole === "manager") && (
          <button
            onClick={openNew}
            disabled={stores.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {t("newInventoryItem")}
          </button>
        )}
      </div>

      {stores.length === 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Envanter eklemeden önce en az bir mağaza oluşturmalısınız.
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchInventoryPlaceholder")}
          className={inputClass + " max-w-xs"}
        />
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className={inputClass + " max-w-xs"}
        >
          <option value="">{t("allStoresFilter")}</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📦"
          title={items.length === 0 ? t("noInventoryText") : t("noResult")}
          desc={
            items.length === 0
              ? t("noInventoryDesc")
              : t("noResultDesc")
          }
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/70 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("inventoryProduct")}</th>
                  <th className="px-4 py-3 font-semibold">{t("inventoryStore")}</th>
                  <th className="px-4 py-3 font-semibold">{t("inventoryCategory")}</th>
                  <th className="px-4 py-3 font-semibold">{t("inventoryStock")}</th>
                  <th className="px-4 py-3 font-semibold">{t("inventoryPrice")}</th>
                  {(userRole === "admin" || userRole === "manager") && <th className="px-4 py-3 text-right font-semibold">{t("actions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((i) => {
                  const low =
                    (i.minStock ?? 0) > 0 && i.quantity <= (i.minStock ?? 0);
                  return (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {i.productName}
                        </div>
                        {i.sku && (
                          <div className="text-xs text-slate-400">
                            SKU: {i.sku}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {i.storeName || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {i.category || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {i.quantity} {i.unit}
                          </span>
                          {low && <Badge color="red">{lang === "TR" ? "Düşük" : "Low"}</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {i.price ? `${i.currency === "USD" ? "$" : i.currency === "EUR" ? "€" : "₺"}${Number(i.price).toLocaleString("tr-TR")}` : "-"}
                      </td>
                      {(userRole === "admin" || (userRole === "manager" && i.storeId === userStoreId)) && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(i)}
                              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 cursor-pointer"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => remove(i.id)}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                            >
                              {t("delete")}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={open}
        title={editId ? t("editProductTitle") : t("newProductTitle")}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <Field label="Mağaza" required>
            <select
              className={inputClass}
              disabled={userRole === "manager"}
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              <option value="">Mağaza seçin</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("inventoryProductName")} required>
              <input
                className={inputClass}
                value={form.productName}
                onChange={(e) =>
                  setForm({ ...form, productName: e.target.value })
                }
              />
            </Field>
            <Field label={t("inventorySku")}>
              <input
                className={inputClass}
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </Field>
            <Field label={t("inventoryCategory")}>
              <input
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
            <Field label={t("inventoryUnit")}>
              <input
                className={inputClass}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="adet, kg, kutu..."
              />
            </Field>
            <Field label={t("inventoryQuantity")}>
              <input
                type="number"
                className={inputClass}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
            <Field label={t("inventoryMinStock")}>
              <input
                type="number"
                className={inputClass}
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              />
            </Field>
            <div className="col-span-2">
              <Field label={t("inventoryPriceField")}>
                <input
                  type="number"
                  step="0.01"
                  disabled={userRole === "manager"}
                  className={inputClass}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Field>
            </div>
            <div>
              <Field label={t("inventoryCurrencyField")}>
                <select
                  disabled={userRole === "manager"}
                  className={inputClass}
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="TL">TL (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </Field>
            </div>
          </div>
          <Field label={t("notes")}>
            <textarea
              className={inputClass}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
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
              {saving ? t("savingProduct") : t("save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
