import { redirect } from "next/navigation";
import { Stack } from "@/components/layout/primitives";
import { MovimientosPanel } from "@/components/productos/movimientos-tabla";
import { ProductosNav } from "@/components/productos/productos-nav";
import { ProductosTablaPanel } from "@/components/productos/productos-tabla";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { normalizeError } from "@/lib/errors";
import { obtenerUsuarioActual } from "@/lib/session";
import { listarCategorias } from "@/services/categorias.service";
import { listarProductos } from "@/services/productos.service";
import { listarMovimientosStock } from "@/services/stock.service";

function tomarPrimerParam(
  valor: string | string[] | undefined
): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  const sp = await searchParams;
  const tab =
    tomarPrimerParam(sp.tab) === "existencias" ? "existencias" : "catalogo";
  const esAdmin = usuario.rol === "admin";

  if (tab === "existencias") {
    const productoIdStr = tomarPrimerParam(sp.productoId) ?? "";
    const tipoStr = tomarPrimerParam(sp.tipo) ?? "";
    const desdeStr = tomarPrimerParam(sp.desde) ?? "";
    const hastaStr = tomarPrimerParam(sp.hasta) ?? "";
    const pageStr = tomarPrimerParam(sp.page) ?? "1";

    let datosExistencias: {
      movimientosRes: Awaited<ReturnType<typeof listarMovimientosStock>>;
      productosRes: Awaited<ReturnType<typeof listarProductos>>;
    } | null = null;
    let errorExistencias: string | null = null;

    try {
      const [movimientosRes, productosRes] = await Promise.all([
        listarMovimientosStock(usuario, {
          productoId: productoIdStr || undefined,
          tipo: tipoStr || undefined,
          desde: desdeStr || undefined,
          hasta: hastaStr || undefined,
          page: pageStr,
          pageSize: 20,
        }),
        listarProductos(usuario, { activo: "true", page: 1, pageSize: 100 }),
      ]);
      datosExistencias = { movimientosRes, productosRes };
    } catch (error) {
      errorExistencias = normalizeError(error).message;
    }

    return (
      <Stack gap="lg">
        <PageHeader
          title="Productos y existencias"
          description="Historial completo de movimientos de inventario."
        />

        <ProductosNav tabActiva="existencias" esAdmin={esAdmin} />

        {errorExistencias || !datosExistencias ? (
          <ErrorState
            message={
              errorExistencias ?? "No se pudieron cargar los movimientos."
            }
          />
        ) : (
          <MovimientosPanel
            movimientos={datosExistencias.movimientosRes.data}
            page={datosExistencias.movimientosRes.page}
            pageSize={datosExistencias.movimientosRes.pageSize}
            total={datosExistencias.movimientosRes.total}
            productoIdInicial={productoIdStr}
            tipoInicial={tipoStr || "todos"}
            desdeInicial={desdeStr}
            hastaInicial={hastaStr}
            productosDisponibles={datosExistencias.productosRes.data}
            conservarTabExistencias
            esAdmin={esAdmin}
          />
        )}
      </Stack>
    );
  }

  const q = tomarPrimerParam(sp.q) ?? "";
  const categoriaIdStr = tomarPrimerParam(sp.categoriaId) ?? "";
  const bajoMinimo = tomarPrimerParam(sp.bajoMinimo) === "true";
  const activoParam = tomarPrimerParam(sp.activo);
  const activo: "true" | "false" | "todos" =
    esAdmin && (activoParam === "false" || activoParam === "todos")
      ? activoParam
      : "true";
  const pageStr = tomarPrimerParam(sp.page) ?? "1";

  let datosCatalogo: {
    productosRes: Awaited<ReturnType<typeof listarProductos>>;
    categorias: Awaited<ReturnType<typeof listarCategorias>>;
  } | null = null;
  let errorCatalogo: string | null = null;

  try {
    const [productosRes, categorias] = await Promise.all([
      listarProductos(usuario, {
        q,
        categoriaId: categoriaIdStr || undefined,
        bajoMinimo: bajoMinimo ? "true" : undefined,
        activo,
        page: pageStr,
        pageSize: 20,
      }),
      listarCategorias(usuario),
    ]);
    datosCatalogo = { productosRes, categorias };
  } catch (error) {
    errorCatalogo = normalizeError(error).message;
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title="Productos y existencias"
        description="Catálogo de productos, precios, existencias y alertas de reposición."
      />

      <ProductosNav tabActiva="catalogo" esAdmin={esAdmin} />

      {errorCatalogo || !datosCatalogo ? (
        <ErrorState
          message={errorCatalogo ?? "No se pudo cargar el catálogo."}
        />
      ) : (
        <ProductosTablaPanel
          productos={datosCatalogo.productosRes.data}
          categorias={datosCatalogo.categorias}
          page={datosCatalogo.productosRes.page}
          pageSize={datosCatalogo.productosRes.pageSize}
          total={datosCatalogo.productosRes.total}
          qInicial={q}
          categoriaIdInicial={categoriaIdStr}
          bajoMinimoInicial={bajoMinimo}
          activoInicial={activo}
          esAdmin={esAdmin}
        />
      )}
    </Stack>
  );
}
