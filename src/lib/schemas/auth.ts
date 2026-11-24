import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ error: "El email es obligatorio." })
    .trim()
    .min(1, "El email es obligatorio.")
    .email("Ingresá un email válido."),
  password: z
    .string({ error: "La contraseña es obligatoria." })
    .min(1, "La contraseña es obligatoria."),
});

export const loginDemoSchema = z
  .object({
    rol: z.enum(["admin", "vendedor"], {
      error: "Seleccioná un rol demo válido.",
    }),
  })
  .strict();

export const cambiarPasswordSchema = z.object({
  actual: z
    .string({ error: "La contraseña actual es obligatoria." })
    .min(1, "La contraseña actual es obligatoria."),
  nueva: z
    .string({ error: "La nueva contraseña es obligatoria." })
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
    .max(128, "La nueva contraseña no puede superar los 128 caracteres."),
});

export const cambiarPasswordFormSchema = cambiarPasswordSchema
  .extend({
    confirmacion: z
      .string({ error: "Confirmá la nueva contraseña." })
      .min(1, "Confirmá la nueva contraseña."),
  })
  .refine((data) => data.nueva === data.confirmacion, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginDemoInput = z.infer<typeof loginDemoSchema>;
export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>;
export type CambiarPasswordFormInput = z.infer<typeof cambiarPasswordFormSchema>;
