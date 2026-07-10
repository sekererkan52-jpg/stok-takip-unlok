"use client";

import { useState } from "react";
import { Store } from "@/lib/types";
import { Modal, Field, inputClass, Badge, EmptyState } from "./ui";

const emptyForm = {
  name: "",
  code: "",
  manager: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  status: "aktif",
  notes: "",
};

export default function StoresView({
  stores,
  reload,
  userRole,
}: {
  stores: Store[];
  reload: () => void;
  userRole?: string;
}) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  function openNew() {
    setForm(emptyForm);
    setEditId(null);
    setError("");
    setOpen(true);
  }

  function openEdit(s: Store) {
    setForm({
      name: s.name,
      code: s.code || "",
      manager: s.manager || "",
      phone: s.phone || "",
      email: s.email || "",
      city: s.city || "",
      address: s.address || "",
      status: s.status,
      notes: s.notes || "",
    });
    setEditId(s.id);
    setError("");
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      setError("Mağaza adı zorunludur.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editId ? `/api/stores/${editId}` : "/api/stores",
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
    if (!confirm("Bu mağazayı ve ilişkili tüm envanter/süreç kayıtlarını silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/stores/${id}`, { method: "DELETE" });
    reload();
  }

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.manager || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mağazalar</h2>
          <p className="text-sm text-slate-500">Mağaza bilgilerini yönetin</p>
        </div>
        {userRole === "admin" && (
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Yeni Mağaza
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mağaza, şehir veya yönetici ara..."
          className={inputClass + " max-w-md"}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🏬"
          title={stores.length === 0 ? "Henüz mağaza yok" : "Sonuç bulunamadı"}
          desc={
            stores.length === 0
              ? "İlk mağazanızı eklemek için 'Yeni Mağaza' butonuna tıklayın."
              : "Arama kriterlerinize uygun mağaza bulunamadı."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-slate-900">
                    {s.name}
                  </h3>
                  {s.code && (
                    <p className="text-xs text-slate-400">Kod: {s.code}</p>
                  )}
                </div>
                <Badge color={s.status === "aktif" ? "green" : "gray"}>
                  {s.status === "aktif" ? "Aktif" : "Pasif"}
                </Badge>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                {s.manager && <p>👤 {s.manager}</p>}
                {s.city && <p>📍 {s.city}</p>}
                {s.phone && <p>📞 {s.phone}</p>}
                {s.email && <p className="truncate">✉️ {s.email}</p>}
                {s.address && (
                  <p className="text-xs text-slate-400">{s.address}</p>
                )}
              </div>
              {userRole === "admin" && (
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                  >
                    Sil
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editId ? "Mağaza Düzenle" : "Yeni Mağaza"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mağaza Adı" required>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Mağaza Kodu">
              <input
                className={inputClass}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </Field>
            <Field label="Yönetici">
              <input
                className={inputClass}
                value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
              />
            </Field>
            <Field label="Şehir">
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Telefon">
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="E-posta">
              <input
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Durum">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
              </select>
            </Field>
          </div>
          <Field label="Adres">
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Notlar">
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
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              İptal
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
