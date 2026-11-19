"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Pencil,
  Power,
  PowerOff,
  UserPlus,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { editarClienteAction } from "@/actions/clientes.actions";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import { ClientesFiltros } from "@/components/clientes/clientes-filtros";
import { ReciboPagoDialog } from "@/components/clientes/recibo-pago-dialog";
import { RegistrarPagoDialog } from "@/components/clientes/registrar-pago-dialog";
import { Row, Stack, Text } from "@/components/layout/primitives";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatearMoneda } from "@/lib/format";
import type { ClientePublico } from "@/services/clientes.service";
import type { PagoReciboPublico } from "@/services/pagos.service";

export function ClientesTablaPanel({
  clientes,
  page,
  pageSize,
  total,
  qInicial,
  ordenInicial,
  activoInicial,
}: {
  clientes: ClientePublico[];
  page: number;
  pageSize: number;
  total: number;
  qInicial: string;
  ordenInicial: "nombre" | "saldo";
  activoInicial: "true" | "false" | "todos";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<ClientePublico | null>(
    null
  );
  const [clienteBaja, setClienteBaja] = useState<ClientePublico | null>(null);
  const [clientePago, setClientePago] = useState<ClientePublico | null>(null);
  const [reciboEmitido, setReciboEmitido] = useState<PagoReciboPublico | null>(
    null
  );

  function confirmarCambioActivo() {
    if (!clienteBaja) return;
    const objetivo = clienteBaja;

    startTransition(async () => {
      const res = await editarClienteAction(objetivo.id, {
        activo: !objetivo.activo,
      });
      setClienteBaja(null);

      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }

      toast.success(
        objetivo.activo
          ? `Cliente ${objetivo.nombre} dado de baja.`
          : `Cliente ${objetivo.nombre} reactivado.`
      );
      router.refresh();
    });
  }

  return (
    <Stack gap="md">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <Row justify="between" align="center" wrap gap="sm">
            <div className="min-w-0 flex-1">
              <ClientesFiltros
                qInicial={qInicial}
                ordenInicial={ordenInicial}
                activoInicial={activoInicial}
              />
            </div>

            <Button
              type="button"
              onClick={() => {
                setClienteEditar(null);
                setFormOpen(true);
              }}
            >
              <UserPlus className="size-4" />
              Nuevo cliente
            </Button>
          </Row>

          {clientes.length === 0 ? (
            <EmptyState
              title="No hay clientes para mostrar"
              description="Probá ajustar la búsqueda o registrá un nuevo cliente."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Cuenta corriente</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Row gap="xs" align="center" wrap>
                        <Link
                          href={`/clientes/${c.id}`}
                          className="font-medium hover:underline"
                        >
                          {c.nombre}
                        </Link>
                        {!c.activo ? <StatusBadge variant="inactivo" /> : null}
                      </Row>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.tipoDoc} {c.nroDoc}
                    </TableCell>
                    <TableCell>
                      <Stack gap="xs">
                        {c.telefono ? (
                          <Text variant="small" className="text-foreground">
                            {c.telefono}
                          </Text>
                        ) : null}
                        {c.email ? <Text variant="small">{c.email}</Text> : null}
                        {!c.telefono && !c.email ? (
                          <Text variant="small">—</Text>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {c.cuentaCorriente ? (
                        <Stack gap="xs">
                          <Text variant="small" className="font-medium text-foreground">
                            Habilitada
                          </Text>
                          <Text variant="small">
                            {c.limiteCredito !== null
                              ? `Límite: ${formatearMoneda(c.limiteCredito)}`
                              : "Sin límite"}
                          </Text>
                        </Stack>
                      ) : (
                        <Text variant="small">No habilitada</Text>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Stack gap="xs" className="items-end">
                        <Text variant="mono" className="font-semibold">
                          {formatearMoneda(c.saldo)}
                        </Text>
                        {c.saldo > 0 ? (
                          <StatusBadge variant="deuda" />
                        ) : (
                          <StatusBadge variant="al_dia" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell className="text-right">
                      <Row justify="end" gap="xs">
                        <Button
                          variant="outline"
                          size="xs"
                          nativeButton={false}
                          render={<Link href={`/clientes/${c.id}`} />}
                        >
                          <Eye className="size-3.5" />
                          Ficha
                        </Button>
                        {c.cuentaCorriente && c.activo && c.saldo > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => setClientePago(c)}
                          >
                            <Wallet className="size-3.5" />
                            Pagar
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setClienteEditar(c);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant={c.activo ? "destructive" : "secondary"}
                          size="xs"
                          onClick={() => setClienteBaja(c)}
                        >
                          {c.activo ? (
                            <>
                              <PowerOff className="size-3.5" />
                              Baja
                            </>
                          ) : (
                            <>
                              <Power className="size-3.5" />
                              Activar
                            </>
                          )}
                        </Button>
                      </Row>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {total > 0 ? (
            <Pagination page={page} pageSize={pageSize} total={total} />
          ) : null}
        </CardContent>
      </Card>

      {formOpen ? (
        <ClienteFormDialog
          key={clienteEditar?.id ?? "nuevo"}
          open={formOpen}
          onOpenChange={setFormOpen}
          clienteEditar={clienteEditar}
        />
      ) : null}

      {clientePago ? (
        <RegistrarPagoDialog
          key={`pago-${clientePago.id}`}
          open
          onOpenChange={(open) => {
            if (!open) setClientePago(null);
          }}
          cliente={clientePago}
          onPagoRegistrado={(recibo) => setReciboEmitido(recibo)}
        />
      ) : null}

      <ReciboPagoDialog
        recibo={reciboEmitido}
        onClose={() => setReciboEmitido(null)}
      />

      <ConfirmDialog
        open={clienteBaja !== null}
        onOpenChange={(open) => {
          if (!open) setClienteBaja(null);
        }}
        title={
          clienteBaja?.activo ? "Dar de baja el cliente" : "Reactivar cliente"
        }
        description={
          clienteBaja?.activo
            ? `¿Seguro que querés dar de baja a ${clienteBaja.nombre}? No podrá operar hasta ser reactivado.`
            : `¿Querés reactivar a ${clienteBaja?.nombre ?? ""}?`
        }
        confirmLabel={clienteBaja?.activo ? "Dar de baja" : "Reactivar"}
        variant={clienteBaja?.activo ? "destructive" : "default"}
        isPending={isPending}
        onConfirm={confirmarCambioActivo}
      />
    </Stack>
  );
}
