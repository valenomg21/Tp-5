import { NextRequest, NextResponse } from "next/server";
import { ApiError, normalizeError } from "./errors";
import { requerirUsuarioActual, type UsuarioSesion } from "./session";

type RouteContext<TParams> = {
  params: Promise<TParams>;
};

export interface AuthApiContext<TParams = Record<string, string>> {
  request: NextRequest;
  params: TParams;
  usuario: UsuarioSesion;
}

export interface PublicApiContext<TParams = Record<string, string>> {
  request: NextRequest;
  params: TParams;
}

/**
 * Lee el cuerpo JSON de una petición o lanza 400 JSON_INVALIDO si falla.
 */
export async function leerJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(
      400,
      "JSON_INVALIDO",
      "El cuerpo de la solicitud no es un JSON válido."
    );
  }
}

/**
 * Convierte un parámetro de ruta en un entero positivo estricto; si no lo es, lanza 404 NO_ENCONTRADO.
 */
export function parsearIdNumerico(valor: string): number {
  if (!/^\d+$/.test(valor)) {
    throw new ApiError(
      404,
      "NO_ENCONTRADO",
      "El recurso solicitado no existe."
    );
  }

  const numero = Number.parseInt(valor, 10);
  if (!Number.isSafeInteger(numero) || numero <= 0) {
    throw new ApiError(
      404,
      "NO_ENCONTRADO",
      "El recurso solicitado no existe."
    );
  }

  return numero;
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

function errorResponse(error: unknown): NextResponse {
  const apiError = normalizeError(error);
  return NextResponse.json(apiError.toJSON(), { status: apiError.status });
}

/**
 * Envuelve un Route Handler protegido: exige sesión válida, resuelve params
 * y convierte cualquier error al formato estándar de la sección 11.1.
 */
export function withAuthApi<TParams = Record<string, string>>(
  handler: (context: AuthApiContext<TParams>) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: RouteContext<TParams>
  ): Promise<NextResponse> => {
    try {
      const usuario = await requerirUsuarioActual();
      const params = await context.params;
      return await handler({ request, params, usuario });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * Envuelve un Route Handler público (ej. POST /api/auth/login) sin exigir sesión.
 */
export function withPublicApi<TParams = Record<string, string>>(
  handler: (context: PublicApiContext<TParams>) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: RouteContext<TParams>
  ): Promise<NextResponse> => {
    try {
      const params = await context.params;
      return await handler({ request, params });
    } catch (error) {
      return errorResponse(error);
    }
  };
}
