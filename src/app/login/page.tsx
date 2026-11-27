import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Stack, Text } from "@/components/layout/primitives";
import { obtenerUsuarioActual } from "@/lib/session";

export const dynamic = "force-dynamic";

const INTEGRANTES = [
  { nombre: "Valentin Jose Menendez", legajo: "54273" },
  { nombre: "Jazmin Vargas Mopty", legajo: "63355" },
  { nombre: "Hernan Medina Oliva", legajo: "63408" },
] as const;

export default async function LoginPage() {
  const usuario = await obtenerUsuarioActual();
  if (usuario) {
    redirect("/");
  }

  const appName =
    process.env.NEXT_PUBLIC_APP_NAME ?? "PokéDeck TCG";

  return (
    <Stack
      as="main"
      gap="lg"
      className="tcg-login-bg relative min-h-screen items-center justify-center p-4 sm:p-6"
    >
      <LoginForm appName={appName} />

      <aside
        aria-label="Integrantes"
        className="w-full max-w-md rounded-xl border border-border/80 bg-card/85 px-4 py-3 shadow-xs backdrop-blur-sm lg:fixed lg:right-5 lg:bottom-5 lg:w-auto lg:min-w-64"
      >
        <Text
          variant="label"
          className="mb-2 border-b border-border/60 pb-1.5"
        >
          Integrantes - Grupo 5
        </Text>
        <ul className="space-y-1.5">
          {INTEGRANTES.map((integrante) => (
            <li
              key={integrante.legajo}
              className="flex items-baseline justify-between gap-5 text-xs"
            >
              <span className="font-medium text-foreground/90">
                {integrante.nombre}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                Leg. {integrante.legajo}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </Stack>
  );
}
