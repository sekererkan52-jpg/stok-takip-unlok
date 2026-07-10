"use client";

import { useEffect, useState } from "react";
import { Store, User } from "@/lib/types";
import { Modal, Field, inputClass, Badge, EmptyState } from "./ui";

const ROLES = [
  {
    value: "admin",
    label: "Yönetici (Admin)",
    desc: "Tüm verilere tam erişim. Kullanıcı yönetimi dahil.",
    color: "purple" as const,
    icon: "👑",
  },
  {
    value: "manager",
    label: "Mağaza Yöneticisi",
    desc: "Atandığı mağazanın tüm verilerini görür ve düzenleyebilir.",
    color: "blue" as const,
    icon: "🏬",
  },
  {
    value: "staff",
    label: "Personel",
    desc: "Atandığı mağazada yalnızca süreçleri görüntüleyebilir.",
    color: "green" as const,
    icon: "👤",
  },
];

const emptyForm = {
  username: "",
  fullName: "",
  password: "",
  role: "staff",
  active: "1",
  storeId: "",
};

export default function UsersView({
  users,
  currentUser,
  reload,
}: {
  users: User[];
  currentUser: { id: number; role: string } | null;
  reload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setStores(Array.isArray(d) ? d : []))
      .catch(() => setStores([]));
  }, []);

  function openNew() {
    setForm(emptyForm);
    setEditId(null);
    setError("");
    setOpen(true);
  }

  function openEdit(u: User) {
    setForm({
      username: u.username,
      fullName: u.fullName,
      password: "",
      role: u.role,
      active: String(u.active),
      storeId: u.storeId ? String(u.storeId) : "",
    });
    setEditId(u.id);
    setError("");
    setOpen(true);
  }

  async function save() {
    if (!editId && !form.username.trim()) {
      setError("Kullanıcı adı zorunludur.");
      return;
    }
    if (!form.fullName.trim()) {
      setError("Ad Soyad zorunludur.");
      return;
    }
    if (!editId && !form.password.trim()) {
      setError("Şifre zorunludur.");
      return;
    }
    if (form.role !== "admin" && !form.storeId) {
      setError("Admin olmayan kullanıcılara mağaza atanmalıdır.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(editId ? `/api/users/${editId}` : "/api/users", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim().toLowerCase(),
          fullName: form.fullName.trim(),
          password: form.password,
          role: form.role,
          active: Number(form.active),
          storeId: form.storeId ? Number(form.storeId) : null,
        }),
      });

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
    if (currentUser && id === currentUser.id) {
      alert("Kendi hesabınızı silemezsiniz.");
      return;
    }
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Silme işlemi başarısız.");
      }
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Bir hata oluştu.");
    }
  }

  const filtered = users.filter(
    (u) =>
      (u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())) &&
      (selectedRoleFilter ? u.role === selectedRoleFilter : true)
  );

  function getRoleInfo(role: string) {
    return ROLES.find((r) => r.value === role) || ROLES[2];
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kullanıcı Yönetimi</h2>
          <p className="text-sm text-slate-500">Sistem kullanıcılarını, rollerini ve mağaza yetkilerini yönetin</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          + Yeni Kullanıcı
        </button>
      </div>

      {/* Rol Açıklamaları */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {ROLES.map((r) => {
          const isSelected = selectedRoleFilter === r.value;
          return (
            <button
              key={r.value}
              onClick={() => setSelectedRoleFilter(isSelected ? null : r.value)}
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm text-left transition duration-200 outline-none w-full ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <span className="text-2xl">{r.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  {r.label}
                  {isSelected && (
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ad soyad veya kullanıcı adı ara..."
          className={inputClass + " max-w-md"}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title={users.length === 0 ? "Henüz kullanıcı yok" : "Sonuç bulunamadı"}
          desc={
            users.length === 0
              ? "İlk kullanıcınızı eklemek için 'Yeni Kullanıcı' butonuna tıklayın."
              : "Arama kriterlerinize uygun kullanıcı bulunamadı."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ad Soyad</th>
                  <th className="px-4 py-3 font-semibold">Kullanıcı Adı</th>
                  <th className="px-4 py-3 font-semibold">Rol / Yetki</th>
                  <th className="px-4 py-3 font-semibold">Atanan Mağaza</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 font-semibold">Son Giriş</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const roleInfo = getRoleInfo(u.role);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span className="text-base">{roleInfo.icon}</span>
                          {u.fullName}
                          {currentUser && u.id === currentUser.id && (
                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                              Siz
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">@{u.username}</td>
                      <td className="px-4 py-3">
                        <Badge color={roleInfo.color}>{roleInfo.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {u.storeName ? (
                          <span className="inline-flex items-center gap-1">
                            🏬 {u.storeName}
                          </span>
                        ) : u.role === "admin" ? (
                          <span className="text-slate-400">Tüm mağazalar</span>
                        ) : (
                          <span className="text-rose-500">⚠ Mağaza atanmamış</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={u.active === 1 ? "green" : "gray"}>
                          {u.active === 1 ? "Aktif" : "Pasif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString("tr-TR")
                          : "Hiç giriş yapmadı"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                          >
                            Düzenle
                          </button>
                          {currentUser && u.id !== currentUser.id && (
                            <button
                              onClick={() => remove(u.id)}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                            >
                              Sil
                            </button>
                          )}
                        </div>
                      </td>
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
        title={editId ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Oluştur"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kullanıcı Adı" required={!editId}>
              <input
                className={inputClass}
                disabled={!!editId}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </Field>

            <Field label="Ad Soyad" required>
              <input
                className={inputClass}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Field>
          </div>

          <Field label={editId ? "Yeni Şifre (Boş bırakılırsa değişmez)" : "Şifre"} required={!editId}>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>

          <Field label="Rol / Yetki Grubu">
            <select
              className={inputClass}
              disabled={!!(currentUser && editId === currentUser.id)}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value, storeId: e.target.value === "admin" ? "" : form.storeId })}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.icon} {r.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {getRoleInfo(form.role).desc}
            </p>
          </Field>

          {form.role !== "admin" && (
            <Field label="Atanan Mağaza" required>
              <select
                className={inputClass}
                value={form.storeId}
                onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              >
                <option value="">-- Mağaza Seçin --</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.city ? `(${s.city})` : ""}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hesap Durumu">
              <select
                className={inputClass}
                disabled={!!(currentUser && editId === currentUser.id)}
                value={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.value })}
              >
                <option value="1">Aktif</option>
                <option value="0">Pasif</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
