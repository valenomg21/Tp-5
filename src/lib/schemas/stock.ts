import { z } from "zod";

export const MOTIVOS_INGRESO = [
  "Reposición",
  "Stock inicial",
  "Devolución de cliente",
] as const;

export const MOTIVOS_EGRESO = [
  "Rotura",
  "Vencimiento",
  "Ajuste de inventario",
  "Uso interno",
] as const;

export const TIPOS_MOVIMIENTO_STOCK = [
  "venta",
  "anulacion",
  "ingreso",
  "egreso",
] as const;

const cantidadMovimientoSchema = z
  .number({ error: "La cantidad es obligatoria." })
  .int("La cantidad debe ser un entero.")
  .min(1, "La cantidad debe ser mayor a cero.");

const observacionMovimientoSchema = z
  .string()
  .trim()
  .max(240, "La observación no puede superar los 240 caracteres.")
  .optional()
  .nullable();

export const registrarMovimientoStockSchema = z.discriminatedUnion("tipo", [
  z
    .object({
      tipo: z.literal("ingreso"),
      cantidad: cantidadMovimientoSchema,
      motivo: z.enum(MOTIVOS_INGRESO, {
        error: "Seleccioná un motivo de ingreso válido.",
      }),
      observacion: observacionMovimientoSchema,
    })
    .strict(),
  z
    .object({
      tipo: z.literal("egreso"),
      cantidad: cantidadMovimientoSchema,
      motivo: z.enum(MOTIVOS_EGRESO, {
        error: "Seleccioná un motivo de egreso válido.",
      }),
      observacion: observacionMovimientoSchema,
    })
    .strict(),
]);

const optionalPositiveInt = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce
    .number({ error: "El producto debe ser un número." })
    .int("El producto debe ser un entero.")
    .min(1, "El producto debe ser mayor a cero.")
    .optional()
);

const optionalFechaISO = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD.")
    .optional()
);

export const listarMovimientosStockQuerySchema = z.object({
  productoId: optionalPositiveInt,
  tipo: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z
      .enum(TIPOS_MOVIMIENTO_STOCK, {
        error: "Tipo de movimiento inválido.",
      })
      .optional()
  ),
  desde: optionalFechaISO,
  hasta: optionalFechaISO,
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

export type RegistrarMovimientoStockInput = z.infer<
  typeof registrarMovimientoStockSchema
>;
export type ListarMovimientosStockQuery = z.infer<
  typeof listarMovimientosStockQuerySchema
>;
