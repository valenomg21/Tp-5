import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, asc, eq, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  listarUsuariosQuerySchema,
} from "@/lib/schemas/usuarios";
import {
  exigirAdmin,
  type RolUsuario,
  type UsuarioSesion,
} from "@/lib/session";

export interface UsuarioPublico {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  creadoEn: string;
}

export interface ListadoUsuariosResultado {
  data: UsuarioPublico[];
  page: number;
  pageSize: number;
  total: number;
}

const COLUMNAS_USUARIO_PUBLICO = {
  id: usuarios.id,
  nombre: usuarios.nombre,
  email: usuarios.email,
  rol: usuarios.rol,
  activo: usuarios.activo,
  creadoEn: usuarios.creadoEn,
};

const ALFABETO_TEMP =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generarPasswordTemporal(longitud = 12): string {
  const bytes = crypto.randomBytes(longitud);
  let resultado = "";
  for (let i = 0; i < longitud; i++) {
    resultado += ALFABETO_TEMP[bytes[i] % ALFABETO_TEMP.length];
  }
  return resultado;
}

// RF-U4, Sección 3: listado paginado de usuarios (solo administrador), sin passwordHash.
export async function listarUsuarios(
  usuario: UsuarioSesion,
  querySinValidar: unknown
): Promise<ListadoUsuariosResultado> {
  exigirAdmin(usuario);

  const { q, activo, page, pageSize } =
    listarUsuariosQuerySchema.parse(querySinValidar);

  const condiciones: SQL[] = [];

  if (q) {
    const patron = `%${q.toLowerCase()}%`;
    const filtroBusqueda = or(
      sql`lower(${usuarios.nombre}) like ${patron}`,
      sql`lower(${usuarios.email}) like ${patron}`
    );
    if (filtroBusqueda) {
      condiciones.push(filtroBusqueda);
    }
  }

  if (activo === "true") {
    condiciones.push(eq(usuarios.activo, true));
  } else if (activo === "false") {
    condiciones.push(eq(usuarios.activo, false));
  }

  const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

  const [conteo] = await db
    .select({ total: sql<number>`count(*)` })
    .from(usuarios)
    .where(whereClause);

  const total = Number(conteo?.total ?? 0);
  const offset = (page - 1) * pageSize;

  const data = await db
    .select(COLUMNAS_USUARIO_PUBLICO)
    .from(usuarios)
    .where(whereClause)
    .orderBy(asc(usuarios.nombre), asc(usuarios.id))
    .limit(pageSize)
    .offset(offset);

  return {
    data,
    page,
    pageSize,
    total,
  };
}

// RF-U4, Sección 3: alta de usuario por administrador validando email único.
export async function crearUsuario(
  usuario: UsuarioSesion,
  datosSinValidar: unknown
): Promise<UsuarioPublico> {
  exigirAdmin(usuario);

  const parsed = crearUsuarioSchema.parse(datosSinValidar);
  const emailNormalizado = parsed.email.toLowerCase();

  const [existente] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.email, emailNormalizado))
    .limit(1);

  if (existente) {
    throw new ApiError(
      409,
      "EMAIL_DUPLICADO",
      "Ya existe un usuario registrado con ese email.",
      [{ campo: "email", mensaje: "Ya existe un usuario con este email." }]
    );
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  const [creado] = await db
    .insert(usuarios)
    .values({
      nombre: parsed.nombre,
      email: emailNormalizado,
      passwordHash,
      rol: parsed.rol,
      activo: true,
    })
    .returning(COLUMNAS_USUARIO_PUBLICO);

  return creado;
}

// RF-U4, Regla 12, Sección 11.3: edición y baja lógica de usuario (solo administrador).
export async function editarUsuario(
  usuario: UsuarioSesion,
  id: number,
  datosSinValidar: unknown
): Promise<UsuarioPublico> {
  exigirAdmin(usuario);

  const parsed = editarUsuarioSchema.parse(datosSinValidar);

  const [objetivo] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.id, id))
    .limit(1);

  if (!objetivo) {
    throw new ApiError(404, "NO_ENCONTRADO", "El usuario no existe.");
  }

  if (id === usuario.id) {
    if (parsed.activo === false) {
      throw new ApiError(
        422,
        "OPERACION_SOBRE_SI_MISMO",
        "No podés desactivar tu propia cuenta."
      );
    }
    if (parsed.rol !== undefined && parsed.rol !== "admin") {
      throw new ApiError(
        422,
        "OPERACION_SOBRE_SI_MISMO",
        "No podés quitarte el rol de administrador."
      );
    }
  }

  let emailNormalizado: string | undefined;
  if (parsed.email !== undefined) {
    emailNormalizado = parsed.email.toLowerCase();
    const [duplicado] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.email, emailNormalizado), ne(usuarios.id, id)))
      .limit(1);

    if (duplicado) {
      throw new ApiError(
        409,
        "EMAIL_DUPLICADO",
        "Ya existe otro usuario registrado con ese email.",
        [{ campo: "email", mensaje: "Ya existe otro usuario con este email." }]
      );
    }
  }

  const cambios: Partial<{
    nombre: string;
    email: string;
    rol: RolUsuario;
    activo: boolean;
  }> = {};

  if (parsed.nombre !== undefined) cambios.nombre = parsed.nombre;
  if (emailNormalizado !== undefined) cambios.email = emailNormalizado;
  if (parsed.rol !== undefined) cambios.rol = parsed.rol;
  if (parsed.activo !== undefined) cambios.activo = parsed.activo;

  const [actualizado] = await db
    .update(usuarios)
    .set(cambios)
    .where(eq(usuarios.id, id))
    .returning(COLUMNAS_USUARIO_PUBLICO);

  return actualizado;
}

// RF-U5, Sección 3: restablecimiento de contraseña temporal (mostrada una sola vez).
export async function restablecerContrasenaUsuario(
  usuario: UsuarioSesion,
  id: number
): Promise<{ passwordTemporal: string }> {
  exigirAdmin(usuario);

  const [objetivo] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.id, id))
    .limit(1);

  if (!objetivo) {
    throw new ApiError(404, "NO_ENCONTRADO", "El usuario no existe.");
  }

  const passwordTemporal = generarPasswordTemporal(12);
  const passwordHash = await bcrypt.hash(passwordTemporal, 10);

  await db
    .update(usuarios)
    .set({ passwordHash })
    .where(eq(usuarios.id, id));

  return { passwordTemporal };
}
