"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Filter,
  Pencil,
  Power,
  PowerOff,
  Receipt,
  User,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { editarClienteAction } from "@/actions/clientes.actions";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import { ReciboPagoDialog } from "@/components/clientes/recibo-pago-dialog";
import { RegistrarPagoDialog } from "@/components/clientes/registrar-pago-dialog";
import { Grid, Heading, Row, Stack, Text } from "@/components/layout/primitives";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatearFechaHora,
  formatearFormaPago,
  formatearMoneda,
} from "@/lib/format";
import type {
  ClienteDetallePublico,
  CuentaCorrienteResultado,
} from "@/services/clientes.service";
import type { PagoReciboPublico } from "@/services/pagos.service";

export function ClienteFichaPanel({
  cliente,
  cuenta,
  tabActiva,
  desdeInicial,
  hastaInicial,
}: {
  cliente: ClienteDetallePublico;
  cuenta: CuentaCorrienteResultado;
  tabActiva: "resumen" | "cuenta";
  desdeInicial: string;
  hastaInicial: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [editOpen, setEditOpen] = useState(false);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reciboActivo, setReciboActivo] = useState<PagoReciboPublico | null>(
    null
  );
  const [cargandoReciboId, setCargandoReciboId] = useState<number | null>(null);

  const [desde, setDesde] = useState(desdeInicial);
  const [hasta, setHasta] = useState(hastaInicial);

  function confirmarCambioEstado() {
    startTransition(async () => {
      const res = await editarClienteAction(cliente.id, {
        activo: !cliente.activo,
      });
      setConfirmOpen(false);

      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }

      toast.success(
        cliente.activo ? "Cliente dado de baja." : "Cliente reactivado."
      );
      router.refresh();
    });
  }

  function filtrarCuenta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "cuenta");
    if (desde) params.set("desde", desde);
    else params.delete("desde");
    if (hasta) params.set("hasta", hasta);
    else params.delete("hasta");
    router.push(`${pathname}?${params.toString()}`);
  }

  async function abrirReciboPorId(pagoId: number) {
    setCargandoReciboId(pagoId);
    try {
      const res = await fetch(`/api/pagos/${pagoId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "No se pudo cargar el recibo.");
        return;
      }
      setReciboActivo(data as PagoReciboPublico);
    } catch {
      toast.error("Error de conexión al cargar el recibo.");
    } finally {
      setCargandoReciboId(null);
    }
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title={cliente.nombre}
        description={`${cliente.tipoDoc} ${cliente.nroDoc}${cliente.domicilio ? ` · ${cliente.domicilio}` : ""}`}
        actions={
          <Row gap="sm" wrap align="center">
            <StatusBadge variant={cliente.activo ? "activo" : "inactivo"} />
            <StatusBadge variant={cliente.saldo > 0 ? "deuda" : "al_dia"} />

            {cliente.cuentaCorriente && cliente.activo && cliente.saldo > 0 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setPagoOpen(true)}
              >
                <Wallet className="size-4" />
                Registrar pago
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" />
              Editar
            </Button>

            <Button
              type="button"
              variant={cliente.activo ? "destructive" : "secondary"}
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              {cliente.activo ? (
                <>
                  <PowerOff className="size-4" />
                  Dar de baja
                </>
              ) : (
                <>
                  <Power className="size-4" />
                  Reactivar
                </>
              )}
            </Button>
          </Row>
        }
      />

      <Row gap="xs" wrap className="border-b border-border pb-2">
        <Link
          href={`/clientes/${cliente.id}`}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            tabActiva === "resumen"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <User className="size-4" />
          <span>Resumen</span>
        </Link>
        <Link
          href={`/clientes/${cliente.id}?tab=cuenta`}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            tabActiva === "cuenta"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <FileText className="size-4" />
          <span>Cuenta corriente</span>
        </Link>
      </Row>

      {tabActiva === "resumen" ? (
        <Stack gap="lg">
          <Grid cols={3} gap="md">
            <Card>
              <CardHeader>
                <CardTitle>Saldo actual</CardTitle>
              </CardHeader>
              <CardContent>
                <Text variant="mono" className="text-2xl font-semibold">
                  {formatearMoneda(cliente.saldo)}
                </Text>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cuenta corriente</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="xs">
                  <Text className="font-medium">
                    {cliente.cuentaCorriente ? "Habilitada" : "No habilitada"}
                  </Text>
                  {cliente.cuentaCorriente ? (
                    <Text variant="small">
                      {cliente.limiteCredito !== null
                        ? `Límite: ${formatearMoneda(cliente.limiteCredito)} · Disponible: ${formatearMoneda(cliente.disponible ?? 0)}`
                        : "Sin límite de crédito"}
                    </Text>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos de contacto</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="xs">
                  <Text variant="small" className="text-foreground">
                    Tel: {cliente.telefono ?? "—"}
                  </Text>
                  <Text variant="small">
                    Email: {cliente.email ?? "—"}
                  </Text>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Stack gap="sm">
            <Heading level={2}>Últimas facturas</Heading>
            {cliente.ultimasFacturas.length === 0 ? (
              <EmptyState
                title="Sin facturas registradas"
                description="Este cliente todavía no tiene comprobantes emitidos."
              />
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Forma de pago</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cliente.ultimasFacturas.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-mono text-xs font-semibold">
                            {f.numeroFormateado}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums text-muted-foreground">
                            {formatearFechaHora(f.fecha)}
                          </TableCell>
                          <TableCell>{formatearFormaPago(f.formaPago)}</TableCell>
                          <TableCell>
                            <StatusBadge variant={f.estado} />
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold tabular-nums">
                            {formatearMoneda(f.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Stack>
      ) : (
        <Card>
          <CardContent className="space-y-4 pt-4">
            <Row justify="between" align="center" wrap gap="sm">
              <form onSubmit={filtrarCuenta}>
                <Row gap="sm" wrap align="center">
                  <Input
                    type="date"
                    aria-label="Desde fecha"
                    className="w-38"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                  />
                  <Input
                    type="date"
                    aria-label="Hasta fecha"
                    className="w-38"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    <Filter className="size-4" />
                    Filtrar
                  </Button>
                  {desdeInicial || hastaInicial ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDesde("");
                        setHasta("");
                        router.push(`${pathname}?tab=cuenta`);
                      }}
                    >
                      <X className="size-4" />
                      Limpiar
                    </Button>
                  ) : null}
                </Row>
              </form>

              <Row gap="sm" align="center">
                <Text variant="muted">Saldo actual:</Text>
                <Text variant="mono" className="text-lg font-semibold">
                  {formatearMoneda(cuenta.saldo)}
                </Text>
              </Row>
            </Row>

            {cuenta.movimientos.length === 0 && cuenta.saldoAnterior === 0 ? (
              <EmptyState
                title="Sin movimientos en cuenta corriente"
                description="No hay débitos ni créditos registrados para el período seleccionado."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Comprobante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {desdeInicial ? (
                    <TableRow className="bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">
                        Anterior
                      </TableCell>
                      <TableCell className="font-medium">
                        Saldo anterior acumulado
                      </TableCell>
                      <TableCell>—</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        —
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        —
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">
                        {formatearMoneda(cuenta.saldoAnterior)}
                      </TableCell>
                      <TableCell className="text-right">—</TableCell>
                    </TableRow>
                  ) : null}

                  {cuenta.movimientos.map((m, idx) => (
                    <TableRow key={`${m.fecha}-${m.pagoId ?? m.facturaId ?? idx}`}>
                      <TableCell className="text-xs whitespace-nowrap tabular-nums text-muted-foreground">
                        {formatearFechaHora(m.fecha)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.descripcion}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            m.tipo === "debito"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                          )}
                        >
                          {m.tipo === "debito" ? "Débito" : "Crédito"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {m.tipo === "debito" ? formatearMoneda(m.importe) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-emerald-700">
                        {m.tipo === "credito"
                          ? formatearMoneda(m.importe)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">
                        {formatearMoneda(m.saldo)}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.pagoId !== null ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={cargandoReciboId === m.pagoId}
                            onClick={() => abrirReciboPorId(m.pagoId!)}
                          >
                            <Receipt className="size-3.5" />
                            {cargandoReciboId === m.pagoId
                              ? "Cargando..."
                              : "Recibo"}
                          </Button>
                        ) : (
                          <Text variant="small" as="span">
                            —
                          </Text>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {editOpen ? (
        <ClienteFormDialog
          key={`edit-${cliente.id}`}
          open={editOpen}
          onOpenChange={setEditOpen}
          clienteEditar={cliente}
        />
      ) : null}

      {pagoOpen ? (
        <RegistrarPagoDialog
          key={`pago-${cliente.id}`}
          open={pagoOpen}
          onOpenChange={setPagoOpen}
          cliente={cliente}
          onPagoRegistrado={(recibo) => setReciboActivo(recibo)}
        />
      ) : null}

      <ReciboPagoDialog
        recibo={reciboActivo}
        onClose={() => setReciboActivo(null)}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          cliente.activo ? "Dar de baja el cliente" : "Reactivar cliente"
        }
        description={
          cliente.activo
            ? `¿Seguro que querés dar de baja a ${cliente.nombre}?`
            : `¿Querés reactivar a ${cliente.nombre}?`
        }
        confirmLabel={cliente.activo ? "Dar de baja" : "Reactivar"}
        variant={cliente.activo ? "destructive" : "default"}
        isPending={isPending}
        onConfirm={confirmarCambioEstado}
      />
    </Stack>
  );
}
