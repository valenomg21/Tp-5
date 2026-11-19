import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Row, Stack } from "@/components/layout/primitives";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { FacturaDetallePanel } from "@/components/ventas/factura-detalle-panel";
import { Button } from "@/components/ui/button";
import { parsearIdNumerico } from "@/lib/api-handler";
import { normalizeError } from "@/lib/errors";
import { obtenerUsuarioActual } from "@/lib/session";
import { obtenerFacturaPorId } from "@/services/facturas.service";

export default async function FacturaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  const { id } = await params;

  let factura: Awaited<ReturnType<typeof obtenerFacturaPorId>> | null = null;
  let errorMsg: string | null = null;

  try {
    const facturaId = parsearIdNumerico(id);
    factura = await obtenerFacturaPorId(usuario, facturaId);
  } catch (error) {
    errorMsg = normalizeError(error).message;
  }

  if (errorMsg || !factura) {
    return (
      <Stack gap="lg">
        <PageHeader title="Detalle de factura" />
        <ErrorState
          title="No se pudo cargar la factura"
          message={errorMsg ?? "El comprobante solicitado no existe."}
          action={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/ventas" />}
            >
              Volver a facturas
            </Button>
          }
        />
      </Stack>
    );
  }

  const appName =
    process.env.NEXT_PUBLIC_APP_NAME ?? "Sistema de Gestión Comercial";

  return (
    <Stack gap="lg">
      <Row justify="start" className="no-print">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/ventas" />}
        >
          <ArrowLeft className="size-4" />
          Volver a facturas
        </Button>
      </Row>

      <FacturaDetallePanel
        factura={factura}
        appName={appName}
        esAdmin={usuario.rol === "admin"}
      />
    </Stack>
  );
}
