import { and, asc, eq, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categorias, productos } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import {
  crearProductoSchema,
  editarProductoSchema,
  listarProductosQuerySchema,
} from "@/lib/schemas/productos";
import { exigirAdmin, type UsuarioSesion } from "@/lib/session";
import { moverStock } from "@/services/stock.service";

export interface ProductoPublico {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: {
    id: number;
    nombre: string;
  };
  precio: number;
  existencia: number;
  stockMinimo: number;
  bajoMinimo: boolean;
  activo: boolean;
}

export interface ListadoProductosResultado {
  data: ProductoPublico[];
  page: number;
  pageSize: number;
  total: number;
}

function mapearProductoPublico(fila: {
  id: number;
  codigo: string;
  descripcion: string;
  categoriaId: number;
  categoriaNombre: string;
  precio: number;
  existencia: number;
  stockMinimo: number;
  activo: boolean;
}): ProductoPublico {
  return {
    id: fila.id,
    codigo: fila.codigo,
    descripcion: fila.descripcion,
    categoria: {
      id: fila.categoriaId,
      nombre: fila.categoriaNombre,
    },
    precio: fila.precio,
    existencia: fila.existencia,
    stockMinimo: fila.stockMinimo,
    bajoMinimo: fila.existencia < fila.stockMinimo,
    activo: fila.activo,
  };
}

async function buscarProductoPublicoPorId(
  id: number
): Promise<ProductoPublico | null> {
  const [fila] = await db
    .select({
      id: productos.id,
      codigo: productos.codigo,
      descripcion: productos.descripcion,
      categoriaId: categorias.id,
      categoriaNombre: categorias.nombre,
      precio: productos.precio,
      existencia: productos.existencia,
      stockMinimo: productos.stockMinimo,
      activo: productos.activo,
    })
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(eq(productos.id, id))
    .limit(1);

  return fila ? mapearProductoPublico(fila) : null;
}

async function exigirCategoriaActiva(categoriaId: number): Promise<void> {
  const [cat] = await db
    .select({ id: categorias.id, activa: categorias.activa })
    .from(categorias)
    .where(eq(categorias.id, categoriaId))
    .limit(1);

  if (!cat || !cat.activa) {
    throw new ApiError(422, "VALIDACION", "Hay campos con errores.", [
      {
        campo: "categoriaId",
        mensaje: "La categoría seleccionada no existe o está inactiva.",
      },
    ]);
  }
}

// RF-P1: catálogo paginado con búsqueda, categoría, alerta bajo mínimo y filtro activo.
export async function listarProductos(
  usuario: UsuarioSesion,
  querySinValidar: unknown
): Promise<ListadoProductosResultado> {
  const parsed = listarProductosQuerySchema.parse(querySinValidar);

  if (parsed.activo !== "true" && usuario.rol !== "admin") {
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "Solo los administradores pueden consultar productos inactivos."
    );
  }

  const condiciones: SQL[] = [];

  if (parsed.q) {
    const patron = `%${parsed.q.toLowerCase()}%`;
    const filtroTexto = or(
      sql`lower(${productos.codigo}) like ${patron}`,
      sql`lower(${productos.descripcion}) like ${patron}`
    );
    if (filtroTexto) condiciones.push(filtroTexto);
  }

  if (parsed.categoriaId !== undefined) {
    condiciones.push(eq(productos.categoriaId, parsed.categoriaId));
  }

  if (parsed.bajoMinimo === "true") {
    condiciones.push(sql`${productos.existencia} < ${productos.stockMinimo}`);
  }

  if (parsed.activo === "true") {
    condiciones.push(eq(productos.activo, true));
  } else if (parsed.activo === "false") {
    condiciones.push(eq(productos.activo, false));
  }

  const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

  const [conteo] = await db
    .select({ total: sql<number>`count(*)` })
    .from(productos)
    .where(whereClause);

  const total = Number(conteo?.total ?? 0);
  const offset = (parsed.page - 1) * parsed.pageSize;

  const filas = await db
    .select({
      id: productos.id,
      codigo: productos.codigo,
      descripcion: productos.descripcion,
      categoriaId: categorias.id,
      categoriaNombre: categorias.nombre,
      precio: productos.precio,
      existencia: productos.existencia,
      stockMinimo: productos.stockMinimo,
      activo: productos.activo,
    })
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(whereClause)
    .orderBy(asc(productos.codigo), asc(productos.id))
    .limit(parsed.pageSize)
    .offset(offset);

  return {
    data: filas.map(mapearProductoPublico),
    page: parsed.page,
    pageSize: parsed.pageSize,
    total,
  };
}

