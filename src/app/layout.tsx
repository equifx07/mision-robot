import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

// Tipografía redondeada del mundo "Encastre" (se descarga en el build y se sirve desde la app)
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", display: "swap" });

export const metadata: Metadata = {
  title: "Misión Robot",
  description: "Evaluación de Pensamiento Computacional para 6.º grado (EPC-6)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fredoka.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
