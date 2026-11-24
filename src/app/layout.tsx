import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "PokéDeck TCG";

export const metadata: Metadata = {
  title: appName,
  description: "Sistema de gestión comercial para tienda de Pokémon TCG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
