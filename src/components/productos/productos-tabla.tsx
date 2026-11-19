"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Eye,
  Pencil,
  Plus,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";
import { editarProductoAction } from "@/actions/productos.actions";
import { Row, Stack, Text } from "@/components/layout/primitives";
import { MovimientoStockDialog } from "@/components/productos/movimiento-stock-dialog";
import { ProductoFormDialog } from "@/components/productos/producto-form-dialog";
import { ProductosFiltros } from "@/components/productos/productos-filtros";
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
import type { CategoriaPublica } from "@/services/categorias.service";
import type { ProductoPublico } from "@/services/productos.service";

export function ProductosTablaPanel({
  productos,
  categorias,
  page,
  pageSize,
  total,
  qInicial,
  categoriaIdInicial,
  bajoMinimoInicial,
  activoInicial,
  esAdmin,
}: {
  productos: ProductoPublico[];
  categorias: CategoriaPublica[];
  page: number;
  pageSize: number;
  total: number;
  qInicial: string;
  categoriaIdInicial: string;
  bajoMinimoInicial: boolean;
  activoInicial: "true" | "false" | "todos";
  esAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<ProductoPublico | null>(
    null
  );

  const [movimientoEstado, setMovimientoEstado] = useState<{
    producto: ProductoPublico;
    tipo: "ingreso" | "egreso";
  } | null>(null);

  const [productoBaja, setProductoBaja] = useState<ProductoPublico | null>(
    null
  );

  function confirmarCambioActivo() {
    if (!productoBaja) return;
    const objetivo = productoBaja;

    startTransition(async () => {
      const res = await editarProductoAction(objetivo.id, {
        activo: !objetivo.activo,
      });
      setProductoBaja(null);

      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }

      toast.success(
        objetivo.activo
          ? `Producto ${objetivo.codigo} dado de baja.`
          : `Producto ${objetivo.codigo} reactivado.`
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
              <ProductosFiltros
                qInicial={qInicial}
                categoriaIdInicial={categoriaIdInicial}
                bajoMinimoInicial={bajoMinimoInicial}
                activoInicial={activoInicial}
                categorias={categorias}
                esAdmin={esAdmin}
              />
            </div>

            {esAdmin ? (
              <Button
                type="button"
                onClick={() => {
                  setProductoEditar(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Nuevo producto
              </Button>
            ) : null}
          </Row>

          {productos.length === 0 ? (
            <EmptyState
              title="No hay productos para mostrar"
              description="Probá ajustar los filtros de búsqueda o cargá un producto nuevo."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Existencia</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((p) => {
                  const stockBadge =
                    p.existencia === 0
                      ? "sin_stock"
                      : p.bajoMinimo
                        ? "bajo_minimo"
                        : "stock_ok";

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        <Link
                          href={`/productos/${p.id}`}
                          className="hover:underline"
                        >
                          {p.codigo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Row gap="xs" align="center" wrap>
                          <Link
                            href={`/productos/${p.id}`}
                            className="font-medium hover:underline"
                          >
                            {p.descripcion}
                          </Link>
                          {!p.activo ? (
                            <StatusBadge variant="inactivo" />
                          ) : null}
                        </Row>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.categoria.nombre}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatearMoneda(p.precio)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Stack gap="xs" className="items-end">
                          <Text variant="mono" className="font-semibold">
                            {p.existencia}
                          </Text>
                          <Text variant="small" className="tabular-nums">
                            Mín: {p.stockMinimo}
                          </Text>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={stockBadge} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Row justify="end" gap="xs">
                          <Button
                            variant="outline"
                            size="xs"
                            nativeButton={false}
                            render={<Link href={`/productos/${p.id}`} />}
                          >
                            <Eye className="size-3.5" />
                            Ficha
                          </Button>

                          {esAdmin ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() =>
                                  setMovimientoEstado({
                                    producto: p,
                                    tipo: "ingreso",
                                  })
                                }
                              >
                                <ArrowUpCircle className="size-3.5" />
                                Ingreso
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() =>
                                  setMovimientoEstado({
                                    producto: p,
                                    tipo: "egreso",
                                  })
                                }
                              >
                                <ArrowDownCircle className="size-3.5" />
                                Egreso
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  setProductoEditar(p);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil className="size-3.5" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant={p.activo ? "destructive" : "secondary"}
                                size="xs"
                                onClick={() => setProductoBaja(p)}
                              >
                                {p.activo ? (
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
                            </>
                          ) : null}
                        </Row>
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

      {formOpen ? (
        <ProductoFormDialog
          key={productoEditar?.id ?? "nuevo"}
          open={formOpen}
          onOpenChange={setFormOpen}
          productoEditar={productoEditar}
          categorias={categorias}
        />
      ) : null}

      {movimientoEstado ? (
        <MovimientoStockDialog
          key={`${movimientoEstado.producto.id}-${movimientoEstado.tipo}`}
          open
          onOpenChange={(open) => {
            if (!open) setMovimientoEstado(null);
          }}
          productoFijo={movimientoEstado.producto}
          tipoInicial={movimientoEstado.tipo}
        />
      ) : null}

      <ConfirmDialog
        open={productoBaja !== null}
        onOpenChange={(open) => {
          if (!open) setProductoBaja(null);
        }}
        title={
          productoBaja?.activo ? "Dar de baja el producto" : "Reactivar producto"
        }
        description={
          productoBaja?.activo
            ? `El producto ${productoBaja.codigo} (${productoBaja.descripcion}) dejará de ofrecerse en ventas, conservando su historial.`
            : `¿Querés volver a activar el producto ${productoBaja?.codigo ?? ""}?`
        }
        confirmLabel={productoBaja?.activo ? "Dar de baja" : "Reactivar"}
        variant={productoBaja?.activo ? "destructive" : "default"}
        isPending={isPending}
        onConfirm={confirmarCambioActivo}
      />
    </Stack>
  );
}
