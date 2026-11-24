"use client";

import { Printer } from "lucide-react";
import { Heading, Row, Stack, Text } from "@/components/layout/primitives";
import { PokeballIcon } from "@/components/shared/pokeball-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  formatearFechaHora,
  formatearMedioPago,
  formatearMoneda,
} from "@/lib/format";
import type { PagoReciboPublico } from "@/services/pagos.service";

export function ReciboPagoDialog({
  recibo,
  onClose,
}: {
  recibo: PagoReciboPublico | null;
  onClose: () => void;
}) {
  const appName =
    process.env.NEXT_PUBLIC_APP_NAME ?? "PokéDeck TCG";

  return (
    <Dialog
      open={recibo !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md print:border-0 print:shadow-none print:ring-0">
        {recibo ? (
          <>
            <div className="printable-area space-y-4">
              <DialogHeader>
                <Row justify="between" align="start" gap="sm">
                  <Stack gap="xs">
                    <Row gap="xs" align="center">
                      <PokeballIcon className="size-4" />
                      <Text variant="label">{appName}</Text>
                    </Row>
                    <DialogTitle>Recibo de pago</DialogTitle>
                    <DialogDescription>
                      Comprobante interno de cancelación en cuenta corriente.
                    </DialogDescription>
                  </Stack>
                  <Stack gap="xs" className="text-right">
                    <Text variant="mono" className="text-base font-semibold">
                      {recibo.numeroRecibo}
                    </Text>
                    <Text variant="small" className="tabular-nums">
                      {formatearFechaHora(recibo.fecha)}
                    </Text>
                  </Stack>
                </Row>
              </DialogHeader>

              <Separator />

              <Stack gap="sm">
                <Row justify="between" align="baseline" gap="md">
                  <Text variant="muted">Cliente</Text>
                  <Text className="text-right font-medium">
                    {recibo.cliente.nombre}
                  </Text>
                </Row>
                <Row justify="between" align="baseline" gap="md">
                  <Text variant="muted">Documento</Text>
                  <Text variant="mono" className="text-right">
                    {recibo.cliente.tipoDoc} {recibo.cliente.nroDoc}
                  </Text>
                </Row>
                {recibo.cliente.domicilio ? (
                  <Row justify="between" align="baseline" gap="md">
                    <Text variant="muted">Domicilio</Text>
                    <Text className="text-right">{recibo.cliente.domicilio}</Text>
                  </Row>
                ) : null}
                <Row justify="between" align="baseline" gap="md">
                  <Text variant="muted">Medio de pago</Text>
                  <Text className="text-right">
                    {formatearMedioPago(recibo.medio)}
                  </Text>
                </Row>
                {recibo.observacion ? (
                  <Row justify="between" align="baseline" gap="md">
                    <Text variant="muted">Observación</Text>
                    <Text className="max-w-xs text-right">
                      {recibo.observacion}
                    </Text>
                  </Row>
                ) : null}
                <Row justify="between" align="baseline" gap="md">
                  <Text variant="muted">Registrado por</Text>
                  <Text className="text-right">{recibo.usuario.nombre}</Text>
                </Row>
              </Stack>

              <Separator />

              <div className="rounded-lg border bg-muted/40 p-3">
                <Stack gap="sm">
                  <Row justify="between" align="center">
                    <Heading level={3}>Importe abonado</Heading>
                    <Text variant="mono" className="text-xl font-semibold">
                      {formatearMoneda(recibo.importe)}
                    </Text>
                  </Row>
                  <Row justify="between" align="center">
                    <Text variant="small">Saldo resultante del cliente</Text>
                    <Text variant="mono" className="font-semibold">
                      {formatearMoneda(recibo.saldoCliente)}
                    </Text>
                  </Row>
                </Stack>
              </div>
            </div>

            <DialogFooter className="no-print">
              <Button type="button" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button type="button" onClick={() => window.print()}>
                <Printer className="size-4" />
                Imprimir recibo
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
