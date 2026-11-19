import { z } from "zod";

const optionalPositiveInt = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce
    .number({ error: "El identificador debe ser un número." })
    .int("El identificador debe ser un entero.")
    .min(1, "El identificador debe ser mayor a cero.")
    .optional()
);

export const listarProductosQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  categoriaId: optionalPositiveInt,
  bajoMinimo: z.enum(["true", "false"]).optional(),
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

export const crearProductoSchema = z
  .object({
    codigo: z
      .string({ error: "El código es obligatorio." })
      .trim()
      .min(1, "El código es obligatorio.")
      .max(40, "El código no puede superar los 40 caracteres."),
    descripcion: z
      .string({ error: "La descripción es obligatoria." })
      .trim()
      .min(2, "La descripción debe tener al menos 2 caracteres.")
      .max(200, "La descripción no puede superar los 200 caracteres."),
    categoriaId: z
      .number({ error: "La categoría es obligatoria." })
      .int("La categoría debe ser un identificador entero.")
      .min(1, "Seleccioná una categoría válida."),
    precio: z
      .number({ error: "El precio es obligatorio." })
      .int("El precio debe expresarse en centavos enteros.")
      .min(1, "El precio debe ser mayor a cero."),
    stockMinimo: z
      .number({ error: "El stock mínimo debe ser un número." })
      .int("El stock mínimo debe ser un entero.")
      .min(0, "El stock mínimo no puede ser negativo.")
      .optional()
      .default(0),
    stockInicial: z
      .number({ error: "El stock inicial debe ser un número." })
      .int("El stock inicial debe ser un entero.")
      .min(0, "El stock inicial no puede ser negativo.")
      .optional(),
  })
  .strict();

export const editarProductoSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(1, "El código es obligatorio.")
      .max(40, "El código no puede superar los 40 caracteres.")
      .optional(),
    descripcion: z
      .string()
      .trim()
      .min(2, "La descripción debe tener al menos 2 caracteres.")
      .max(200, "La descripción no puede superar los 200 caracteres.")
      .optional(),
    categoriaId: z
      .number({ error: "La categoría debe ser un número." })
      .int("La categoría debe ser un entero.")
      .min(1, "Seleccioná una categoría válida.")
      .optional(),
    precio: z
      .number({ error: "El precio debe ser un número." })
      .int("El precio debe expresarse en centavos enteros.")
      .min(1, "El precio debe ser mayor a cero.")
      .optional(),
    stockMinimo: z
      .number({ error: "El stock mínimo debe ser un número." })
      .int("El stock mínimo debe ser un entero.")
      .min(0, "El stock mínimo no puede ser negativo.")
      .optional(),
    activo: z
      .boolean({ error: "El estado activo debe ser verdadero o falso." })
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.codigo !== undefined ||
      data.descripcion !== undefined ||
      data.categoriaId !== undefined ||
      data.precio !== undefined ||
      data.stockMinimo !== undefined ||
      data.activo !== undefined,
    {
      message: "Debés enviar al menos un campo para actualizar.",
    }
  );

export type ListarProductosQuery = z.infer<typeof listarProductosQuerySchema>;
export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
export type CrearProductoFormInput = z.input<typeof crearProductoSchema>;
export type EditarProductoInput = z.infer<typeof editarProductoSchema>;