// RF-P1: ficha individual del producto.
export async function obtenerProductoPorId(
  usuario: UsuarioSesion,
  id: number
): Promise<ProductoPublico> {
  if (usuario.rol !== "admin" && usuario.rol !== "vendedor") {
    throw new ApiError(403, "SIN_PERMISO", "No tiene permisos suficientes.");
  }

  const producto = await buscarProductoPublicoPorId(id);
  if (!producto) {
    throw new ApiError(404, "NO_ENCONTRADO", "El producto no existe.");
  }
  return producto;
}

// RF-P2, Regla 2, Sección 11.4: alta de producto (solo admin); stockInicial vía moverStock().
export async function crearProducto(
  usuario: UsuarioSesion,
  datosSinValidar: unknown
): Promise<ProductoPublico> {
  exigirAdmin(usuario);

  const parsed = crearProductoSchema.parse(datosSinValidar);

  await exigirCategoriaActiva(parsed.categoriaId);

  const [duplicado] = await db
    .select({ id: productos.id })
    .from(productos)
    .where(sql`lower(${productos.codigo}) = ${parsed.codigo.toLowerCase()}`)
    .limit(1);

  if (duplicado) {
    throw new ApiError(
      409,
      "CODIGO_DUPLICADO",
      "Ya existe un producto registrado con ese código.",
      [{ campo: "codigo", mensaje: "Ya existe un producto con ese código." }]
    );
  }

  const productoId = await db.transaction(async (tx) => {
    const [creado] = await tx
      .insert(productos)
      .values({
        codigo: parsed.codigo,
        descripcion: parsed.descripcion,
        categoriaId: parsed.categoriaId,
        precio: parsed.precio,
        existencia: 0,
        stockMinimo: parsed.stockMinimo,
        activo: true,
      })
      .returning({ id: productos.id });

    if (parsed.stockInicial !== undefined && parsed.stockInicial > 0) {
      await moverStock(tx, {
        productoId: creado.id,
        tipo: "ingreso",
        cantidad: parsed.stockInicial,
        motivo: "Stock inicial",
        usuarioId: usuario.id,
      });
    }

    return creado.id;
  });

  const producto = await buscarProductoPublicoPorId(productoId);
  if (!producto) {
    throw new ApiError(500, "ERROR_INTERNO", "No se pudo recuperar el producto.");
  }
  return producto;
}

// RF-P2, RF-P3, Regla 12, Sección 11.4: edición y baja lógica (rechaza existencia con 422).
export async function editarProducto(
  usuario: UsuarioSesion,
  id: number,
  datosSinValidar: unknown
): Promise<ProductoPublico> {
  exigirAdmin(usuario);

  const parsed = editarProductoSchema.parse(datosSinValidar);

  const [existente] = await db
    .select({ id: productos.id })
    .from(productos)
    .where(eq(productos.id, id))
    .limit(1);

  if (!existente) {
    throw new ApiError(404, "NO_ENCONTRADO", "El producto no existe.");
  }

  if (parsed.codigo !== undefined) {
    const [duplicado] = await db
      .select({ id: productos.id })
      .from(productos)
      .where(
        and(
          sql`lower(${productos.codigo}) = ${parsed.codigo.toLowerCase()}`,
          ne(productos.id, id)
        )
      )
      .limit(1);

    if (duplicado) {
      throw new ApiError(
        409,
        "CODIGO_DUPLICADO",
        "Ya existe otro producto con ese código.",
        [{ campo: "codigo", mensaje: "Ya existe otro producto con ese código." }]
      );
    }
  }

  if (parsed.categoriaId !== undefined) {
    await exigirCategoriaActiva(parsed.categoriaId);
  }

  const cambios: Partial<{
    codigo: string;
    descripcion: string;
    categoriaId: number;
    precio: number;
    stockMinimo: number;
    activo: boolean;
  }> = {};

  if (parsed.codigo !== undefined) cambios.codigo = parsed.codigo;
  if (parsed.descripcion !== undefined) cambios.descripcion = parsed.descripcion;
  if (parsed.categoriaId !== undefined) cambios.categoriaId = parsed.categoriaId;
  if (parsed.precio !== undefined) cambios.precio = parsed.precio;
  if (parsed.stockMinimo !== undefined) cambios.stockMinimo = parsed.stockMinimo;
  if (parsed.activo !== undefined) cambios.activo = parsed.activo;

  await db.update(productos).set(cambios).where(eq(productos.id, id));

  const producto = await buscarProductoPublicoPorId(id);
  if (!producto) {
    throw new ApiError(404, "NO_ENCONTRADO", "El producto no existe.");
  }
  return producto;
}
