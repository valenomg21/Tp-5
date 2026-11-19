import { z } from "zod";
import { normalizarDocumento } from "@/lib/format";

export const tipoDocSchema = z.enum(["DNI", "CUIT"], {
  error: "El tipo de documento debe ser DNI o CUIT.",
});

export function validarDigitosDocumento(
  tipoDoc: "DNI" | "CUIT",
  nroDoc: string
): boolean {
  const digitos = normalizarDocumento(nroDoc);
  if (tipoDoc === "DNI") {
    return digitos.length === 7 || digitos.length === 8;
  }
  return digitos.length === 11;
}

export function mensajeDocumentoInvalido(tipoDoc: "DNI" | "CUIT"): string {
  return tipoDoc === "DNI"
    ? "El DNI debe tener 7 u 8 dígitos."
    : "El CUIT debe tener 11 dígitos.";
}

const optionalEmail = z
  .string()
  .trim()
  .max(160, "El email no puede superar los 160 caracteres.")
  .refine(
    (v) => v === "" || z.string().email().safeParse(v).success,
    "Ingresá un email válido."
  )
  .optional()
  .nullable();

const optionalLimiteCredito = z
  .number({ error: "El límite de crédito debe ser un número." })
  .int("El límite de crédito debe expresarse en centavos enteros.")
  .min(1, "El límite de crédito debe ser mayor a cero.")
  .optional()
  .nullable();

export const listarClientesQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  conDeuda: z.enum(["true", "false"]).optional(),
  orden: z.enum(["saldo", "nombre"]).optional(),
  activo: z.enum(["true", "false", "todos"]).optional().default("true"),
  page: z.coerce
    .number({ error: "La página debe ser un número." })
    .int("La página debe ser un entero.")
    .min(1, "La página mínima es 1.")
    .optional()
    .default(1),
  pageSize: z.coerce
    .number({ error: "El tamaño de página debe ser un número." })
    .int("El tamaño de página debe ser un entero.")
    .min(1, "El tamaño mínimo es 1.")
    .max(100, "El tamaño máximo es 100.")
    .optional()
    .default(20),
});

export const crearClienteSchema = z
  .object({
    tipoDoc: tipoDocSchema,
    nroDoc: z
      .string({ error: "El número de documento es obligatorio." })
      .trim()
      .min(1, "El número de documento es obligatorio.")
      .max(20, "El número de documento es demasiado largo."),
    nombre: z
      .string({ error: "El nombre o razón social es obligatorio." })
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(160, "El nombre no puede superar los 160 caracteres."),
    domicilio: z
      .string()
      .trim()
      .max(200, "El domicilio no puede superar los 200 caracteres.")
      .optional()
      .nullable(),
    telefono: z
      .string()
      .trim()
      .max(40, "El teléfono no puede superar los 40 caracteres.")
      .optional()
      .nullable(),
    email: optionalEmail,
    cuentaCorriente: z.boolean().optional().default(false),
    limiteCredito: optionalLimiteCredito,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!validarDigitosDocumento(data.tipoDoc, data.nroDoc)) {
      ctx.addIssue({
        code: "custom",
        path: ["nroDoc"],
        message: mensajeDocumentoInvalido(data.tipoDoc),
      });
    }
  });

export const editarClienteSchema = z
  .object({
    tipoDoc: tipoDocSchema.optional(),
    nroDoc: z
      .string()
      .trim()
      .min(1, "El número de documento no puede estar vacío.")
      .max(20, "El número de documento es demasiado largo.")
      .optional(),
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(160, "El nombre no puede superar los 160 caracteres.")
      .optional(),
    domicilio: z
      .string()
      .trim()
      .max(200, "El domicilio no puede superar los 200 caracteres.")
      .optional()
      .nullable(),
    telefono: z
      .string()
      .trim()
      .max(40, "El teléfono no puede superar los 40 caracteres.")
      .optional()
      .nullable(),
    email: optionalEmail,
    cuentaCorriente: z.boolean().optional(),
    limiteCredito: optionalLimiteCredito,
    activo: z
      .boolean({ error: "El estado activo debe ser verdadero o falso." })
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.tipoDoc !== undefined ||
      data.nroDoc !== undefined ||
      data.nombre !== undefined ||
      data.domicilio !== undefined ||
      data.telefono !== undefined ||
      data.email !== undefined ||
      data.cuentaCorriente !== undefined ||
      data.limiteCredito !== undefined ||
      data.activo !== undefined,
    {
      message: "Debés enviar al menos un campo para actualizar.",
    }
  );

const optionalFechaISO = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD.")
    .optional()
);

export const cuentaCorrienteQuerySchema = z.object({
  desde: optionalFechaISO,
  hasta: optionalFechaISO,
});

export type ListarClientesQuery = z.infer<typeof listarClientesQuerySchema>;
export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
export type CrearClienteFormInput = z.input<typeof crearClienteSchema>;
export type EditarClienteInput = z.infer<typeof editarClienteSchema>;
export type CuentaCorrienteQuery = z.infer<typeof cuentaCorrienteQuerySchema>;
