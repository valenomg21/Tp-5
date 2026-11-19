import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ApiError } from "./errors";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verificarTokenSesion,
} from "./session-token";

export type RolUsuario = "admin" | "vendedor";

export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export function construirOpcionesCookie(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/**
 * Resuelve el usuario autenticado actual desde la cookie firmada y la base de datos.
 * Si el usuario fue desactivado o cambió de rol, el efecto es inmediato (Sección 10.5).
 */
export async function obtenerUsuarioActual(): Promise<UsuarioSesion | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const verificado = await verificarTokenSesion(token);
  if (!verificado) {
    return null;
  }

  const [fila] = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      rol: usuarios.rol,
      activo: usuarios.activo,
    })
    .from(usuarios)
    .where(eq(usuarios.id, verificado.usuarioId))
    .limit(1);

  if (!fila || !fila.activo) {
    return null;
  }

  return {
    id: fila.id,
    nombre: fila.nombre,
    email: fila.email,
    rol: fila.rol,
  };
}

/**
 * Exige una sesión válida. Si no hay usuario conectado, lanza 401 NO_AUTENTICADO.
 */
export async function requerirUsuarioActual(): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    throw new ApiError(
      401,
      "NO_AUTENTICADO",
      "Debe iniciar sesión para continuar."
    );
  }
  return usuario;
}

/**
 * Verifica que el usuario autenticado tenga rol de administrador (Sección 3 y 10.5).
 */
export function exigirAdmin(usuario: UsuarioSesion): void {
  if (usuario.rol !== "admin") {
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "No tiene permisos para realizar esta operación."
    );
  }
}

export async function establecerCookieSesion(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, construirOpcionesCookie());
}

export async function borrarCookieSesion(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", construirOpcionesCookie(0));
}

export function aplicarCookieSesionEnRespuesta(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, token, construirOpcionesCookie());
  return response;
}

export function borrarCookieSesionEnRespuesta(
  response: NextResponse
): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, "", construirOpcionesCookie(0));
  return response;
}
