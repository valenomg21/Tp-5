import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClienteFichaPanel } from "@/components/clientes/cliente-ficha-panel";
import { Row, Stack } from "@/components/layout/primitives";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { parsearIdNumerico } from "@/lib/api-handler";
import { normalizeError } from "@/lib/errors";
import { obtenerUsuarioActual } from "@/lib/session";
import {
  obtenerClientePorId,
  obtenerCuentaCorrienteCliente,
} from "@/services/clientes.service";

function tomarPrimerParam(
  valor: string | string[] | undefined
): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ClienteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  const { id } = await params;
  const sp = await searchParams;
  const tab = tomarPrimerParam(sp.tab) === "cuenta" ? "cuenta" : "resumen";
  const desdeStr = tomarPrimerParam(sp.desde) ?? "";
  const hastaStr = tomarPrimerParam(sp.hasta) ?? "";

  let datos: {
    cliente: Awaited<ReturnType<typeof obtenerClientePorId>>;
    cuenta: Awaited<ReturnType<typeof obtenerCuentaCorrienteCliente>>;
  } | null = null;
  let errorMsg: string | null = null;

  try {
    const clienteId = parsearIdNumerico(id);
    const [cliente, cuenta] = await Promise.all([
      obtenerClientePorId(usuario, clienteId),
      obtenerCuentaCorrienteCliente(usuario, clienteId, {
        desde: desdeStr || undefined,
        hasta: hastaStr || undefined,
      }),
    ]);
    datos = { cliente, cuenta };
  } catch (error) {
    errorMsg = normalizeError(error).message;
  }

  if (errorMsg || !datos) {
    return (
      <Stack gap="lg">
        <PageHeader title="Ficha de cliente" />
        <ErrorState
          title="No se pudo cargar el cliente"
          message={errorMsg ?? "El cliente solicitado no existe."}
          action={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/clientes" />}
            >
              Volver al listado
            </Button>
          }
        />
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Row justify="start">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/clientes" />}
        >
          <ArrowLeft className="size-4" />
          Volver al listado
        </Button>
      </Row>

      <ClienteFichaPanel
        cliente={datos.cliente}
        cuenta={datos.cuenta}
        tabActiva={tab}
        desdeInicial={desdeStr}
        hastaInicial={hastaStr}
      />
    </Stack>
  );
}
