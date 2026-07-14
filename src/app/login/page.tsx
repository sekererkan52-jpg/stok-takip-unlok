"use client";

import { useState, useEffect } from "react";
import { translations } from "@/lib/translations";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Preferred language state
  const [lang, setLang] = useState<"TR" | "EN">("TR");
  useEffect(() => {
    const saved = localStorage.getItem("preferred_lang") as "TR" | "EN";
    if (saved) setLang(saved);
  }, []);

  const changeLanguage = (newLang: "TR" | "EN") => {
    setLang(newLang);
    localStorage.setItem("preferred_lang", newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || key;
  };

  // Password reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(lang === "TR" ? "Kullanıcı adı ve şifre gereklidir." : "Username and password are required.");
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
        setError(data.error || (lang === "TR" ? "Kullanıcı adı veya şifre hatalı." : "Incorrect username or password."));
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
      <div className="relative hidden w-1/2 items-center justify-center bg-slate-900 lg:flex overflow-hidden border-r border-white/5">
        <div 
          className="absolute inset-0 z-0 opacity-20 bg-cover bg-center" 
          style={{ backgroundImage: "url('/login_hero.jpg')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/90 to-transparent z-10" />
        
        {/* Decorative Orb */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl bg-glow-orb" />
        
        <div className="relative z-20 max-w-md px-8 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 text-2xl mb-6">
            🏪
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4 uppercase">
            {t("loginHeroTitle")}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
            {t("loginHeroDesc")}
          </p>
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t("allSystemsActive")}</span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="relative flex w-full items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8 bg-slate-950 overflow-hidden">
        {/* Floating Language Switcher */}
        <div className="absolute top-4 right-4 z-20">
          <select
            value={lang}
            onChange={(e) => changeLanguage(e.target.value as "TR" | "EN")}
            className="rounded-xl border border-slate-800 bg-slate-900/80 shadow-sm px-3 py-2 text-xs font-bold text-slate-350 outline-none transition hover:bg-slate-850 cursor-pointer text-white"
          >
            <option value="TR">🇹🇷 TR</option>
            <option value="EN">🇺🇸 EN</option>
          </select>
        </div>

        {/* Glow Orbs in Background */}
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl bg-glow-orb select-none pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-600/5 blur-3xl bg-glow-orb select-none pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/10 text-2xl lg:hidden">
              🏪
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white uppercase">
              {t("loginTitle")}
            </h2>
            <p className="mt-2 text-sm text-slate-450 font-medium">
              {t("loginDesc")}
            </p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
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
                  {t("username")}
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
                  {t("password")}
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
                    {lang === "TR" ? "Şifremi Unuttum" : "Forgot Password?"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
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
                    <span>{t("loggingIn")}</span>
                  </div>
                ) : (
                  t("loginButton")
                )}
              </button>
            </form>
          </div>

          <div className="text-center text-xs text-slate-500 lg:text-left">
            {lang === "TR" ? "Lokal Mağaza & Envanter Yönetim Paneli" : "Local Store & Inventory Management Dashboard"}
          </div>
        </div>
      </div>

      {/* Forgot Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-left">
            <h3 className="text-lg font-bold text-white mb-2">{lang === "TR" ? "Şifremi Unuttum" : "Forgot Password"}</h3>
            <p className="text-xs text-slate-400 mb-4">
              {lang === "TR" 
                ? "Kullanıcı adınızı yazarak şifre sıfırlama talebi gönderin. Talep yönetici paneline iletilecektir."
                : "Enter your username to submit a password reset request. It will be sent to the admin panel."}
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
                  {t("username")}
                </label>
                <input
                  type="text"
                  required
                  disabled={resetLoading}
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  placeholder={lang === "TR" ? "Kullanıcı adınız..." : "Your username..."}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
                >
                  {lang === "TR" ? "Kapat" : "Close"}
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading 
                    ? (lang === "TR" ? "Gönderiliyor..." : "Sending...") 
                    : (lang === "TR" ? "Talep Gönder" : "Send Request")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}