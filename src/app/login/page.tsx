import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Stack } from "@/components/layout/primitives";
import { obtenerUsuarioActual } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const usuario = await obtenerUsuarioActual();
  if (usuario) {
    redirect("/");
  }

  const appName =
    process.env.NEXT_PUBLIC_APP_NAME ?? "Sistema de Gestión Comercial";

  return (
    <Stack
      as="main"
      className="min-h-screen items-center justify-center bg-background p-4 sm:p-6"
    >
      <LoginForm appName={appName} />
    </Stack>
  );
}
