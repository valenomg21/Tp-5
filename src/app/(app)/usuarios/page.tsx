import Link from "next/link";
import { redirect } from "next/navigation";
import { Stack } from "@/components/layout/primitives";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UsuariosPanel } from "@/components/usuarios/usuarios-tabla";
import { obtenerUsuarioActual } from "@/lib/session";
import { listarUsuarios } from "@/services/usuarios.service";

function tomarPrimerParam(
  valor: string | string[] | undefined
): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  if (usuario.rol !== "admin") {
    return (
      <Stack gap="lg">
        <PageHeader title="Usuarios" />
        <ErrorState
          title="Sin permiso"
          message="Solo los administradores pueden acceder a la gestión de usuarios."
          action={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Volver al inicio
            </Button>
          }
        />
      </Stack>
    );
  }

  const sp = await searchParams;
  const q = tomarPrimerParam(sp.q) ?? "";
  const activoParam = tomarPrimerParam(sp.activo);
  const activo: "true" | "false" | "todos" =
    activoParam === "true" || activoParam === "false" ? activoParam : "todos";
  const pageParam = tomarPrimerParam(sp.page);
  const pageNumerico = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(pageNumerico) && pageNumerico >= 1 ? pageNumerico : 1;

  const resultado = await listarUsuarios(usuario, {
    q,
    activo,
    page,
    pageSize: 20,
  });

  return (
    <Stack gap="lg">
      <PageHeader
        title="Usuarios"
        description="Administración de cuentas, roles, estado de acceso y restablecimiento de contraseñas."
      />

      <UsuariosPanel
        usuarios={resultado.data}
        page={resultado.page}
        pageSize={resultado.pageSize}
        total={resultado.total}
        qInicial={q}
        activoInicial={activo}
        usuarioActualId={usuario.id}
      />
    </Stack>
  );
}
