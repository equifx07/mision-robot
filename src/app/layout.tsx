import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Misión Robot",
  description: "Evaluación de Pensamiento Computacional para 6.º grado (EPC-6)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
