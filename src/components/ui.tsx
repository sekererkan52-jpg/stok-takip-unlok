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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
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

export function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="text-base font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{desc}</p>
    </div>
  );
}
