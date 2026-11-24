"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, PlusCircle, Printer } from "lucide-react";
import { anularFacturaAction } from "@/actions/facturas.actions";
import { Grid, Heading, Row, Stack, Text } from "@/components/layout/primitives";
import { FormField } from "@/components/shared/form-field";
import { PokeballIcon } from "@/components/shared/pokeball-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/hooks/use-form-action";
import {
  formatearFechaHora,
  formatearFormaPago,
  formatearMoneda,
} from "@/lib/format";
import { anularFacturaSchema } from "@/lib/schemas/facturas";
import type { FacturaDetallePublica } from "@/services/facturas.service";

export function FacturaDetallePanel({
  factura,
  appName,
  esAdmin,
}: {
  factura: FacturaDetallePublica;
  appName: string;
  esAdmin: boolean;
}) {
  const router = useRouter();
  const [anularOpen, setAnularOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  const { submit, isPending, fieldErrors, formError, clearFieldError } =
    useFormAction({
      schema: anularFacturaSchema,
      action: (values) => anularFacturaAction(factura.id, values),
      successMessage: `Factura ${factura.numeroFormateado} anulada correctamente.`,
      onSuccess: () => {
        setAnularOpen(false);
        setMotivo("");
        router.refresh();
      },
    });

  function handleAnularSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ motivo });
  }

  return (
    <Stack gap="lg">
      <Row justify="between" align="center" wrap gap="sm" className="no-print">
        <Row gap="sm" align="center">
          <StatusBadge variant={factura.estado} />
          <Text variant="muted">
            Comprobante interno sin validez fiscal.
          </Text>
        </Row>

        <Row gap="sm" wrap>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            Imprimir comprobante
          </Button>

          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/ventas/nueva" />}
          >
            <PlusCircle className="size-4" />
            Nueva venta
          </Button>

          {esAdmin && factura.estado === "emitida" ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setAnularOpen(true)}
            >
              <Ban className="size-4" />
              Anular factura
            </Button>
          ) : null}
        </Row>
      </Row>

      <Card className="printable-area">
        <CardContent className="space-y-6 py-6">
          <Row justify="between" align="start" wrap gap="md">
            <Stack gap="xs">
              <Row gap="xs" align="center">
                <PokeballIcon className="size-4" />
                <Text variant="label">{appName}</Text>
              </Row>
              <Heading level={1}>Comprobante de venta</Heading>
              <Text variant="small">
                Documento interno no válido como factura fiscal ante ARCA.
              </Text>
            </Stack>

            <Stack gap="xs" className="sm:text-right">
              <Text variant="mono" className="text-xl font-semibold">
                {factura.numeroFormateado}
              </Text>
              <Text variant="small" className="tabular-nums">
                Fecha y hora: {formatearFechaHora(factura.fecha)}
              </Text>
              <Text variant="small">
                Vendedor: {factura.vendedor.nombre}
              </Text>
            </Stack>
          </Row>

          {factura.estado === "anulada" && factura.anulacion ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
              <Stack gap="xs">
                <Text className="font-semibold text-destructive">
                  FACTURA ANULADA
                </Text>
                <Text variant="small" className="text-foreground">
                  Anulada el {formatearFechaHora(factura.anulacion.fecha)} por{" "}
                  {factura.anulacion.usuario.nombre}. Motivo:{" "}
                  {factura.anulacion.motivo}
                </Text>
              </Stack>
            </div>
          ) : null}

          <Separator />

          <Grid cols={2} gap="md">
            <Stack gap="xs">
              <Text variant="label">Comprador</Text>
              {factura.cliente ? (
                <>
                  <Text className="font-semibold">{factura.cliente.nombre}</Text>
                  <Text variant="small">
                    {factura.cliente.tipoDoc} {factura.cliente.nroDoc}
                  </Text>
                  {factura.cliente.domicilio ? (
                    <Text variant="small">{factura.cliente.domicilio}</Text>
                  ) : null}
                </>
              ) : (
                <Text className="font-medium">Consumidor final</Text>
              )}
            </Stack>

            <Stack gap="xs" className="sm:text-right">
              <Text variant="label">Forma de pago</Text>
              <Text className="font-semibold">
                {formatearFormaPago(factura.pago.forma)}
              </Text>
              {factura.pago.forma === "contado" ? (
                <Text variant="small" className="tabular-nums">
                  Recibido: {formatearMoneda(factura.pago.montoRecibido)} · Vuelto:{" "}
                  {formatearMoneda(factura.pago.vuelto)}
                </Text>
              ) : factura.pago.forma === "tarjeta" ? (
                <Text variant="small">
                  {factura.pago.tarjeta.tipo === "debito"
                    ? "Débito"
                    : "Crédito"}{" "}
                  · {factura.pago.tarjeta.marca} · ****{" "}
                  {factura.pago.tarjeta.ultimos4}
                </Text>
              ) : (
                <Text variant="small">Imputado en cuenta corriente</Text>
              )}
            </Stack>
          </Grid>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factura.items.map((item) => (
                <TableRow key={item.productoId}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {item.codigo}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.descripcion}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {item.cantidad}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatearMoneda(item.precioUnitario)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold tabular-nums">
                    {formatearMoneda(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator />

          <Row justify="end" align="center" gap="lg">
            <Text variant="muted" className="text-base">
              Total factura
            </Text>
            <Text variant="mono" className="text-2xl font-semibold">
              {formatearMoneda(factura.total)}
            </Text>
          </Row>
        </CardContent>
      </Card>

      <Dialog open={anularOpen} onOpenChange={setAnularOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Anular factura {factura.numeroFormateado}</DialogTitle>
            <DialogDescription>
              Esta acción es irreversible: reingresará el stock de todos los
              renglones y, si fue en cuenta corriente, registrará un crédito por
              el total.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAnularSubmit} noValidate>
            <Stack gap="md">
              <FormField
                id="anular-motivo"
                label="Motivo de anulación"
                required
                error={fieldErrors.motivo}
              >
                <Textarea
                  id="anular-motivo"
                  rows={3}
                  autoFocus
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.motivo)}
                  placeholder="Ej. Error en la carga de cantidades..."
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value);
                    clearFieldError("motivo");
                  }}
                />
              </FormField>

              {formError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                  <Text variant="small" className="font-medium text-destructive">
                    {formError}
                  </Text>
                </div>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setAnularOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={isPending}>
                  {isPending ? "Anulando..." : "Confirmar anulación"}
                </Button>
              </DialogFooter>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
