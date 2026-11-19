import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  passwordHash: text("password_hash").notNull(),
  rol: text("rol", { enum: ["admin", "vendedor"] })
    .notNull()
    .default("vendedor"),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creadoEn: text("creado_en")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const categorias = sqliteTable("categorias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(),
  activa: integer("activa", { mode: "boolean" }).notNull().default(true),
  creadoEn: text("creado_en")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const productos = sqliteTable(
  "productos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    codigo: text("codigo").notNull().unique(),
    descripcion: text("descripcion").notNull(),
    categoriaId: integer("categoria_id")
      .notNull()
      .references(() => categorias.id),
    precio: integer("precio").notNull(),
    existencia: integer("existencia").notNull().default(0),
    stockMinimo: integer("stock_minimo").notNull().default(0),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),
    creadoEn: text("creado_en")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("productos_categoria_idx").on(table.categoriaId),
    index("productos_activo_idx").on(table.activo),
  ]
);

export const clientes = sqliteTable(
  "clientes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tipoDoc: text("tipo_doc", { enum: ["DNI", "CUIT"] }).notNull(),
    nroDoc: text("nro_doc").notNull(),
    nroDocNormalizado: text("nro_doc_normalizado").notNull(),
    nombre: text("nombre").notNull(),
    domicilio: text("domicilio"),
    telefono: text("telefono"),
    email: text("email"),
    cuentaCorriente: integer("cuenta_corriente", { mode: "boolean" })
      .notNull()
      .default(false),
    limiteCredito: integer("limite_credito"),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),
    creadoEn: text("creado_en")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("clientes_doc_unique").on(
      table.tipoDoc,
      table.nroDocNormalizado
    ),
    index("clientes_nro_doc_norm_idx").on(table.nroDocNormalizado),
  ]
);

export const facturas = sqliteTable(
  "facturas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    puntoVenta: integer("punto_venta").notNull().default(1),
    numero: integer("numero").notNull(),
    fecha: text("fecha")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    clienteId: integer("cliente_id").references(() => clientes.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    total: integer("total").notNull(),
    formaPago: text("forma_pago", {
      enum: ["contado", "tarjeta", "cuenta_corriente"],
    }).notNull(),
    montoRecibido: integer("monto_recibido"),
    tarjetaTipo: text("tarjeta_tipo", { enum: ["debito", "credito"] }),
    tarjetaMarca: text("tarjeta_marca"),
    tarjetaUltimos4: text("tarjeta_ultimos4"),
    estado: text("estado", { enum: ["emitida", "anulada"] })
      .notNull()
      .default("emitida"),
    motivoAnulacion: text("motivo_anulacion"),
    anuladaEn: text("anulada_en"),
    anuladaPorId: integer("anulada_por_id").references(() => usuarios.id),
    creadoEn: text("creado_en")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("facturas_punto_numero_unique").on(
      table.puntoVenta,
      table.numero
    ),
    index("facturas_fecha_idx").on(table.fecha),
    index("facturas_cliente_idx").on(table.clienteId),
    index("facturas_usuario_idx").on(table.usuarioId),
    index("facturas_estado_idx").on(table.estado),
  ]
);

export const facturaItems = sqliteTable(
  "factura_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    facturaId: integer("factura_id")
      .notNull()
      .references(() => facturas.id),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    codigo: text("codigo").notNull(),
    descripcion: text("descripcion").notNull(),
    cantidad: integer("cantidad").notNull(),
    precioUnitario: integer("precio_unitario").notNull(),
    subtotal: integer("subtotal").notNull(),
    creadoEn: text("creado_en")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("factura_items_factura_idx").on(table.facturaId),
    index("factura_items_producto_idx").on(table.productoId),
  ]
);

export const movimientosStock = sqliteTable(
  "movimientos_stock",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    tipo: text("tipo", {
      enum: ["venta", "anulacion", "ingreso", "egreso"],
    }).notNull(),
    cantidad: integer("cantidad").notNull(),
    existenciaResultante: integer("existencia_resultante").notNull(),
    motivo: text("motivo").notNull(),
    observacion: text("observacion"),
    facturaId: integer("factura_id").references(() => facturas.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    fecha: text("fecha")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    creadoEn: text("creado_en")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("movimientos_stock_producto_idx").on(table.productoId),
    index("movimientos_stock_fecha_idx").on(table.fecha),
    index("movimientos_stock_factura_idx").on(table.facturaId),
    index("movimientos_stock_tipo_idx").on(table.tipo),
  ]
);

export const pagos = sqliteTable(
  "pagos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    puntoVenta: integer("punto_venta").notNull().default(1),
    numero: integer("numero").notNull(),
    numeroRecibo: text("numero_recibo").notNull().unique(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    fecha: text("fecha")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    importe: integer("importe").notNull(),
    medio: text("medio", {
      enum: ["efectivo", "transferencia", "tarjeta_debito"],
    }).notNull(),
    observacion: text("observacion"),
    creadoEn: text("creado_en")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("pagos_punto_numero_unique").on(
      table.puntoVenta,
      table.numero
    ),
    index("pagos_cliente_idx").on(table.clienteId),
    index("pagos_fecha_idx").on(table.fecha),
  ]
);

export const movimientosCuenta = sqliteTable(
  "movimientos_cuenta",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    tipo: text("tipo", { enum: ["debito", "credito"] }).notNull(),
    importe: integer("importe").notNull(),
    descripcion: text("descripcion").notNull(),
    facturaId: integer("factura_id").references(() => facturas.id),
    pagoId: integer("pago_id").references(() => pagos.id),
    fecha: text("fecha")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    creadoEn: text("creado_en")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("movimientos_cuenta_cliente_idx").on(table.clienteId),
    index("movimientos_cuenta_fecha_idx").on(table.fecha),
    index("movimientos_cuenta_factura_idx").on(table.facturaId),
    index("movimientos_cuenta_pago_idx").on(table.pagoId),
  ]
);
