import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db, type DbOrTx } from "@/db";
import { facturas, movimientosStock, productos, usuarios } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import {
  formatearNumeroFactura,
  rangoDiaArgentinaAUTC,
} from "@/lib/format";
import {
  listarMovimientosStockQuerySchema,
  registrarMovimientoStockSchema,
} from "@/lib/schemas/stock";
import { exigirAdmin, type UsuarioSesion } from "@/lib/session";

export type TipoMovimientoStock = "venta" | "anulacion" | "ingreso" | "egreso";

export interface MovimientoStockPublico {
  id: number;
  producto: {
    id: number;
    codigo: string;
    descripcion: string;
  };
  tipo: TipoMovimientoStock;
  cantidad: number;
  existenciaResultante: number;
  motivo: string;
  observacion: string | null;
  referencia: {
    facturaId: number;
    numero: string;
  } | null;
  usuario: {
    id: number;
    nombre: string;
  };
  fecha: string;
}

export interface ListadoMovimientosResultado {
  data: MovimientoStockPublico[];
  page: number;
  pageSize: number;
  total: number;
}

export interface MoverStockInput {
  productoId: number;
  tipo: TipoMovimientoStock;
  cantidad: number;
  motivo: string;
  observacion?: string | null;
  facturaId?: number | null;
  usuarioId: number;
  fecha?: string;
}

// Regla 1, Regla 2, Sección 10.2: única función autorizada a modificar productos.existencia.
export async function moverStock(tx: DbOrTx, input: MoverStockInput) {
  const { productoId, tipo, cantidad, motivo, usuarioId } = input;

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new ApiError(
      422,
      "VALIDACION",
      "La cantidad del movimiento debe ser un entero positivo.",
      [{ campo: "cantidad", mensaje: "Debe ser un entero mayor que cero." }]
    );
  }

  const esEgreso = tipo === "egreso" || tipo === "venta";
  const delta = esEgreso ? -cantidad : cantidad;
  const fechaMovimiento = input.fecha ?? new Date().toISOString();
  const observacionLimpia = input.observacion?.trim() || null;

  const [actualizado] = esEgreso
    ? await tx
        .update(productos)
        .set({
          existencia: sql`${productos.existencia} - ${cantidad}`,
        })
        .where(
          and(
            eq(productos.id, productoId),
            gte(productos.existencia, cantidad)
          )
        )
        .returning({
          id: productos.id,
          codigo: productos.codigo,
          descripcion: productos.descripcion,
          existencia: productos.existencia,
        })
    : await tx
        .update(productos)
        .set({
          existencia: sql`${productos.existencia} + ${cantidad}`,
        })
        .where(eq(productos.id, productoId))
        .returning({
          id: productos.id,
          codigo: productos.codigo,
          descripcion: productos.descripcion,
          existencia: productos.existencia,
        });

  if (!actualizado) {
    const [existente] = await tx
      .select({
        id: productos.id,
        existencia: productos.existencia,
      })
      .from(productos)
      .where(eq(productos.id, productoId))
      .limit(1);

    if (!existente) {
      throw new ApiError(404, "NO_ENCONTRADO", "El producto no existe.");
    }

    throw new ApiError(
      409,
      "STOCK_INSUFICIENTE",
      "Stock insuficiente para realizar la operación.",
      [
        {
          productoId,
          solicitado: cantidad,
          disponible: existente.existencia,
        },
      ]
    );
  }

  const [movimiento] = await tx
    .insert(movimientosStock)
    .values({
      productoId,
      tipo,
      cantidad: delta,
      existenciaResultante: actualizado.existencia,
      motivo,
      observacion: observacionLimpia,
      facturaId: input.facturaId ?? null,
      usuarioId,
      fecha: fechaMovimiento,
    })
    .returning();

  return {
    movimiento,
    producto: actualizado,
    existenciaResultante: actualizado.existencia,
  };
}

// RF-P4, RF-P5, Regla 1 y 2: ingreso o egreso manual de stock por administrador.
export async function registrarMovimientoManual(
  usuario: UsuarioSesion,
  productoId: number,
  datosSinValidar: unknown
): Promise<MovimientoStockPublico> {
  exigirAdmin(usuario);

  const parsed = registrarMovimientoStockSchema.parse(datosSinValidar);

  const resultado = await db.transaction(async (tx) => {
    return moverStock(tx, {
      productoId,
      tipo: parsed.tipo,
      cantidad: parsed.cantidad,
      motivo: parsed.motivo,
      observacion: parsed.observacion,
      usuarioId: usuario.id,
    });
  });

  return {
    id: resultado.movimiento.id,
    producto: {
      id: resultado.producto.id,
      codigo: resultado.producto.codigo,
      descripcion: resultado.producto.descripcion,
    },
    tipo: resultado.movimiento.tipo,
    cantidad: resultado.movimiento.cantidad,
    existenciaResultante: resultado.existenciaResultante,
    motivo: resultado.movimiento.motivo,
    observacion: resultado.movimiento.observacion,
    referencia: null,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
    },
    fecha: resultado.movimiento.fecha,
  };
}

