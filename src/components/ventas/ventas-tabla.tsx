import Link from "next/link";
import { Eye, PlusCircle } from "lucide-react";
import { Grid, Row, Stack, Text } from "@/components/layout/primitives";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { VentasFiltros } from "@/components/ventas/ventas-filtros";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { ClientePublico } from "@/services/clientes.service";
import type { FacturaResumenPublica } from "@/services/facturas.service";

export function VentasTablaPanel({
  facturas,
  page,
  pageSize,
  total,
  totalEmitido,
  qInicial,
  desdeInicial,
  hastaInicial,
  formaInicial,
  estadoInicial,
  clienteIdInicial,
  vendedorIdInicial,
  clientes,
  vendedores,
}: {
  facturas: FacturaResumenPublica[];
  page: number;
  pageSize: number;
  total: number;
  totalEmitido: number;
  qInicial: string;
  desdeInicial: string;
  hastaInicial: string;
  formaInicial: string;
  estadoInicial: string;
  clienteIdInicial: string;
  vendedorIdInicial: string;
  clientes: ClientePublico[];
  vendedores: Array<{ id: number; nombre: string }>;
}) {
  return (
    <Stack gap="lg">
      <Grid cols={2} gap="md">
        <Card>
          <CardHeader>
            <CardTitle>Total facturado emitido (según filtro)</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="mono" className="text-2xl font-semibold">
              {formatearMoneda(totalEmitido)}
            </Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comprobantes encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Row justify="between" align="center">
              <Text variant="mono" className="text-2xl font-semibold">
                {total}
              </Text>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/ventas/nueva" />}
              >
                <PlusCircle className="size-4" />
                Nueva venta
              </Button>
            </Row>
          </CardContent>
        </Card>
      </Grid>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <VentasFiltros
            qInicial={qInicial}
            desdeInicial={desdeInicial}
            hastaInicial={hastaInicial}
            formaInicial={formaInicial}
            estadoInicial={estadoInicial}
            clienteIdInicial={clienteIdInicial}
            vendedorIdInicial={vendedorIdInicial}
            clientes={clientes}
            vendedores={vendedores}
          />

          {facturas.length === 0 ? (
            <EmptyState
              title="No hay facturas para mostrar"
              description="Probá cambiar los filtros o registrá una nueva venta en el mostrador."
              action={
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/ventas/nueva" />}
                >
                  <PlusCircle className="size-4" />
                  Nueva venta
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Forma de pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      <Link href={`/ventas/${f.id}`} className="hover:underline">
                        {f.numeroFormateado}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap tabular-nums text-muted-foreground">
                      {formatearFechaHora(f.fecha)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {f.cliente ? (
                        <Link
                          href={`/clientes/${f.cliente.id}`}
                          className="hover:underline"
                        >
                          {f.cliente.nombre}
                        </Link>
                      ) : (
                        <Text variant="muted" as="span">
                          Consumidor final
                        </Text>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.vendedor.nombre}
                    </TableCell>
                    <TableCell>{formatearFormaPago(f.formaPago)}</TableCell>
                    <TableCell>
                      <StatusBadge variant={f.estado} />
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {formatearMoneda(f.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        nativeButton={false}
                        render={<Link href={`/ventas/${f.id}`} />}
                      >
                        <Eye className="size-3.5" />
                        Comprobante
                      </Button>
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
    </Stack>
  );
}
