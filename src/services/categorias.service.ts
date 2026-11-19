import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { categorias, productos } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import {
  crearCategoriaSchema,
  editarCategoriaSchema,
} from "@/lib/schemas/categorias";
import { exigirAdmin, type UsuarioSesion } from "@/lib/session";

export interface CategoriaPublica {
  id: number;
  nombre: string;
  activa: boolean;
}

export interface CategoriaConConteo extends CategoriaPublica {
  productosActivos: number;
}

// RF-P7: listado de categorías activas sin paginar para filtros y formularios.
export async function listarCategorias(
  usuario: UsuarioSesion
): Promise<CategoriaPublica[]> {
  if (usuario.rol !== "admin" && usuario.rol !== "vendedor") {
    throw new ApiError(403, "SIN_PERMISO", "No tiene permisos suficientes.");
  }

  return db
    .select({
      id: categorias.id,
      nombre: categorias.nombre,
      activa: categorias.activa,
    })
    .from(categorias)
    .where(eq(categorias.activa, true))
    .orderBy(asc(categorias.nombre), asc(categorias.id));
}

// RF-P7, Sección 3: listado completo de categorías con cantidad de productos activos (solo admin).
export async function listarCategoriasConConteo(
  usuario: UsuarioSesion
): Promise<CategoriaConConteo[]> {
  exigirAdmin(usuario);

  const filas = await db
    .select({
      id: categorias.id,
      nombre: categorias.nombre,
      activa: categorias.activa,
      productosActivos: sql<number>`coalesce(sum(case when ${productos.activo} = 1 then 1 else 0 end), 0)`,
    })
    .from(categorias)
    .leftJoin(productos, eq(productos.categoriaId, categorias.id))
    .groupBy(categorias.id)
    .orderBy(asc(categorias.nombre), asc(categorias.id));

  return filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    activa: f.activa,
    productosActivos: Number(f.productosActivos ?? 0),
  }));
}

// RF-P7, Sección 3: alta de categoría validando nombre único (solo admin).
export async function crearCategoria(
  usuario: UsuarioSesion,
  datosSinValidar: unknown
): Promise<CategoriaPublica> {
  exigirAdmin(usuario);

  const { nombre } = crearCategoriaSchema.parse(datosSinValidar);

  const [duplicada] = await db
    .select({ id: categorias.id })
    .from(categorias)
    .where(sql`lower(${categorias.nombre}) = ${nombre.toLowerCase()}`)
    .limit(1);

  if (duplicada) {
    throw new ApiError(
      409,
      "NOMBRE_DUPLICADO",
      "Ya existe una categoría con ese nombre.",
      [{ campo: "nombre", mensaje: "Ya existe una categoría con ese nombre." }]
    );
  }

  const [creada] = await db
    .insert(categorias)
    .values({ nombre, activa: true })
    .returning({
      id: categorias.id,
      nombre: categorias.nombre,
      activa: categorias.activa,
    });

  return creada;
}

// RF-P7, Regla 12, Sección 11.4: edición y baja lógica validando categoría sin productos activos.
export async function editarCategoria(
  usuario: UsuarioSesion,
  id: number,
  datosSinValidar: unknown
): Promise<CategoriaPublica> {
  exigirAdmin(usuario);

  const parsed = editarCategoriaSchema.parse(datosSinValidar);

  const [existente] = await db
    .select({ id: categorias.id })
    .from(categorias)
    .where(eq(categorias.id, id))
    .limit(1);

  if (!existente) {
    throw new ApiError(404, "NO_ENCONTRADO", "La categoría no existe.");
  }

  if (parsed.nombre !== undefined) {
    const [duplicada] = await db
      .select({ id: categorias.id })
      .from(categorias)
      .where(
        and(
          sql`lower(${categorias.nombre}) = ${parsed.nombre.toLowerCase()}`,
          ne(categorias.id, id)
        )
      )
      .limit(1);

    if (duplicada) {
      throw new ApiError(
        409,
        "NOMBRE_DUPLICADO",
        "Ya existe otra categoría con ese nombre.",
        [
          {
            campo: "nombre",
            mensaje: "Ya existe otra categoría con ese nombre.",
          },
        ]
      );
    }
  }

  if (parsed.activa === false) {
    const [conteo] = await db
      .select({ total: sql<number>`count(*)` })
      .from(productos)
      .where(and(eq(productos.categoriaId, id), eq(productos.activo, true)));

    if (Number(conteo?.total ?? 0) > 0) {
      throw new ApiError(
        409,
        "CATEGORIA_EN_USO",
        "No se puede desactivar una categoría que tiene productos activos."
      );
    }
  }

  const cambios: Partial<{ nombre: string; activa: boolean }> = {};
  if (parsed.nombre !== undefined) cambios.nombre = parsed.nombre;
  if (parsed.activa !== undefined) cambios.activa = parsed.activa;

  const [actualizada] = await db
    .update(categorias)
    .set(cambios)
    .where(eq(categorias.id, id))
    .returning({
      id: categorias.id,
      nombre: categorias.nombre,
      activa: categorias.activa,
    });

  return actualizada;
}
