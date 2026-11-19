import { redirect } from "next/navigation";
import { Stack } from "@/components/layout/primitives";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { VentasNav } from "@/components/ventas/ventas-nav";
import { VentasTablaPanel } from "@/components/ventas/ventas-tabla";
import { normalizeError } from "@/lib/errors";
import { obtenerUsuarioActual } from "@/lib/session";
import { listarClientes } from "@/services/clientes.service";
import {
  listarFacturas,
  listarVendedoresParaFiltro,
} from "@/services/facturas.service";

function tomarPrimerParam(
  valor: string | string[] | undefined
): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function VentasPage({
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
  const desde = tomarPrimerParam(sp.desde) ?? "";
  const hasta = tomarPrimerParam(sp.hasta) ?? "";
  const forma = tomarPrimerParam(sp.forma) ?? "";
  const estado = tomarPrimerParam(sp.estado) ?? "";
  const clienteId = tomarPrimerParam(sp.clienteId) ?? "";
  const vendedorId = tomarPrimerParam(sp.vendedorId) ?? "";
  const page = tomarPrimerParam(sp.page) ?? "1";

  let datos: {
    facturasRes: Awaited<ReturnType<typeof listarFacturas>>;
    clientesRes: Awaited<ReturnType<typeof listarClientes>>;
    vendedores: Awaited<ReturnType<typeof listarVendedoresParaFiltro>>;
  } | null = null;
  let errorMsg: string | null = null;

  try {
    const [facturasRes, clientesRes, vendedores] = await Promise.all([
      listarFacturas(usuario, {
        q,
        desde: desde || undefined,
        hasta: hasta || undefined,
        forma: forma || undefined,
        estado: estado || undefined,
        clienteId: clienteId || undefined,
        vendedorId: vendedorId || undefined,
        page,
        pageSize: 20,
      }),
      listarClientes(usuario, { activo: "todos", page: 1, pageSize: 100 }),
      listarVendedoresParaFiltro(usuario),
    ]);
    datos = { facturasRes, clientesRes, vendedores };
  } catch (error) {
    errorMsg = normalizeError(error).message;
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title="Ventas y facturación"
        description="Listado de comprobantes emitidos y anulados."
      />

      <VentasNav tabActiva="facturas" />

      {errorMsg || !datos ? (
        <ErrorState message={errorMsg ?? "No se pudieron cargar las facturas."} />
      ) : (
        <VentasTablaPanel
          facturas={datos.facturasRes.data}
          page={datos.facturasRes.page}
          pageSize={datos.facturasRes.pageSize}
          total={datos.facturasRes.total}
          totalEmitido={datos.facturasRes.totalEmitido}
          qInicial={q}
          desdeInicial={desde}
          hastaInicial={hasta}
          formaInicial={forma || "todas"}
          estadoInicial={estado || "todos"}
          clienteIdInicial={clienteId}
          vendedorIdInicial={vendedorId}
          clientes={datos.clientesRes.data}
          vendedores={datos.vendedores}
        />
      )}
    </Stack>
  );
}
