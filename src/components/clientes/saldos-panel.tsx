"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Search, Wallet, X } from "lucide-react";
import { ReciboPagoDialog } from "@/components/clientes/recibo-pago-dialog";
import { RegistrarPagoDialog } from "@/components/clientes/registrar-pago-dialog";
import { Grid, Row, Stack, Text } from "@/components/layout/primitives";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
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
import { formatearMoneda } from "@/lib/format";
import type { ClientePublico } from "@/services/clientes.service";
import type { PagoReciboPublico } from "@/services/pagos.service";

export function SaldosPanel({
  deudores,
  totalAdeudado,
  total,
  page,
  pageSize,
  qInicial,
}: {
  deudores: ClientePublico[];
  totalAdeudado: number;
  total: number;
  page: number;
  pageSize: number;
  qInicial: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [busqueda, setBusqueda] = useState(qInicial);
  const [clientePago, setClientePago] = useState<ClientePublico | null>(null);
  const [reciboEmitido, setReciboEmitido] = useState<PagoReciboPublico | null>(
    null
  );

  function handleBuscar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (busqueda.trim()) params.set("q", busqueda.trim());
    else params.delete("q");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Stack gap="lg">
      <Grid cols={2} gap="md">
        <Card>
          <CardHeader>
            <CardTitle>Total adeudado en cuentas corrientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="mono" className="text-2xl font-semibold">
              {formatearMoneda(totalAdeudado)}
            </Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes con saldo pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="mono" className="text-2xl font-semibold">
              {total}
            </Text>
          </CardContent>
        </Card>
      </Grid>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <form onSubmit={handleBuscar}>
            <Row gap="sm" wrap align="center">
              <div className="relative min-w-56 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar deudor por nombre o documento..."
                  className="pl-8"
                  aria-label="Buscar clientes con saldo"
                />
              </div>

              <Button type="submit" variant="secondary" size="sm">
                Buscar
              </Button>

              {qInicial ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBusqueda("");
                    router.push(pathname);
                  }}
                >
                  <X className="size-4" />
                  Limpiar
                </Button>
              ) : null}
            </Row>
          </form>

          {deudores.length === 0 ? (
            <EmptyState
              title="No hay clientes con saldo adeudado"
              description="Todas las cuentas corrientes están al día para el filtro actual."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Límite</TableHead>
                  <TableHead className="text-right">Saldo adeudado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deudores.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/clientes/${c.id}?tab=cuenta`}
                        className="hover:underline"
                      >
                        {c.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.tipoDoc} {c.nroDoc}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.limiteCredito !== null
                        ? formatearMoneda(c.limiteCredito)
                        : "Sin límite"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {formatearMoneda(c.saldo)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Row justify="end" gap="xs">
                        <Button
                          variant="outline"
                          size="xs"
                          nativeButton={false}
                          render={<Link href={`/clientes/${c.id}?tab=cuenta`} />}
                        >
                          <Eye className="size-3.5" />
                          Ver cuenta
                        </Button>
                        {c.cuentaCorriente && c.activo ? (
                          <Button
                            type="button"
                            size="xs"
                            onClick={() => setClientePago(c)}
                          >
                            <Wallet className="size-3.5" />
                            Registrar pago
                          </Button>
                        ) : null}
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

      {clientePago ? (
        <RegistrarPagoDialog
          key={`pago-saldo-${clientePago.id}`}
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
    </Stack>
  );
}
