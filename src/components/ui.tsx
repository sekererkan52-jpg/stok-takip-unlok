"use client";

import { ReactNode } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl glass-modal shadow-2xl animate-scale-up border border-white/50">
        <div className="flex items-center justify-between border-b border-slate-100/50 px-6 py-4 bg-white/40 backdrop-blur-sm sticky top-0 z-10">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400";

export function Badge({
  children,
  color,
}: {
  children: ReactNode;
  color: "green" | "gray" | "amber" | "blue" | "red" | "purple";
}) {
  const colors: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    gray: "bg-slate-100 text-slate-600 ring-slate-500/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
    red: "bg-rose-50 text-rose-700 ring-rose-600/20",
    purple: "bg-violet-50 text-violet-700 ring-violet-600/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[color]}`}
    >
      {children}
    </span>
  );
}

const StoreIllustration = () => (
  <div className="mb-4 flex justify-center">
    <svg className="h-24 w-24 text-indigo-500/10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="currentColor" />
      <path d="M30 42H70V70C70 71.1 69.1 72 68 72H32C30.9 72 30 71.1 30 70V42Z" stroke="rgb(79, 70, 229)" strokeWidth="2.5" strokeLinejoin="round" fill="white" />
      <path d="M26 42L50 25L74 42H26Z" stroke="rgb(79, 70, 229)" strokeWidth="2.5" strokeLinejoin="round" fill="rgb(224, 231, 255)" />
      <rect x="42" y="54" width="16" height="18" rx="2" stroke="rgb(79, 70, 229)" strokeWidth="2" fill="white" />
      <circle cx="50" cy="34" r="3" fill="rgb(79, 70, 229)" />
    </svg>
  </div>
);

const InventoryIllustration = () => (
  <div className="mb-4 flex justify-center">
    <svg className="h-24 w-24 text-emerald-500/10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="currentColor" />
      <path d="M50 22L78 35L50 48L22 35L50 22Z" stroke="rgb(16, 185, 129)" strokeWidth="2.5" strokeLinejoin="round" fill="rgb(209, 250, 229)" />
      <path d="M22 35V65L50 78V48L22 35Z" stroke="rgb(16, 185, 129)" strokeWidth="2.5" strokeLinejoin="round" fill="white" />
      <path d="M78 35V65L50 78V48L78 35Z" stroke="rgb(16, 185, 129)" strokeWidth="2.5" strokeLinejoin="round" fill="rgb(240, 253, 244)" />
      <path d="M35 41.5L50 48.5L65 41.5" stroke="rgb(16, 185, 129)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  </div>
);

const ProcessIllustration = () => (
  <div className="mb-4 flex justify-center">
    <svg className="h-24 w-24 text-amber-500/10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="currentColor" />
      <rect x="32" y="28" width="36" height="46" rx="4" stroke="rgb(245, 158, 11)" strokeWidth="2.5" fill="white" />
      <line x1="40" y1="40" x2="60" y2="40" stroke="rgb(245, 158, 11)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="50" x2="60" y2="50" stroke="rgb(245, 158, 11)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="60" x2="52" y2="60" stroke="rgb(245, 158, 11)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="37" cy="28" r="3" fill="rgb(245, 158, 11)" />
      <circle cx="63" cy="28" r="3" fill="rgb(245, 158, 11)" />
    </svg>
  </div>
);

const SearchIllustration = () => (
  <div className="mb-4 flex justify-center">
    <svg className="h-24 w-24 text-slate-400/10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="currentColor" />
      <circle cx="45" cy="45" r="14" stroke="rgb(148, 163, 184)" strokeWidth="2.5" fill="white" />
      <line x1="55" y1="55" x2="70" y2="70" stroke="rgb(148, 163, 184)" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  </div>
);

export function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  const renderIllustration = () => {
    if (title === "Sonuç bulunamadı") {
      return <SearchIllustration />;
    }
    
    switch (icon) {
      case "🏬":
      case "stores":
        return <StoreIllustration />;
      case "📦":
      case "inventory":
        return <InventoryIllustration />;
      case "🗂️":
      case "processes":
        return <ProcessIllustration />;
      default:
        return <div className="mb-3 text-4xl">{icon}</div>;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
      {renderIllustration()}
      <p className="text-base font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{desc}</p>
    </div>
  );
}
