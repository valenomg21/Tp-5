import { ApiError } from "./errors";

export type RolUsuario = "admin" | "vendedor";

export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

/**
 * Resuelve el usuario autenticado actual a partir de la cookie de sesión.
 * En la Etapa 1 devuelve null; en la Etapa 2 se implementa la verificación HMAC + consulta a BD.
 */
export async function obtenerUsuarioActual(): Promise<UsuarioSesion | null> {
  return null;
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
