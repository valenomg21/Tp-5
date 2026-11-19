"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "cn";
import { Row, Stack, Text } from "@/components/layout/primitives";
import { MovimientoStockDialog } from "@/components/productos/movimiento-stock-dialog";
import { MovimientosFiltros } from "@/components/productos/movimientos-filtros";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
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
import { formatearFechaHora } from "@/lib/format";
import type { ProductoPublico } from "@/services/productos.service";
import type {
  MovimientoStockPublico,
  TipoMovimientoStock,
} from "@/services/stock.service";

const ESTILOS_TIPO_MOV: Record<
  TipoMovimientoStock,
  { label: string; className: string }
> = {
  ingreso: {
    label: "Ingreso",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  egreso: {
    label: "Egreso",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  venta: {
    label: "Venta",
    className: "border-primary/20 bg-primary/10 text-primary",
  },
  anulacion: {
    label: "Anulación",
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
};

export function MovimientosPanel({
  movimientos,
  page,
  pageSize,
  total,
  productoIdInicial,
  tipoInicial,
  desdeInicial,
  hastaInicial,
  mostrarColumnaProducto = true,
  productosDisponibles,
  conservarTabExistencias = false,
  esAdmin,
}: {
  movimientos: MovimientoStockPublico[];
  page: number;
  pageSize: number;
  total: number;
  productoIdInicial?: string;
  tipoInicial: string;
  desdeInicial: string;
  hastaInicial: string;
  mostrarColumnaProducto?: boolean;
  productosDisponibles?: ProductoPublico[];
  conservarTabExistencias?: boolean;
  esAdmin: boolean;
}) {
  const [dialogTipo, setDialogTipo] = useState<"ingreso" | "egreso" | null>(
    null
  );

  return (
    <Stack gap="md">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <Row justify="between" align="center" wrap gap="sm">
            <div className="min-w-0 flex-1">
              <MovimientosFiltros
                productoIdInicial={productoIdInicial}
                tipoInicial={tipoInicial}
                desdeInicial={desdeInicial}
                hastaInicial={hastaInicial}
                productosDisponibles={productosDisponibles}
                conservarTabExistencias={conservarTabExistencias}
              />
            </div>

            {esAdmin && productosDisponibles && productosDisponibles.length > 0 ? (
              <Row gap="xs">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogTipo("ingreso")}
                >
                  <ArrowUpCircle className="size-4" />
                  Ingreso
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogTipo("egreso")}
                >
                  <ArrowDownCircle className="size-4" />
                  Egreso
                </Button>
              </Row>
            ) : null}
          </Row>

          {movimientos.length === 0 ? (
            <EmptyState
              title="Sin movimientos registrados"
              description="No hay movimientos de stock que coincidan con los filtros seleccionados."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  {mostrarColumnaProducto ? <TableHead>Producto</TableHead> : null}
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Resultante</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((m) => {
                  const tipoInfo = ESTILOS_TIPO_MOV[m.tipo];
                  const esPositivo = m.cantidad > 0;

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs whitespace-nowrap tabular-nums text-muted-foreground">
                        {formatearFechaHora(m.fecha)}
                      </TableCell>
                      {mostrarColumnaProducto ? (
                        <TableCell>
                          <Link
                            href={`/productos/${m.producto.id}`}
                            className="hover:underline"
                          >
                            <Stack gap="xs">
                              <Text variant="mono" className="text-xs font-semibold">
                                {m.producto.codigo}
                              </Text>
                              <Text variant="small" className="text-foreground">
                                {m.producto.descripcion}
                              </Text>
                            </Stack>
                          </Link>
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("font-medium", tipoInfo.className)}
                        >
                          {tipoInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono font-semibold tabular-nums",
                          esPositivo ? "text-emerald-700" : "text-destructive"
                        )}
                      >
                        {esPositivo ? `+${m.cantidad}` : m.cantidad}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {m.existenciaResultante}
                      </TableCell>
                      <TableCell>
                        <Stack gap="xs">
                          <Text className="text-sm">{m.motivo}</Text>
                          {m.observacion ? (
                            <Text variant="small">{m.observacion}</Text>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.usuario.nombre}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {m.referencia ? (
                          <Link
                            href={`/ventas/${m.referencia.facturaId}`}
                            className="text-foreground hover:underline"
                          >
                            Factura {m.referencia.numero}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {total > 0 ? (
            <Pagination page={page} pageSize={pageSize} total={total} />
          ) : null}
        </CardContent>
      </Card>

      {dialogTipo && productosDisponibles ? (
        <MovimientoStockDialog
          key={`global-${dialogTipo}`}
          open
          onOpenChange={(open) => {
            if (!open) setDialogTipo(null);
          }}
          productoFijo={null}
          productosDisponibles={productosDisponibles}
          tipoInicial={dialogTipo}
        />
      ) : null}
    </Stack>
  );
}
