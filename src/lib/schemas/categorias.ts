import { z } from "zod";

export const crearCategoriaSchema = z
  .object({
    nombre: z
      .string({ error: "El nombre es obligatorio." })
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(80, "El nombre no puede superar los 80 caracteres."),
  })
  .strict();

export const editarCategoriaSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(80, "El nombre no puede superar los 80 caracteres.")
      .optional(),
    activa: z
      .boolean({ error: "El estado activa debe ser verdadero o falso." })
      .optional(),
  })
  .strict()
  .refine((data) => data.nombre !== undefined || data.activa !== undefined, {
    message: "Debés enviar al menos un campo para actualizar.",
  });

export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>;
export type EditarCategoriaInput = z.infer<typeof editarCategoriaSchema>;
