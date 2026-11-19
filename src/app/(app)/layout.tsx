import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { obtenerUsuarioActual } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Barrera 2 (Sección 10.5): valida la sesión contra la BD antes de renderizar cualquier módulo.
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  const appName =
    process.env.NEXT_PUBLIC_APP_NAME ?? "Sistema de Gestión Comercial";

  return (
    <AppShell usuario={usuario} appName={appName}>
      {children}
    </AppShell>
  );
}
