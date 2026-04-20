import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinica",
  description: "Sistema de gestion clinica",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
