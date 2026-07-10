"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Kullanıcı adı ve şifre gereklidir.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = "/";
      } else {
        setError(data.error || "Kullanıcı adı veya şifre hatalı.");
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUsername.trim()) {
      setResetError("Kullanıcı adı gereklidir.");
      return;
    }
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: resetUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetSuccess("Şifre sıfırlama talebiniz yöneticiye iletildi.");
      } else {
        setResetError(data.error || "Talebiniz gönderilemedi.");
      }
    } catch {
      setResetError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left side - Hero Image (hidden on mobile) */}
      <div className="relative hidden w-1/2 items-center justify-center bg-slate-900 lg:flex overflow-hidden border-r border-slate-900">
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" 
          style={{ backgroundImage: "url('/login_hero.jpg')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-transparent z-10" />
        <div className="relative z-20 max-w-md px-8 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 text-2xl mb-6">
            🏪
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">
            Stok & Süreç Yönetiminde Yeni Nesil Deneyim
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Gelişmiş analitik araçlar, anlık envanter takibi ve dinamik mağaza yönetimi ile işinizi kolaylaştırın.
          </p>
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Tüm Sistemler Aktif</span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/10 text-2xl lg:hidden">
              🏪
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
              Stok Takip Paneli
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Yönetim sistemine erişmek için giriş yapın
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-rose-500/10 p-4 border border-rose-500/20 text-sm text-rose-400">
                <span className="text-base select-none">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Kullanıcı Adı
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Şifre
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(true);
                      setResetSuccess("");
                      setResetError("");
                      setResetUsername("");
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                  >
                    Şifremi Unuttum
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Giriş Yapılıyor...</span>
                  </div>
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </form>
          </div>

          <div className="text-center text-xs text-slate-500 lg:text-left">
            Lokal Mağaza & Envanter Yönetim Paneli
          </div>
        </div>
      </div>

      {/* Forgot Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-left">
            <h3 className="text-lg font-bold text-white mb-2">Şifremi Unuttum</h3>
            <p className="text-xs text-slate-400 mb-4">
              Kullanıcı adınızı yazarak şifre sıfırlama talebi gönderin. Talep yönetici paneline iletilecektir.
            </p>

            {resetError && (
              <div className="mb-4 rounded-lg bg-rose-500/10 p-3 border border-rose-500/20 text-xs text-rose-400">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="mb-4 rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20 text-xs text-emerald-400">
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  required
                  disabled={resetLoading}
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  placeholder="Kullanıcı adınız..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading ? "Gönderiliyor..." : "Talep Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}