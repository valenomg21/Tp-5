import { z } from "zod";

export const rolUsuarioSchema = z.enum(["admin", "vendedor"], {
  error: "El rol debe ser admin o vendedor.",
});

export const listarUsuariosQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  activo: z.enum(["true", "false", "todos"]).optional().default("todos"),
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

export const crearUsuarioSchema = z.object({
  nombre: z
    .string({ error: "El nombre es obligatorio." })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(120, "El nombre no puede superar los 120 caracteres."),
  email: z
    .string({ error: "El email es obligatorio." })
    .trim()
    .min(1, "El email es obligatorio.")
    .email("Ingresá un email válido.")
    .max(160, "El email no puede superar los 160 caracteres."),
  rol: rolUsuarioSchema,
  password: z
    .string({ error: "La contraseña es obligatoria." })
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(128, "La contraseña no puede superar los 128 caracteres."),
});

export const editarUsuarioSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(120, "El nombre no puede superar los 120 caracteres.")
      .optional(),
    email: z
      .string()
      .trim()
      .email("Ingresá un email válido.")
      .max(160, "El email no puede superar los 160 caracteres.")
      .optional(),
    rol: rolUsuarioSchema.optional(),
    activo: z
      .boolean({ error: "El estado activo debe ser verdadero o falso." })
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.nombre !== undefined ||
      data.email !== undefined ||
      data.rol !== undefined ||
      data.activo !== undefined,
    {
      message: "Debés enviar al menos un campo para actualizar.",
    }
  );

export type ListarUsuariosQuery = z.infer<typeof listarUsuariosQuerySchema>;
export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;
