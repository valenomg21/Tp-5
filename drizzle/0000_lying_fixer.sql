CREATE TABLE `categorias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`activa` integer DEFAULT true NOT NULL,
	`creado_en` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categorias_nombre_unique` ON `categorias` (`nombre`);--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo_doc` text NOT NULL,
	`nro_doc` text NOT NULL,
	`nro_doc_normalizado` text NOT NULL,
	`nombre` text NOT NULL,
	`domicilio` text,
	`telefono` text,
	`email` text,
	`cuenta_corriente` integer DEFAULT false NOT NULL,
	`limite_credito` integer,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clientes_doc_unique` ON `clientes` (`tipo_doc`,`nro_doc_normalizado`);--> statement-breakpoint
CREATE INDEX `clientes_nro_doc_norm_idx` ON `clientes` (`nro_doc_normalizado`);--> statement-breakpoint
CREATE TABLE `factura_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`factura_id` integer NOT NULL,
	`producto_id` integer NOT NULL,
	`codigo` text NOT NULL,
	`descripcion` text NOT NULL,
	`cantidad` integer NOT NULL,
	`precio_unitario` integer NOT NULL,
	`subtotal` integer NOT NULL,
	`creado_en` text NOT NULL,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `factura_items_factura_idx` ON `factura_items` (`factura_id`);--> statement-breakpoint
CREATE INDEX `factura_items_producto_idx` ON `factura_items` (`producto_id`);--> statement-breakpoint
CREATE TABLE `facturas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`punto_venta` integer DEFAULT 1 NOT NULL,
	`numero` integer NOT NULL,
	`fecha` text NOT NULL,
	`cliente_id` integer,
	`usuario_id` integer NOT NULL,
	`total` integer NOT NULL,
	`forma_pago` text NOT NULL,
	`monto_recibido` integer,
	`tarjeta_tipo` text,
	`tarjeta_marca` text,
	`tarjeta_ultimos4` text,
	`estado` text DEFAULT 'emitida' NOT NULL,
	`motivo_anulacion` text,
	`anulada_en` text,
	`anulada_por_id` integer,
	`creado_en` text NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulada_por_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `facturas_punto_numero_unique` ON `facturas` (`punto_venta`,`numero`);--> statement-breakpoint
CREATE INDEX `facturas_fecha_idx` ON `facturas` (`fecha`);--> statement-breakpoint
CREATE INDEX `facturas_cliente_idx` ON `facturas` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `facturas_usuario_idx` ON `facturas` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `facturas_estado_idx` ON `facturas` (`estado`);--> statement-breakpoint
CREATE TABLE `movimientos_cuenta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`importe` integer NOT NULL,
	`descripcion` text NOT NULL,
	`factura_id` integer,
	`pago_id` integer,
	`fecha` text NOT NULL,
	`creado_en` text NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pago_id`) REFERENCES `pagos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `movimientos_cuenta_cliente_idx` ON `movimientos_cuenta` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `movimientos_cuenta_fecha_idx` ON `movimientos_cuenta` (`fecha`);--> statement-breakpoint
CREATE INDEX `movimientos_cuenta_factura_idx` ON `movimientos_cuenta` (`factura_id`);--> statement-breakpoint
CREATE INDEX `movimientos_cuenta_pago_idx` ON `movimientos_cuenta` (`pago_id`);--> statement-breakpoint
CREATE TABLE `movimientos_stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producto_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`cantidad` integer NOT NULL,
	`existencia_resultante` integer NOT NULL,
	`motivo` text NOT NULL,
	`observacion` text,
	`factura_id` integer,
	`usuario_id` integer NOT NULL,
	`fecha` text NOT NULL,
	`creado_en` text NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `movimientos_stock_producto_idx` ON `movimientos_stock` (`producto_id`);--> statement-breakpoint
CREATE INDEX `movimientos_stock_fecha_idx` ON `movimientos_stock` (`fecha`);--> statement-breakpoint
CREATE INDEX `movimientos_stock_factura_idx` ON `movimientos_stock` (`factura_id`);--> statement-breakpoint
CREATE INDEX `movimientos_stock_tipo_idx` ON `movimientos_stock` (`tipo`);--> statement-breakpoint
CREATE TABLE `pagos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`punto_venta` integer DEFAULT 1 NOT NULL,
	`numero` integer NOT NULL,
	`numero_recibo` text NOT NULL,
	`cliente_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`fecha` text NOT NULL,
	`importe` integer NOT NULL,
	`medio` text NOT NULL,
	`observacion` text,
	`creado_en` text NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pagos_numero_recibo_unique` ON `pagos` (`numero_recibo`);--> statement-breakpoint
CREATE UNIQUE INDEX `pagos_punto_numero_unique` ON `pagos` (`punto_venta`,`numero`);--> statement-breakpoint
CREATE INDEX `pagos_cliente_idx` ON `pagos` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `pagos_fecha_idx` ON `pagos` (`fecha`);--> statement-breakpoint
CREATE TABLE `productos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo` text NOT NULL,
	`descripcion` text NOT NULL,
	`categoria_id` integer NOT NULL,
	`precio` integer NOT NULL,
	`existencia` integer DEFAULT 0 NOT NULL,
	`stock_minimo` integer DEFAULT 0 NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` text NOT NULL,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productos_codigo_unique` ON `productos` (`codigo`);--> statement-breakpoint
CREATE INDEX `productos_categoria_idx` ON `productos` (`categoria_id`);--> statement-breakpoint
CREATE INDEX `productos_activo_idx` ON `productos` (`activo`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`nombre` text NOT NULL,
	`password_hash` text NOT NULL,
	`rol` text DEFAULT 'vendedor' NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);