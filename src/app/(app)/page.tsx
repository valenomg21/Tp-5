import {
  AlertTriangle,
  ArrowRight,
  PackageCheck,
  Plus,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Grid,
  Row,
  Stack,
  Text,
} from "@/components/layout/primitives";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableroGraficos } from "@/components/tablero/tablero-graficos";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizeError } from "@/lib/errors";
import { formatearMoneda } from "@/lib/format";
import { obtenerUsuarioActual } from "@/lib/session";
import {
  listarProductos,
  type ListadoProductosResultado,
} from "@/services/productos.service";
import {
  obtenerTablero,
  type TableroMetricas,
} from "@/services/tablero.service";

export const dynamic = "force-dynamic";

export default async function TableroPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  let metricas: TableroMetricas | null = null;
  let bajoMinimoListado: ListadoProductosResultado | null = null;
  let errorMensaje: string | null = null;

  try {
    const [tableroData, stockBajoData] = await Promise.all([
      obtenerTablero(usuario),
      listarProductos(usuario, {
        bajoMinimo: "true",
        activo: "true",
        page: 1,
        pageSize: 6,
      }),
    ]);
    metricas = tableroData;
    bajoMinimoListado = stockBajoData;
  } catch (error) {
    errorMensaje = normalizeError(error).message;
  }

  if (errorMensaje || !metricas) {
    return (
      <Stack gap="lg">
        <PageHeader
          title="Tablero"
          description="Resumen comercial diario, mensual y alertas operativas."
        />
        <ErrorState
          message={errorMensaje ?? "No se pudo cargar el tablero comercial."}
        />
      </Stack>
    );
  }

  const productosBajoMinimo = bajoMinimoListado?.data ?? [];

  return (
    <Stack gap="lg">
      <PageHeader
        title="Tablero"
        description="Resumen comercial diario, mensual y alertas operativas."
        actions={
          <Row gap="sm" wrap>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/ventas" />}
            >
              Ver ventas
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/ventas/nueva" />}
            >
              <Plus className="size-4" />
              Nueva venta
            </Button>
          </Row>
        }
      />

      <Grid cols={4} gap="md">
        <Card>
          <CardHeader className="pb-2">
            <Row justify="between" align="center">
              <Text variant="label">Ventas de hoy</Text>
              <Receipt className="size-4 text-muted-foreground" />
            </Row>
          </CardHeader>
          <CardContent>
            <Stack gap="xs">
              <Text
                as="div"
                className="font-mono text-2xl font-semibold tabular-nums text-foreground"
              >
                {formatearMoneda(metricas.hoy.importe)}
              </Text>
              <Text variant="small">
                {metricas.hoy.cantidad}{" "}
                {metricas.hoy.cantidad === 1
                  ? "factura emitida"
                  : "facturas emitidas"}
              </Text>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Row justify="between" align="center">
              <Text variant="label">Ventas del mes</Text>
              <TrendingUp className="size-4 text-muted-foreground" />
            </Row>
          </CardHeader>
          <CardContent>
            <Stack gap="xs">
              <Text
                as="div"
                className="font-mono text-2xl font-semibold tabular-nums text-foreground"
              >
                {formatearMoneda(metricas.mes.importe)}
              </Text>
              <Text variant="small">
                {metricas.mes.cantidad}{" "}
                {metricas.mes.cantidad === 1 ? "factura" : "facturas"} · Ticket
                prom. {formatearMoneda(metricas.mes.ticketPromedio)}
              </Text>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Row justify="between" align="center">
              <Text variant="label">Cuentas corrientes</Text>
              <Users className="size-4 text-muted-foreground" />
            </Row>
          </CardHeader>
          <CardContent>
            <Stack gap="xs">
              <Text
                as="div"
                className="font-mono text-2xl font-semibold tabular-nums text-foreground"
              >
                {formatearMoneda(metricas.cuentasCorrientes.totalAdeudado)}
              </Text>
              <Row justify="between" align="center" wrap gap="xs">
                <Text variant="small">
                  {metricas.cuentasCorrientes.clientesConSaldo}{" "}
                  {metricas.cuentasCorrientes.clientesConSaldo === 1
                    ? "cliente con saldo"
                    : "clientes con saldo"}
                </Text>
                <Link
                  href="/clientes/saldos"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Ver saldos
                  <ArrowRight className="size-3" />
                </Link>
              </Row>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Row justify="between" align="center">
              <Text variant="label">Bajo mínimo</Text>
              <AlertTriangle
                className={
                  metricas.bajoMinimo.cantidad > 0
                    ? "size-4 text-amber-600"
                    : "size-4 text-muted-foreground"
                }
              />
            </Row>
          </CardHeader>
          <CardContent>
            <Stack gap="xs">
              <Text
                as="div"
                className="font-mono text-2xl font-semibold tabular-nums text-foreground"
              >
                {metricas.bajoMinimo.cantidad}
              </Text>
              <Row justify="between" align="center" wrap gap="xs">
                <Text variant="small">
                  {metricas.bajoMinimo.cantidad === 1
                    ? "producto a reponer"
                    : "productos a reponer"}
                </Text>
                <Link
                  href="/productos?bajoMinimo=true"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Ver listado
                  <ArrowRight className="size-3" />
                </Link>
              </Row>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <TableroGraficos
        ventasDiarias={metricas.ventasDiarias}
        porFormaDePago={metricas.porFormaDePago}
      />

      <Grid cols={2} gap="lg">
        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos del mes</CardTitle>
            <CardDescription>
              Top 5 de artículos con mayor volumen de unidades facturadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricas.masVendidos.length === 0 ? (
              <EmptyState
                title="Sin ventas en el mes actual"
                description="Todavía no se emitieron facturas durante este mes."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricas.masVendidos.map((item) => (
                    <TableRow key={item.productoId}>
                      <TableCell>
                        <Stack gap="xs">
                          <Link
                            href={`/productos/${item.productoId}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {item.descripcion}
                          </Link>
                          <Text variant="small" className="font-mono">
                            {item.codigo}
                          </Text>
                        </Stack>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {item.unidades}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatearMoneda(item.importe)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Row justify="between" align="start" gap="sm" wrap>
              <Stack gap="xs">
                <CardTitle>Alertas de reposición</CardTitle>
                <CardDescription>
                  Productos activos por debajo de su stock mínimo configurado.
                </CardDescription>
              </Stack>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/productos?bajoMinimo=true" />}
              >
                Ver todos ({metricas.bajoMinimo.cantidad})
              </Button>
            </Row>
          </CardHeader>
          <CardContent>
            {productosBajoMinimo.length === 0 ? (
              <EmptyState
                icon={<PackageCheck className="size-5" />}
                title="Stock en niveles normales"
                description="No hay productos activos por debajo del stock mínimo."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosBajoMinimo.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell>
                        <Stack gap="xs">
                          <Link
                            href={`/productos/${producto.id}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {producto.descripcion}
                          </Link>
                          <Text variant="small" className="font-mono">
                            {producto.codigo}
                          </Text>
                        </Stack>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {producto.existencia} / {producto.stockMinimo}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          variant={
                            producto.existencia === 0
                              ? "sin_stock"
                              : "bajo_minimo"
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/productos/${producto.id}`} />}
                        >
                          Reponer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Stack>
  );
}
