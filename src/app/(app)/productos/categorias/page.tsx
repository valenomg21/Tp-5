import Link from "next/link";
import { redirect } from "next/navigation";
import { Stack } from "@/components/layout/primitives";
import { CategoriasPanel } from "@/components/productos/categorias-panel";
import { ProductosNav } from "@/components/productos/productos-nav";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { obtenerUsuarioActual } from "@/lib/session";
import { listarCategoriasConConteo } from "@/services/categorias.service";

export default async function CategoriasPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  if (usuario.rol !== "admin") {
    return (
      <Stack gap="lg">
        <PageHeader title="Categorías" />
        <ErrorState
          title="Sin permiso"
          message="Solo los administradores pueden gestionar las categorías de productos."
          action={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/productos" />}
            >
              Volver al catálogo
            </Button>
          }
        />
      </Stack>
    );
  }

  const categorias = await listarCategoriasConConteo(usuario);

  return (
    <Stack gap="lg">
      <PageHeader
        title="Productos y existencias"
        description="Administración de categorías del catálogo."
      />

      <ProductosNav tabActiva="categorias" esAdmin />

      <CategoriasPanel categorias={categorias} />
    </Stack>
  );
}
