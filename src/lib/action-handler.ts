import { type ErrorCode, type ErrorDetails, normalizeError } from "./errors";
import { requerirUsuarioActual, type UsuarioSesion } from "./session";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: ErrorCode;
        message: string;
        details?: ErrorDetails;
      };
    };

function toActionFailure(error: unknown): ActionResult<never> {
  const apiError = normalizeError(error);
  return {
    ok: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details !== undefined ? { details: apiError.details } : {}),
    },
  };
}

/**
 * Ejecuta una Server Action autenticada devolviendo { ok, data } o { ok: false, error }.
 */
export async function runAuthAction<T>(
  fn: (usuario: UsuarioSesion) => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const usuario = await requerirUsuarioActual();
    const data = await fn(usuario);
    return { ok: true, data };
  } catch (error) {
    return toActionFailure(error);
  }
}

/**
 * Ejecuta una Server Action pública devolviendo { ok, data } o { ok: false, error }.
 */
export async function runPublicAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    return toActionFailure(error);
  }
}
