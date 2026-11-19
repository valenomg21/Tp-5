import { redirect } from "next/navigation";
import { ClientesNav } from "@/components/clientes/clientes-nav";
import { SaldosPanel } from "@/components/clientes/saldos-panel";
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

export default async function SaldosClientesPage({
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
  const pageStr = tomarPrimerParam(sp.page) ?? "1";

  let resultado: Awaited<ReturnType<typeof listarClientes>> | null = null;
  let errorMsg: string | null = null;

  try {
    resultado = await listarClientes(usuario, {
      q,
      conDeuda: "true",
      orden: "saldo",
      activo: "true",
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
        description="Clientes con saldo adeudado ordenados de mayor a menor."
      />

      <ClientesNav tabActiva="saldos" />

      {errorMsg || !resultado ? (
        <ErrorState message={errorMsg ?? "No se pudieron cargar los saldos."} />
      ) : (
        <SaldosPanel
          deudores={resultado.data}
          totalAdeudado={resultado.totalAdeudado ?? 0}
          total={resultado.total}
          page={resultado.page}
          pageSize={resultado.pageSize}
          qInicial={q}
        />
      )}
    </Stack>
  );
}
