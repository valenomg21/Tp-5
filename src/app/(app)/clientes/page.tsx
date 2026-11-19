import { redirect } from "next/navigation";
import { ClientesNav } from "@/components/clientes/clientes-nav";
import { ClientesTablaPanel } from "@/components/clientes/clientes-tabla";
import { Stack } from "@/components/layout/primitives";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { normalizeError } from "@/lib/errors";
import { obtenerUsuarioActual } from "@/lib/session";
import { listarClientes } from "@/services/clientes.service";

function tomarPrimerParam(
  valor: string | string[] | undefined
): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  const sp = await searchParams;
  const q = tomarPrimerParam(sp.q) ?? "";
  const ordenParam = tomarPrimerParam(sp.orden);
  const orden: "nombre" | "saldo" = ordenParam === "saldo" ? "saldo" : "nombre";
  const activoParam = tomarPrimerParam(sp.activo);
  const activo: "true" | "false" | "todos" =
    activoParam === "false" || activoParam === "todos" ? activoParam : "true";
  const pageStr = tomarPrimerParam(sp.page) ?? "1";

  let resultado: Awaited<ReturnType<typeof listarClientes>> | null = null;
  let errorMsg: string | null = null;

  try {
    resultado = await listarClientes(usuario, {
      q,
      orden,
      activo,
      page: pageStr,
      pageSize: 20,
    });
  } catch (error) {
    errorMsg = normalizeError(error).message;
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title="Clientes y cuenta corriente"
        description="Listado de clientes, saldos pendientes y gestión de cuenta corriente."
      />

      <ClientesNav tabActiva="listado" />

      {errorMsg || !resultado ? (
        <ErrorState message={errorMsg ?? "No se pudieron cargar los clientes."} />
      ) : (
        <ClientesTablaPanel
          clientes={resultado.data}
          page={resultado.page}
          pageSize={resultado.pageSize}
          total={resultado.total}
          qInicial={q}
          ordenInicial={orden}
          activoInicial={activo}
        />
      )}
    </Stack>
  );
}
