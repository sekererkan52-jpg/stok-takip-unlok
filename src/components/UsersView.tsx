"use client";

import { useEffect, useState } from "react";
import { Store, User } from "@/lib/types";
import { Modal, Field, inputClass, Badge, EmptyState } from "./ui";
import { translations } from "@/lib/translations";

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
  lang = "TR",
}: {
  users: User[];
  currentUser: { id: number; role: string } | null;
  reload: () => void;
  lang?: "TR" | "EN";
}) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  const t = (key: string): string => {
    return translations[lang]?.[key] || key;
  };

  const ROLES = [
    {
      value: "admin",
      label: lang === "TR" ? "Yönetici (Admin)" : "Administrator (Admin)",
      desc: lang === "TR" ? "Tüm verilere tam erişim. Kullanıcı yönetimi dahil." : "Full access to all data, including user management.",
      color: "purple" as const,
      icon: "👑",
    },
    {
      value: "manager",
      label: lang === "TR" ? "Mağaza Yöneticisi" : "Store Manager",
      desc: lang === "TR" ? "Atandığı mağazanın tüm verilerini görür ve düzenleyebilir." : "View and edit all data for the assigned store.",
      color: "blue" as const,
      icon: "🏬",
    },
    {
      value: "staff",
      label: lang === "TR" ? "Personel" : "Staff",
      desc: lang === "TR" ? "Atandığı mağazada yalnızca süreçleri görüntüleyebilir." : "Only view processes for the assigned store.",
      color: "green" as const,
      icon: "👤",
    },
  ];

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
      role: (u.role === "admin" || u.role === "manager" || u.role === "staff") ? u.role : "staff",
      active: String(u.active),
      storeId: u.storeId ? String(u.storeId) : "",
    });
    setEditId(u.id);
    setError("");
    setOpen(true);
  }

  async function save() {
    if (!editId && !form.username.trim()) {
      setError(lang === "TR" ? "Kullanıcı adı zorunludur." : "Username is required.");
      return;
    }
    if (!form.fullName.trim()) {
      setError(lang === "TR" ? "Ad Soyad zorunludur." : "Full name is required.");
      return;
    }
    if (!editId && !form.password.trim()) {
      setError(lang === "TR" ? "Şifre zorunludur." : "Password is required.");
      return;
    }
    if (form.role !== "admin" && !form.storeId) {
      setError(lang === "TR" ? "Admin olmayan kullanıcılara mağaza atanmalıdır." : "Non-admin users must be assigned to a store.");
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
    if (currentUser && id === currentUser.id) {
      alert(lang === "TR" ? "Kendi hesabınızı silemezsiniz." : "You cannot delete your own account.");
      return;
    }
    if (!confirm(t("userDeleteConfirm"))) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || (lang === "TR" ? "Silme işlemi başarısız." : "Delete failed."));
      }
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : (lang === "TR" ? "Bir hata oluştu." : "An error occurred."));
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
          <h2 className="text-2xl font-bold text-slate-900">{t("usersTitle")}</h2>
          <p className="text-sm text-slate-500">{t("usersDesc")}</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer"
        >
          {t("newUser")}
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
          placeholder={t("searchUserPlaceholder")}
          className={inputClass + " max-w-md"}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title={users.length === 0 ? t("noUsersText") : t("noResult")}
          desc={
            users.length === 0
              ? t("noUsersDesc")
              : t("noResultUserDesc")
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("fullNameField")}</th>
                  <th className="px-4 py-3 font-semibold">{t("usernameField")}</th>
                  <th className="px-4 py-3 font-semibold">{t("roleField")}</th>
                  <th className="px-4 py-3 font-semibold">{t("assignedStoreField")}</th>
                  <th className="px-4 py-3 font-semibold">{t("statusField")}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "TR" ? "Son Giriş" : "Last Login"}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("actions")}</th>
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
                              {lang === "TR" ? "Siz" : "You"}
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
                          <span className="text-slate-400">{lang === "TR" ? "Tüm mağazalar" : "All stores"}</span>
                        ) : (
                          <span className="text-rose-500">⚠ {t("noAssignedStore")}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={u.active === 1 ? "green" : "gray"}>
                          {u.active === 1 ? t("active") : t("passive")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString(lang === "TR" ? "tr-TR" : "en-US")
                          : (lang === "TR" ? "Hiç giriş yapmadı" : "Never logged in")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 cursor-pointer"
                          >
                            {t("edit")}
                          </button>
                          {currentUser && u.id !== currentUser.id && (
                            <button
                              onClick={() => remove(u.id)}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                            >
                              {t("delete")}
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
        title={editId ? t("editUserTitle") : t("newUserTitle")}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("usernameField")} required={!editId}>
              <input
                className={inputClass}
                disabled={!!editId}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </Field>

            <Field label={t("fullNameField")} required>
              <input
                className={inputClass}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Field>
          </div>

          <Field label={editId ? (lang === "TR" ? "Yeni Şifre (Boş bırakılırsa değişmez)" : "New Password (leave blank to keep current)") : t("passwordField")} required={!editId}>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>

          <Field label={t("roleField")}>
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
            {currentUser && editId === currentUser.id && (
              <p className="mt-1 text-xs text-amber-600 font-medium">
                ⚠️ {lang === "TR" 
                  ? "Kendi hesabınızın rolünü değiştiremezsiniz." 
                  : "You cannot change the role of your own account."}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              {getRoleInfo(form.role).desc}
            </p>
          </Field>

          {form.role !== "admin" && (
            <Field label={t("assignedStoreField")} required>
              <select
                className={inputClass}
                value={form.storeId}
                onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              >
                <option value="">-- {t("storeSelectPlaceholder")} --</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.city ? `(${s.city})` : ""}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("statusField")}>
              <select
                className={inputClass}
                disabled={!!(currentUser && editId === currentUser.id)}
                value={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.value })}
              >
                <option value="1">{t("active")}</option>
                <option value="0">{t("passive")}</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
              {saving ? t("savingUser") : t("save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
