import { ZodError } from "zod";

export type ErrorCode =
  | "JSON_INVALIDO"
  | "NO_AUTENTICADO"
  | "CREDENCIALES_INVALIDAS"
  | "SIN_PERMISO"
  | "NO_ENCONTRADO"
  | "CODIGO_DUPLICADO"
  | "DOCUMENTO_DUPLICADO"
  | "EMAIL_DUPLICADO"
  | "NOMBRE_DUPLICADO"
  | "CATEGORIA_EN_USO"
  | "STOCK_INSUFICIENTE"
  | "FACTURA_ANULADA"
  | "VALIDACION"
  | "PRODUCTO_INACTIVO"
  | "CUENTA_CORRIENTE_NO_HABILITADA"
  | "LIMITE_CREDITO_EXCEDIDO"
  | "MONTO_INSUFICIENTE"
  | "PAGO_SUPERA_DEUDA"
  | "SALDO_PENDIENTE"
  | "CONTRASENA_ACTUAL_INCORRECTA"
  | "OPERACION_SOBRE_SI_MISMO"
  | "ERROR_INTERNO";

export interface ErrorFieldDetail {
  campo: string;
  mensaje: string;
}

export type ErrorDetails = ErrorFieldDetail[] | Record<string, unknown> | unknown[];

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: ErrorDetails;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: ErrorDetails
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toJSON(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}

export function zodErrorToApiError(error: ZodError): ApiError {
  const details: ErrorFieldDetail[] = [];

  for (const issue of error.issues) {
    if (issue.code === "unrecognized_keys" && "keys" in issue && Array.isArray(issue.keys)) {
      const prefixo = issue.path.map(String);
      for (const key of issue.keys) {
        details.push({
          campo: [...prefixo, String(key)].join("."),
          mensaje: "Campo no permitido.",
        });
      }
      continue;
    }

    details.push({
      campo: issue.path.map(String).join("."),
      mensaje: issue.message,
    });
  }

  return new ApiError(422, "VALIDACION", "Hay campos con errores.", details);
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ZodError) {
    return zodErrorToApiError(error);
  }

  console.error("[ERROR INTERNO]", error);
  return new ApiError(
    500,
    "ERROR_INTERNO",
    "Ocurrió un error interno del servidor."
  );
}
