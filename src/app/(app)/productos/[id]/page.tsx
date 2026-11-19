import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Grid, Heading, Row, Stack, Text } from "@/components/layout/primitives";
import { MovimientosPanel } from "@/components/productos/movimientos-tabla";
import { ProductoFichaAcciones } from "@/components/productos/producto-ficha-acciones";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsearIdNumerico } from "@/lib/api-handler";
import { normalizeError } from "@/lib/errors";
import { formatearMoneda } from "@/lib/format";
import { obtenerUsuarioActual } from "@/lib/session";
import { listarCategorias } from "@/services/categorias.service";
import { obtenerProductoPorId } from "@/services/productos.service";
import { listarMovimientosDeProducto } from "@/services/stock.service";

function tomarPrimerParam(
  valor: string | string[] | undefined
): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ProductoDetallePage({
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
  const esAdmin = usuario.rol === "admin";
  const tipoStr = tomarPrimerParam(sp.tipo) ?? "";
  const desdeStr = tomarPrimerParam(sp.desde) ?? "";
  const hastaStr = tomarPrimerParam(sp.hasta) ?? "";
  const pageStr = tomarPrimerParam(sp.page) ?? "1";

  let datos: {
    producto: Awaited<ReturnType<typeof obtenerProductoPorId>>;
    movimientosRes: Awaited<ReturnType<typeof listarMovimientosDeProducto>>;
    categorias: Awaited<ReturnType<typeof listarCategorias>>;
  } | null = null;
  let errorMsg: string | null = null;

  try {
    const productoId = parsearIdNumerico(id);
    const [producto, movimientosRes, categorias] = await Promise.all([
      obtenerProductoPorId(usuario, productoId),
      listarMovimientosDeProducto(usuario, productoId, {
        tipo: tipoStr || undefined,
        desde: desdeStr || undefined,
        hasta: hastaStr || undefined,
        page: pageStr,
        pageSize: 20,
      }),
      esAdmin ? listarCategorias(usuario) : Promise.resolve([]),
    ]);
    datos = { producto, movimientosRes, categorias };
  } catch (error) {
    errorMsg = normalizeError(error).message;
  }

  if (errorMsg || !datos) {
    return (
      <Stack gap="lg">
        <PageHeader title="Ficha de producto" />
        <ErrorState
          title="No se pudo cargar el producto"
          message={errorMsg ?? "El producto solicitado no existe."}
          action={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/productos" />}
            >
              Volver al catálogo
            </Button>
          }
        />
      </Stack>
    );
  }

  const { producto, movimientosRes, categorias } = datos;

  const stockBadge =
    producto.existencia === 0
      ? "sin_stock"
      : producto.bajoMinimo
        ? "bajo_minimo"
        : "stock_ok";

  return (
    <Stack gap="lg">
      <Row justify="start">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/productos" />}
        >
          <ArrowLeft className="size-4" />
          Volver al catálogo
        </Button>
      </Row>

      <PageHeader
        title={producto.descripcion}
        description={`Código ${producto.codigo} · Categoría ${producto.categoria.nombre}`}
        actions={
          <Row gap="sm" wrap align="center">
            <StatusBadge variant={producto.activo ? "activo" : "inactivo"} />
            <StatusBadge variant={stockBadge} />
            {esAdmin ? (
              <ProductoFichaAcciones
                producto={producto}
                categorias={categorias}
              />
            ) : null}
          </Row>
        }
      />

      <Grid cols={3} gap="md">
        <Card>
          <CardHeader>
            <CardTitle>Precio de venta</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="mono" className="text-2xl font-semibold">
              {formatearMoneda(producto.precio)}
            </Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existencia actual</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="mono" className="text-2xl font-semibold">
              {producto.existencia} u.
            </Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock mínimo</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="mono" className="text-2xl font-semibold">
              {producto.stockMinimo} u.
            </Text>
          </CardContent>
        </Card>
      </Grid>

      <Stack gap="sm">
        <Heading level={2}>Historial de movimientos</Heading>
        <MovimientosPanel
          movimientos={movimientosRes.data}
          page={movimientosRes.page}
          pageSize={movimientosRes.pageSize}
          total={movimientosRes.total}
          tipoInicial={tipoStr || "todos"}
          desdeInicial={desdeStr}
          hastaInicial={hastaStr}
          mostrarColumnaProducto={false}
          esAdmin={esAdmin}
        />
      </Stack>
    </Stack>
  );
}
