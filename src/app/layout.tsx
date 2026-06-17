import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Lokemo — Cours en ligne, paiement Mobile Money",
  description:
    "Achetez des cours en ligne au Cameroun et payez en toute simplicité avec Orange Money ou MTN Mobile Money.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-cream text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