async function consultarMovimientos(
  filtros: ReturnType<typeof listarMovimientosStockQuerySchema.parse>
): Promise<ListadoMovimientosResultado> {
  const condiciones: SQL[] = [];

  if (filtros.productoId !== undefined) {
    condiciones.push(eq(movimientosStock.productoId, filtros.productoId));
  }

  if (filtros.tipo !== undefined) {
    condiciones.push(eq(movimientosStock.tipo, filtros.tipo));
  }

  if (filtros.desde !== undefined) {
    condiciones.push(
      gte(movimientosStock.fecha, rangoDiaArgentinaAUTC(filtros.desde).inicio)
    );
  }

  if (filtros.hasta !== undefined) {
    condiciones.push(
      lte(movimientosStock.fecha, rangoDiaArgentinaAUTC(filtros.hasta).fin)
    );
  }

  const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

  const [conteo] = await db
    .select({ total: sql<number>`count(*)` })
    .from(movimientosStock)
    .where(whereClause);

  const total = Number(conteo?.total ?? 0);
  const offset = (filtros.page - 1) * filtros.pageSize;

  const filas = await db
    .select({
      id: movimientosStock.id,
      tipo: movimientosStock.tipo,
      cantidad: movimientosStock.cantidad,
      existenciaResultante: movimientosStock.existenciaResultante,
      motivo: movimientosStock.motivo,
      observacion: movimientosStock.observacion,
      fecha: movimientosStock.fecha,
      productoId: productos.id,
      productoCodigo: productos.codigo,
      productoDescripcion: productos.descripcion,
      usuarioId: usuarios.id,
      usuarioNombre: usuarios.nombre,
      facturaId: facturas.id,
      facturaPuntoVenta: facturas.puntoVenta,
      facturaNumero: facturas.numero,
    })
    .from(movimientosStock)
    .innerJoin(productos, eq(movimientosStock.productoId, productos.id))
    .innerJoin(usuarios, eq(movimientosStock.usuarioId, usuarios.id))
    .leftJoin(facturas, eq(movimientosStock.facturaId, facturas.id))
    .where(whereClause)
    .orderBy(desc(movimientosStock.fecha), desc(movimientosStock.id))
    .limit(filtros.pageSize)
    .offset(offset);

  const data: MovimientoStockPublico[] = filas.map((f) => ({
    id: f.id,
    producto: {
      id: f.productoId,
      codigo: f.productoCodigo,
      descripcion: f.productoDescripcion,
    },
    tipo: f.tipo,
    cantidad: f.cantidad,
    existenciaResultante: f.existenciaResultante,
    motivo: f.motivo,
    observacion: f.observacion,
    referencia:
      f.facturaId !== null &&
      f.facturaPuntoVenta !== null &&
      f.facturaNumero !== null
        ? {
            facturaId: f.facturaId,
            numero: formatearNumeroFactura(f.facturaPuntoVenta, f.facturaNumero),
          }
        : null,
    usuario: {
      id: f.usuarioId,
      nombre: f.usuarioNombre,
    },
    fecha: f.fecha,
  }));

  return {
    data,
    page: filtros.page,
    pageSize: filtros.pageSize,
    total,
  };
}

// RF-P6: historial paginado de movimientos de un producto del más nuevo al más viejo.
export async function listarMovimientosDeProducto(
  usuario: UsuarioSesion,
  productoId: number,
  querySinValidar: unknown
): Promise<ListadoMovimientosResultado> {
  if (usuario.rol !== "admin" && usuario.rol !== "vendedor") {
    throw new ApiError(403, "SIN_PERMISO", "No tiene permisos suficientes.");
  }

  const [producto] = await db
    .select({ id: productos.id })
    .from(productos)
    .where(eq(productos.id, productoId))
    .limit(1);

  if (!producto) {
    throw new ApiError(404, "NO_ENCONTRADO", "El producto no existe.");
  }

  const parsed = listarMovimientosStockQuerySchema.parse(querySinValidar);
  return consultarMovimientos({ ...parsed, productoId });
}

// RF-P6, Sección 11.4: consulta general de movimientos de stock con filtros.
export async function listarMovimientosStock(
  usuario: UsuarioSesion,
  querySinValidar: unknown
): Promise<ListadoMovimientosResultado> {
  if (usuario.rol !== "admin" && usuario.rol !== "vendedor") {
    throw new ApiError(403, "SIN_PERMISO", "No tiene permisos suficientes.");
  }

  const parsed = listarMovimientosStockQuerySchema.parse(querySinValidar);
  return consultarMovimientos(parsed);
}
