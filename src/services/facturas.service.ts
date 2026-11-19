import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import {
  clientes,
  facturaItems,
  facturas,
  movimientosCuenta,
  productos,
  usuarios,
} from "@/db/schema";
import { ApiError } from "@/lib/errors";
import { formatearNumeroFactura, rangoDiaArgentinaAUTC } from "@/lib/format";
import {
  anularFacturaSchema,
  emitirFacturaSchema,
  listarFacturasQuerySchema,
  type EstadoFactura,
  type FormaPago,
  type TipoTarjeta,
} from "@/lib/schemas/facturas";
import { exigirAdmin, type UsuarioSesion } from "@/lib/session";
import { calcularSaldoCliente } from "@/services/clientes.service";
import { moverStock } from "@/services/stock.service";

export type PagoFacturaPublico =
  | {
      forma: "contado";
      montoRecibido: number;
      vuelto: number;
    }
  | {
      forma: "tarjeta";
      tarjeta: {
        tipo: TipoTarjeta;
        marca: string;
        ultimos4: string;
      };
    }
  | {
      forma: "cuenta_corriente";
    };

export interface FacturaItemPublico {
  productoId: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface FacturaDetallePublica {
  id: number;
  puntoVenta: number;
  numero: number;
  numeroFormateado: string;
  fecha: string;
  estado: EstadoFactura;
  cliente: {
    id: number;
    nombre: string;
    tipoDoc: "DNI" | "CUIT";
    nroDoc: string;
    domicilio: string | null;
  } | null;
  vendedor: {
    id: number;
    nombre: string;
  };
  items: FacturaItemPublico[];
  total: number;
  pago: PagoFacturaPublico;
  saldoCliente?: number;
  anulacion?: {
    fecha: string;
    motivo: string;
    usuario: {
      id: number;
      nombre: string;
    };
  };
}

export interface FacturaResumenPublica {
  id: number;
  puntoVenta: number;
  numero: number;
  numeroFormateado: string;
  fecha: string;
  estado: EstadoFactura;
  cliente: {
    id: number;
    nombre: string;
  } | null;
  vendedor: {
    id: number;
    nombre: string;
  };
  formaPago: FormaPago;
  total: number;
}

export interface ListadoFacturasResultado {
  data: FacturaResumenPublica[];
  page: number;
  pageSize: number;
  total: number;
  totalEmitido: number;
}

const PUNTO_VENTA_DEFAULT = 1;

function exigirRolValido(usuario: UsuarioSesion) {
  if (usuario.rol !== "admin" && usuario.rol !== "vendedor") {
    throw new ApiError(403, "SIN_PERMISO", "No tiene permisos suficientes.");
  }
}

function construirPagoPublico(fila: {
  formaPago: FormaPago;
  total: number;
  montoRecibido: number | null;
  tarjetaTipo: TipoTarjeta | null;
  tarjetaMarca: string | null;
  tarjetaUltimos4: string | null;
}): PagoFacturaPublico {
  if (fila.formaPago === "contado") {
    const montoRecibido = fila.montoRecibido ?? fila.total;
    return {
      forma: "contado",
      montoRecibido,
      vuelto: Math.max(0, montoRecibido - fila.total),
    };
  }

  if (fila.formaPago === "tarjeta") {
    return {
      forma: "tarjeta",
      tarjeta: {
        tipo: fila.tarjetaTipo ?? "debito",
        marca: fila.tarjetaMarca ?? "",
        ultimos4: fila.tarjetaUltimos4 ?? "",
      },
    };
  }

  return { forma: "cuenta_corriente" };
}

// RF-V1 a RF-V6, Reglas 1-7, 9-11: emite una factura de forma atómica validando stock, precios, pago y cuenta corriente.
export async function emitirFactura(
  usuario: UsuarioSesion,
  datosSinValidar: unknown,
  opciones?: { fecha?: string }
): Promise<FacturaDetallePublica> {
  exigirRolValido(usuario);

  const parsed = emitirFacturaSchema.parse(datosSinValidar);
  const fechaFactura = opciones?.fecha ?? new Date().toISOString();

  return db.transaction(async (tx) => {
    // Paso 1: validar que todos los productos existan y estén activos.
    const productIds = parsed.items.map((i) => i.productoId);
    const productosEncontrados = await tx
      .select({
        id: productos.id,
        codigo: productos.codigo,
        descripcion: productos.descripcion,
        precio: productos.precio,
        existencia: productos.existencia,
        activo: productos.activo,
      })
      .from(productos)
      .where(inArray(productos.id, productIds));

    const productosMap = new Map(productosEncontrados.map((p) => [p.id, p]));

    for (const item of parsed.items) {
      const prod = productosMap.get(item.productoId);
      if (!prod) {
        throw new ApiError(
          404,
          "NO_ENCONTRADO",
          `El producto #${item.productoId} no existe.`
        );
      }
      if (!prod.activo) {
        throw new ApiError(
          422,
          "PRODUCTO_INACTIVO",
          `El producto ${prod.codigo} (${prod.descripcion}) está dado de baja.`
        );
      }
    }

    // Paso 2: si hay cliente, verificar activo; si es cuenta corriente, verificar habilitación.
    let clienteFila: {
      id: number;
      nombre: string;
      tipoDoc: "DNI" | "CUIT";
      nroDoc: string;
      domicilio: string | null;
      cuentaCorriente: boolean;
      limiteCredito: number | null;
      activo: boolean;
    } | null = null;

    if (parsed.clienteId !== null) {
      const [cli] = await tx
        .select({
          id: clientes.id,
          nombre: clientes.nombre,
          tipoDoc: clientes.tipoDoc,
          nroDoc: clientes.nroDoc,
          domicilio: clientes.domicilio,
          cuentaCorriente: clientes.cuentaCorriente,
          limiteCredito: clientes.limiteCredito,
          activo: clientes.activo,
        })
        .from(clientes)
        .where(eq(clientes.id, parsed.clienteId))
        .limit(1);

      if (!cli) {
        throw new ApiError(404, "NO_ENCONTRADO", "El cliente no existe.");
      }
      if (!cli.activo) {
        throw new ApiError(
          422,
          "VALIDACION",
          "El cliente seleccionado está inactivo.",
          [{ campo: "clienteId", mensaje: "El cliente está inactivo." }]
        );
      }
      clienteFila = cli;
    }

    if (parsed.pago.forma === "cuenta_corriente") {
      if (!clienteFila || !clienteFila.cuentaCorriente) {
        throw new ApiError(
          422,
          "CUENTA_CORRIENTE_NO_HABILITADA",
          "Para vender en cuenta corriente el comprador debe ser un cliente registrado y habilitado."
        );
      }
    }

    // Paso 3: comprobar existencia disponible por producto.
    const faltantes: Array<{
      productoId: number;
      solicitado: number;
      disponible: number;
    }> = [];

    for (const item of parsed.items) {
      const prod = productosMap.get(item.productoId)!;
      if (prod.existencia < item.cantidad) {
        faltantes.push({
          productoId: item.productoId,
          solicitado: item.cantidad,
          disponible: prod.existencia,
        });
      }
    }

    if (faltantes.length > 0) {
      throw new ApiError(
        409,
        "STOCK_INSUFICIENTE",
        "No hay stock suficiente para completar la venta.",
        faltantes
      );
    }

    // Paso 4: calcular subtotales y total usando precios del servidor (Regla 3).
    const renglonesCalculados: FacturaItemPublico[] = parsed.items.map((item) => {
      const prod = productosMap.get(item.productoId)!;
      const subtotal = prod.precio * item.cantidad;
      return {
        productoId: prod.id,
        codigo: prod.codigo,
        descripcion: prod.descripcion,
        cantidad: item.cantidad,
        precioUnitario: prod.precio,
        subtotal,
      };
    });

    const total = renglonesCalculados.reduce(
      (acc, r) => acc + r.subtotal,
      0
    );

    // Paso 5: validar monto contado o límite de crédito en cuenta corriente.
    let montoRecibido: number | null = null;
    let saldoClienteNuevo: number | undefined;

    if (parsed.pago.forma === "contado") {
      montoRecibido = parsed.pago.montoRecibido ?? total;
      if (montoRecibido < total) {
        throw new ApiError(
          422,
          "MONTO_INSUFICIENTE",
          "El monto recibido no cubre el total de la factura.",
          [
            {
              campo: "pago.montoRecibido",
              mensaje: "El monto recibido debe ser mayor o igual al total.",
            },
          ]
        );
      }
    } else if (parsed.pago.forma === "cuenta_corriente") {
      const saldoActual = await calcularSaldoCliente(tx, clienteFila!.id);
      const saldoNuevo = saldoActual + total;
      if (
        clienteFila!.limiteCredito !== null &&
        saldoNuevo > clienteFila!.limiteCredito
      ) {
        throw new ApiError(
          422,
          "LIMITE_CREDITO_EXCEDIDO",
          "La venta supera el límite de crédito asignado al cliente.",
          {
            saldoActual,
            limite: clienteFila!.limiteCredito,
            excedente: saldoNuevo - clienteFila!.limiteCredito,
          }
        );
      }
      saldoClienteNuevo = saldoNuevo;
    }

    // Paso 6: asignar próximo número correlativo sin huecos (Regla 4).
    const [ultimo] = await tx
      .select({
        maxNumero: sql<number>`coalesce(max(${facturas.numero}), 0)`,
      })
      .from(facturas)
      .where(eq(facturas.puntoVenta, PUNTO_VENTA_DEFAULT));

    const numero = Number(ultimo?.maxNumero ?? 0) + 1;
    const numeroFormateado = formatearNumeroFactura(PUNTO_VENTA_DEFAULT, numero);

    // Paso 7: grabar factura y sus renglones congelados.
    const [factura] = await tx
      .insert(facturas)
      .values({
        puntoVenta: PUNTO_VENTA_DEFAULT,
        numero,
        fecha: fechaFactura,
        clienteId: clienteFila ? clienteFila.id : null,
        usuarioId: usuario.id,
        total,
        formaPago: parsed.pago.forma,
        montoRecibido,
        tarjetaTipo:
          parsed.pago.forma === "tarjeta" ? parsed.pago.tarjeta.tipo : null,
        tarjetaMarca:
          parsed.pago.forma === "tarjeta" ? parsed.pago.tarjeta.marca : null,
        tarjetaUltimos4:
          parsed.pago.forma === "tarjeta" ? parsed.pago.tarjeta.ultimos4 : null,
        estado: "emitida",
      })
      .returning();

    await tx.insert(facturaItems).values(
      renglonesCalculados.map((r) => ({
        facturaId: factura.id,
        productoId: r.productoId,
        codigo: r.codigo,
        descripcion: r.descripcion,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        subtotal: r.subtotal,
        creadoEn: fechaFactura,
      }))
    );

    // Paso 8: descontar existencias y registrar movimiento de stock atómico por renglón.
    for (const r of renglonesCalculados) {
      await moverStock(tx, {
        productoId: r.productoId,
        tipo: "venta",
        cantidad: r.cantidad,
        motivo: `Venta factura ${numeroFormateado}`,
        facturaId: factura.id,
        usuarioId: usuario.id,
        fecha: fechaFactura,
      });
    }

    // Paso 9: si es cuenta corriente, registrar el débito en la cuenta del cliente.
    if (parsed.pago.forma === "cuenta_corriente" && clienteFila) {
      await tx.insert(movimientosCuenta).values({
        clienteId: clienteFila.id,
        tipo: "debito",
        importe: total,
        descripcion: `Factura ${numeroFormateado}`,
        facturaId: factura.id,
        pagoId: null,
        fecha: fechaFactura,
        creadoEn: fechaFactura,
      });
    }

    return {
      id: factura.id,
      puntoVenta: factura.puntoVenta,
      numero: factura.numero,
      numeroFormateado,
      fecha: factura.fecha,
      estado: factura.estado,
      cliente: clienteFila
        ? {
            id: clienteFila.id,
            nombre: clienteFila.nombre,
            tipoDoc: clienteFila.tipoDoc,
            nroDoc: clienteFila.nroDoc,
            domicilio: clienteFila.domicilio,
          }
        : null,
      vendedor: {
        id: usuario.id,
        nombre: usuario.nombre,
      },
      items: renglonesCalculados,
      total: factura.total,
      pago: construirPagoPublico(factura),
      ...(saldoClienteNuevo !== undefined
        ? { saldoCliente: saldoClienteNuevo }
        : {}),
    };
  });
}

// RF-V7: detalle completo de una factura (incluye datos de anulación si corresponde).
export async function obtenerFacturaPorId(
  usuario: UsuarioSesion,
  id: number
): Promise<FacturaDetallePublica> {
  exigirRolValido(usuario);

  const vendedorUser = alias(usuarios, "vendedor_user");
  const anuladorUser = alias(usuarios, "anulador_user");

  const [fila] = await db
    .select({
      id: facturas.id,
      puntoVenta: facturas.puntoVenta,
      numero: facturas.numero,
      fecha: facturas.fecha,
      estado: facturas.estado,
      total: facturas.total,
      formaPago: facturas.formaPago,
      montoRecibido: facturas.montoRecibido,
      tarjetaTipo: facturas.tarjetaTipo,
      tarjetaMarca: facturas.tarjetaMarca,
      tarjetaUltimos4: facturas.tarjetaUltimos4,
      motivoAnulacion: facturas.motivoAnulacion,
      anuladaEn: facturas.anuladaEn,
      clienteId: clientes.id,
      clienteNombre: clientes.nombre,
      clienteTipoDoc: clientes.tipoDoc,
      clienteNroDoc: clientes.nroDoc,
      clienteDomicilio: clientes.domicilio,
      vendedorId: vendedorUser.id,
      vendedorNombre: vendedorUser.nombre,
      anuladorId: anuladorUser.id,
      anuladorNombre: anuladorUser.nombre,
    })
    .from(facturas)
    .innerJoin(vendedorUser, eq(facturas.usuarioId, vendedorUser.id))
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .leftJoin(anuladorUser, eq(facturas.anuladaPorId, anuladorUser.id))
    .where(eq(facturas.id, id))
    .limit(1);

  if (!fila) {
    throw new ApiError(404, "NO_ENCONTRADO", "La factura no existe.");
  }

  const items = await db
    .select({
      productoId: facturaItems.productoId,
      codigo: facturaItems.codigo,
      descripcion: facturaItems.descripcion,
      cantidad: facturaItems.cantidad,
      precioUnitario: facturaItems.precioUnitario,
      subtotal: facturaItems.subtotal,
    })
    .from(facturaItems)
    .where(eq(facturaItems.facturaId, id))
    .orderBy(asc(facturaItems.id));

  const resultado: FacturaDetallePublica = {
    id: fila.id,
    puntoVenta: fila.puntoVenta,
    numero: fila.numero,
    numeroFormateado: formatearNumeroFactura(fila.puntoVenta, fila.numero),
    fecha: fila.fecha,
    estado: fila.estado,
    cliente:
      fila.clienteId !== null &&
      fila.clienteNombre !== null &&
      fila.clienteTipoDoc !== null &&
      fila.clienteNroDoc !== null
        ? {
            id: fila.clienteId,
            nombre: fila.clienteNombre,
            tipoDoc: fila.clienteTipoDoc,
            nroDoc: fila.clienteNroDoc,
            domicilio: fila.clienteDomicilio,
          }
        : null,
    vendedor: {
      id: fila.vendedorId,
      nombre: fila.vendedorNombre,
    },
    items,
    total: fila.total,
    pago: construirPagoPublico(fila),
  };

  if (
    fila.estado === "anulada" &&
    fila.anuladaEn &&
    fila.motivoAnulacion &&
    fila.anuladorId !== null &&
    fila.anuladorNombre !== null
  ) {
    resultado.anulacion = {
      fecha: fila.anuladaEn,
      motivo: fila.motivoAnulacion,
      usuario: {
        id: fila.anuladorId,
        nombre: fila.anuladorNombre,
      },
    };
  }

  return resultado;
}

// RF-V9, Reglas 2, 5 y 7: anulación de factura (solo admin), reingresa stock y acredita cuenta corriente.
export async function anularFactura(
  usuario: UsuarioSesion,
  facturaId: number,
  datosSinValidar: unknown
): Promise<FacturaDetallePublica> {
  exigirAdmin(usuario);

  const { motivo } = anularFacturaSchema.parse(datosSinValidar);
  const fechaAnulacion = new Date().toISOString();

  await db.transaction(async (tx) => {
    const [existente] = await tx
      .select({
        id: facturas.id,
        puntoVenta: facturas.puntoVenta,
        numero: facturas.numero,
        clienteId: facturas.clienteId,
        total: facturas.total,
        formaPago: facturas.formaPago,
        estado: facturas.estado,
      })
      .from(facturas)
      .where(eq(facturas.id, facturaId))
      .limit(1);

    if (!existente) {
      throw new ApiError(404, "NO_ENCONTRADO", "La factura no existe.");
    }

    if (existente.estado === "anulada") {
      throw new ApiError(
        409,
        "FACTURA_ANULADA",
        "La factura ya fue anulada previamente."
      );
    }

    const [actualizada] = await tx
      .update(facturas)
      .set({
        estado: "anulada",
        motivoAnulacion: motivo,
        anuladaEn: fechaAnulacion,
        anuladaPorId: usuario.id,
      })
      .where(and(eq(facturas.id, facturaId), eq(facturas.estado, "emitida")))
      .returning({ id: facturas.id });

    if (!actualizada) {
      throw new ApiError(
        409,
        "FACTURA_ANULADA",
        "La factura ya fue anulada previamente."
      );
    }

    const numeroFormateado = formatearNumeroFactura(
      existente.puntoVenta,
      existente.numero
    );

    const renglones = await tx
      .select({
        productoId: facturaItems.productoId,
        cantidad: facturaItems.cantidad,
      })
      .from(facturaItems)
      .where(eq(facturaItems.facturaId, facturaId));

    for (const r of renglones) {
      await moverStock(tx, {
        productoId: r.productoId,
        tipo: "anulacion",
        cantidad: r.cantidad,
        motivo: `Anulación factura ${numeroFormateado}`,
        observacion: motivo,
        facturaId,
        usuarioId: usuario.id,
        fecha: fechaAnulacion,
      });
    }

    if (
      existente.formaPago === "cuenta_corriente" &&
      existente.clienteId !== null
    ) {
      await tx.insert(movimientosCuenta).values({
        clienteId: existente.clienteId,
        tipo: "credito",
        importe: existente.total,
        descripcion: `Anulación factura ${numeroFormateado}`,
        facturaId,
        pagoId: null,
        fecha: fechaAnulacion,
        creadoEn: fechaAnulacion,
      });
    }
  });

  return obtenerFacturaPorId(usuario, facturaId);
}

// RF-V1, Regla 4: devuelve el próximo número correlativo informativo antes de confirmar.
export async function obtenerProximoNumero(
  usuario: UsuarioSesion
): Promise<{ numeroFormateado: string }> {
  exigirRolValido(usuario);

  const [ultimo] = await db
    .select({
      maxNumero: sql<number>`coalesce(max(${facturas.numero}), 0)`,
    })
    .from(facturas)
    .where(eq(facturas.puntoVenta, PUNTO_VENTA_DEFAULT));

  const proximo = Number(ultimo?.maxNumero ?? 0) + 1;
  return {
    numeroFormateado: formatearNumeroFactura(PUNTO_VENTA_DEFAULT, proximo),
  };
}

// RF-V8: listado paginado de facturas con filtros y suma total de emitidas que cumplen el filtro.
export async function listarFacturas(
  usuario: UsuarioSesion,
  querySinValidar: unknown
): Promise<ListadoFacturasResultado> {
  exigirRolValido(usuario);

  const parsed = listarFacturasQuerySchema.parse(querySinValidar);
  const condiciones: SQL[] = [];

  if (parsed.q) {
    const patron = `%${parsed.q.toLowerCase()}%`;
    const numeroFormateadoExpr = sql`printf('%04d-%08d', ${facturas.puntoVenta}, ${facturas.numero})`;
    const filtroTexto = or(
      sql`lower(${numeroFormateadoExpr}) like ${patron}`,
      sql`lower(coalesce(${clientes.nombre}, 'consumidor final')) like ${patron}`
    );
    if (filtroTexto) condiciones.push(filtroTexto);
  }

  if (parsed.desde !== undefined) {
    condiciones.push(
      gte(facturas.fecha, rangoDiaArgentinaAUTC(parsed.desde).inicio)
    );
  }

  if (parsed.hasta !== undefined) {
    condiciones.push(
      lte(facturas.fecha, rangoDiaArgentinaAUTC(parsed.hasta).fin)
    );
  }

  if (parsed.clienteId !== undefined) {
    condiciones.push(eq(facturas.clienteId, parsed.clienteId));
  }

  if (parsed.vendedorId !== undefined) {
    condiciones.push(eq(facturas.usuarioId, parsed.vendedorId));
  }

  if (parsed.forma !== undefined) {
    condiciones.push(eq(facturas.formaPago, parsed.forma));
  }

  if (parsed.estado !== undefined) {
    condiciones.push(eq(facturas.estado, parsed.estado));
  }

  const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

  const [agregado] = await db
    .select({
      total: sql<number>`count(*)`,
      totalEmitido: sql<number>`coalesce(sum(case when ${facturas.estado} = 'emitida' then ${facturas.total} else 0 end), 0)`,
    })
    .from(facturas)
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .where(whereClause);

  const total = Number(agregado?.total ?? 0);
  const totalEmitido = Number(agregado?.totalEmitido ?? 0);
  const offset = (parsed.page - 1) * parsed.pageSize;

  const filas = await db
    .select({
      id: facturas.id,
      puntoVenta: facturas.puntoVenta,
      numero: facturas.numero,
      fecha: facturas.fecha,
      estado: facturas.estado,
      formaPago: facturas.formaPago,
      total: facturas.total,
      clienteId: clientes.id,
      clienteNombre: clientes.nombre,
      vendedorId: usuarios.id,
      vendedorNombre: usuarios.nombre,
    })
    .from(facturas)
    .innerJoin(usuarios, eq(facturas.usuarioId, usuarios.id))
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .where(whereClause)
    .orderBy(desc(facturas.fecha), desc(facturas.id))
    .limit(parsed.pageSize)
    .offset(offset);

  const data: FacturaResumenPublica[] = filas.map((f) => ({
    id: f.id,
    puntoVenta: f.puntoVenta,
    numero: f.numero,
    numeroFormateado: formatearNumeroFactura(f.puntoVenta, f.numero),
    fecha: f.fecha,
    estado: f.estado,
    cliente:
      f.clienteId !== null && f.clienteNombre !== null
        ? { id: f.clienteId, nombre: f.clienteNombre }
        : null,
    vendedor: {
      id: f.vendedorId,
      nombre: f.vendedorNombre,
    },
    formaPago: f.formaPago,
    total: f.total,
  }));

  return {
    data,
    page: parsed.page,
    pageSize: parsed.pageSize,
    total,
    totalEmitido,
  };
}

// RF-V8: lista simple de usuarios para poblar el filtro por vendedor en /ventas.
export async function listarVendedoresParaFiltro(
  usuario: UsuarioSesion
): Promise<Array<{ id: number; nombre: string }>> {
  exigirRolValido(usuario);

  return db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
    })
    .from(usuarios)
    .orderBy(asc(usuarios.nombre));
}
