import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mağaza Yönetim Paneli",
  description: "Mağaza bilgileri, envanter ve süreç yönetim paneli.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
