import type { Metadata } from "next";
import "./globals.css";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Sistema de Gestión Comercial";

export const metadata: Metadata = {
  title: appName,
  description: "Sistema de gestión comercial para comercio minorista",
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
      </body>
    </html>
  );
}
