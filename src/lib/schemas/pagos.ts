import { z } from "zod";

export const MEDIOS_PAGO = [
  "efectivo",
  "transferencia",
  "tarjeta_debito",
] as const;

export type MedioPago = (typeof MEDIOS_PAGO)[number];

export const registrarPagoSchema = z
  .object({
    importe: z
      .number({ error: "El importe es obligatorio." })
      .int("El importe debe expresarse en centavos enteros.")
      .min(1, "El importe debe ser mayor a cero."),
    medio: z.enum(MEDIOS_PAGO, {
      error: "Seleccioná un medio de pago válido.",
    }),
    observacion: z
      .string()
      .trim()
      .max(240, "La observación no puede superar los 240 caracteres.")
      .optional()
      .nullable(),
  })
  .strict();

export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>;
