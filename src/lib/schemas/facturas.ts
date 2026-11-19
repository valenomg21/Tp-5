import { z } from "zod";

export const FORMAS_PAGO = ["contado", "tarjeta", "cuenta_corriente"] as const;
export type FormaPago = (typeof FORMAS_PAGO)[number];

export const ESTADOS_FACTURA = ["emitida", "anulada"] as const;
export type EstadoFactura = (typeof ESTADOS_FACTURA)[number];

export const TIPOS_TARJETA = ["debito", "credito"] as const;
export type TipoTarjeta = (typeof TIPOS_TARJETA)[number];

export const facturaItemInputSchema = z
  .object({
    productoId: z
      .number({ error: "El producto es obligatorio." })
      .int("El identificador del producto debe ser entero.")
      .min(1, "Seleccioná un producto válido."),
    cantidad: z
      .number({ error: "La cantidad es obligatoria." })
      .int("La cantidad debe ser un entero.")
      .min(1, "La cantidad debe ser mayor a cero."),
  })
  .strict();

export const pagoTarjetaSchema = z
  .object({
    tipo: z.enum(TIPOS_TARJETA, {
      error: "Seleccioná si la tarjeta es de débito o crédito.",
    }),
    marca: z
      .string({ error: "La marca de la tarjeta es obligatoria." })
      .trim()
      .min(2, "Ingresá la marca de la tarjeta.")
      .max(40, "La marca no puede superar los 40 caracteres."),
    ultimos4: z
      .string({ error: "Ingresá los últimos 4 dígitos de la tarjeta." })
      .trim()
      .regex(/^\d{4}$/, "Ingresá exactamente los últimos 4 dígitos numéricos."),
  })
  .strict();

export const pagoFacturaSchema = z.discriminatedUnion("forma", [
  z
    .object({
      forma: z.literal("contado"),
      montoRecibido: z
        .number({ error: "El monto recibido debe ser numérico." })
        .int("El monto recibido debe expresarse en centavos enteros.")
        .min(0, "El monto recibido no puede ser negativo.")
        .optional()
        .nullable(),
    })
    .strict(),
  z
    .object({
      forma: z.literal("tarjeta"),
      tarjeta: pagoTarjetaSchema,
    })
    .strict(),
  z
    .object({
      forma: z.literal("cuenta_corriente"),
    })
    .strict(),
]);

export const emitirFacturaSchema = z
  .object({
    clienteId: z
      .number({ error: "El identificador de cliente debe ser numérico." })
      .int("El identificador de cliente debe ser entero.")
      .min(1, "Cliente inválido.")
      .nullable()
      .optional()
      .default(null),
    items: z
      .array(facturaItemInputSchema, {
        error: "Debés agregar al menos un producto.",
      })
      .min(1, "Debés agregar al menos un producto.")
      .superRefine((items, ctx) => {
        const vistos = new Set<number>();
        items.forEach((item, idx) => {
          if (vistos.has(item.productoId)) {
            ctx.addIssue({
              code: "custom",
              path: [idx, "productoId"],
              message: "No se permiten productos repetidos en la factura.",
            });
          }
          vistos.add(item.productoId);
        });
      }),
    pago: pagoFacturaSchema,
  })
  .strict();

export const anularFacturaSchema = z
  .object({
    motivo: z
      .string({ error: "El motivo de anulación es obligatorio." })
      .trim()
      .min(3, "El motivo debe tener al menos 3 caracteres.")
      .max(300, "El motivo no puede superar los 300 caracteres."),
  })
  .strict();

const optionalPositiveInt = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce
    .number({ error: "El identificador debe ser numérico." })
    .int("El identificador debe ser entero.")
    .min(1, "Debe ser mayor a cero.")
    .optional()
);

const optionalFechaISO = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD.")
    .optional()
);

export const listarFacturasQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  desde: optionalFechaISO,
  hasta: optionalFechaISO,
  clienteId: optionalPositiveInt,
  vendedorId: optionalPositiveInt,
  forma: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(FORMAS_PAGO, { error: "Forma de pago inválida." }).optional()
  ),
  estado: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(ESTADOS_FACTURA, { error: "Estado de factura inválido." }).optional()
  ),
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

export type EmitirFacturaInput = z.infer<typeof emitirFacturaSchema>;
export type AnularFacturaInput = z.infer<typeof anularFacturaSchema>;
export type ListarFacturasQuery = z.infer<typeof listarFacturasQuerySchema>;
