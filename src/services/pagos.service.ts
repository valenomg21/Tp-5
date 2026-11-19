import { and, eq, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { clientes, movimientosCuenta, pagos, usuarios } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import { formatearNumeroRecibo } from "@/lib/format";
import { registrarPagoSchema, type MedioPago } from "@/lib/schemas/pagos";
import type { UsuarioSesion } from "@/lib/session";
import { calcularSaldoCliente } from "@/services/clientes.service";

export interface PagoReciboPublico {
  id: number;
  numeroRecibo: string;
  fecha: string;
  cliente: {
    id: number;
    nombre: string;
    tipoDoc: "DNI" | "CUIT";
    nroDoc: string;
    domicilio: string | null;
  };
  importe: number;
  medio: MedioPago;
  observacion: string | null;
  usuario: {
    id: number;
    nombre: string;
  };
  saldoCliente: number;
}

const PUNTO_VENTA_DEFAULT = 1;

function exigirRolValido(usuario: UsuarioSesion) {
  if (usuario.rol !== "admin" && usuario.rol !== "vendedor") {
    throw new ApiError(403, "SIN_PERMISO", "No tiene permisos suficientes.");
  }
}

// RF-C5, Regla 4, 7, 8 y 11: registra pago en cuenta corriente con recibo correlativo y crédito atómico.
export async function registrarPago(
  usuario: UsuarioSesion,
  clienteId: number,
  datosSinValidar: unknown
): Promise<PagoReciboPublico> {
  exigirRolValido(usuario);

  const parsed = registrarPagoSchema.parse(datosSinValidar);
  const observacionLimpia = parsed.observacion?.trim() || null;

  return db.transaction(async (tx) => {
    const [cliente] = await tx
      .select({
        id: clientes.id,
        nombre: clientes.nombre,
        tipoDoc: clientes.tipoDoc,
        nroDoc: clientes.nroDoc,
        domicilio: clientes.domicilio,
        cuentaCorriente: clientes.cuentaCorriente,
        activo: clientes.activo,
      })
      .from(clientes)
      .where(eq(clientes.id, clienteId))
      .limit(1);

    if (!cliente) {
      throw new ApiError(404, "NO_ENCONTRADO", "El cliente no existe.");
    }

    if (!cliente.activo || !cliente.cuentaCorriente) {
      throw new ApiError(
        422,
        "CUENTA_CORRIENTE_NO_HABILITADA",
        "El cliente no tiene cuenta corriente habilitada."
      );
    }

    const saldoActual = await calcularSaldoCliente(tx, clienteId);

    if (parsed.importe > saldoActual) {
      throw new ApiError(
        422,
        "PAGO_SUPERA_DEUDA",
        "El importe del pago supera la deuda actual del cliente.",
        [
          {
            campo: "importe",
            mensaje: "El importe supera el saldo adeudado.",
          },
        ]
      );
    }

    const [ultimo] = await tx
      .select({
        maxNumero: sql<number>`coalesce(max(${pagos.numero}), 0)`,
      })
      .from(pagos)
      .where(eq(pagos.puntoVenta, PUNTO_VENTA_DEFAULT));

    const numero = Number(ultimo?.maxNumero ?? 0) + 1;
    const numeroRecibo = formatearNumeroRecibo(PUNTO_VENTA_DEFAULT, numero);
    const fechaPago = new Date().toISOString();

    const [pago] = await tx
      .insert(pagos)
      .values({
        puntoVenta: PUNTO_VENTA_DEFAULT,
        numero,
        numeroRecibo,
        clienteId,
        usuarioId: usuario.id,
        fecha: fechaPago,
        importe: parsed.importe,
        medio: parsed.medio,
        observacion: observacionLimpia,
      })
      .returning();

    await tx.insert(movimientosCuenta).values({
      clienteId,
      tipo: "credito",
      importe: parsed.importe,
      descripcion: `Recibo ${numeroRecibo}`,
      facturaId: null,
      pagoId: pago.id,
      fecha: fechaPago,
    });

    const saldoCliente = saldoActual - parsed.importe;

    return {
      id: pago.id,
      numeroRecibo: pago.numeroRecibo,
      fecha: pago.fecha,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        tipoDoc: cliente.tipoDoc,
        nroDoc: cliente.nroDoc,
        domicilio: cliente.domicilio,
      },
      importe: pago.importe,
      medio: pago.medio,
      observacion: pago.observacion,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
      },
      saldoCliente,
    };
  });
}

// RF-C5: devuelve el detalle completo del recibo de pago para reimpresión.
export async function obtenerPagoPorId(
  usuario: UsuarioSesion,
  pagoId: number
): Promise<PagoReciboPublico> {
  exigirRolValido(usuario);

  const [fila] = await db
    .select({
      id: pagos.id,
      numeroRecibo: pagos.numeroRecibo,
      fecha: pagos.fecha,
      importe: pagos.importe,
      medio: pagos.medio,
      observacion: pagos.observacion,
      clienteId: clientes.id,
      clienteNombre: clientes.nombre,
      clienteTipoDoc: clientes.tipoDoc,
      clienteNroDoc: clientes.nroDoc,
      clienteDomicilio: clientes.domicilio,
      usuarioId: usuarios.id,
      usuarioNombre: usuarios.nombre,
    })
    .from(pagos)
    .innerJoin(clientes, eq(pagos.clienteId, clientes.id))
    .innerJoin(usuarios, eq(pagos.usuarioId, usuarios.id))
    .where(eq(pagos.id, pagoId))
    .limit(1);

  if (!fila) {
    throw new ApiError(404, "NO_ENCONTRADO", "El recibo de pago no existe.");
  }

  const [movimientoPago] = await db
    .select({
      id: movimientosCuenta.id,
      fecha: movimientosCuenta.fecha,
    })
    .from(movimientosCuenta)
    .where(eq(movimientosCuenta.pagoId, pagoId))
    .limit(1);

  let saldoCliente: number;
  if (movimientoPago) {
    const [saldoHastaPago] = await db
      .select({
        saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
      })
      .from(movimientosCuenta)
      .where(
        and(
          eq(movimientosCuenta.clienteId, fila.clienteId),
          or(
            lt(movimientosCuenta.fecha, movimientoPago.fecha),
            and(
              eq(movimientosCuenta.fecha, movimientoPago.fecha),
              lte(movimientosCuenta.id, movimientoPago.id)
            )
          )
        )
      );
    saldoCliente = Number(saldoHastaPago?.saldo ?? 0);
  } else {
    saldoCliente = await calcularSaldoCliente(db, fila.clienteId);
  }

  return {
    id: fila.id,
    numeroRecibo: fila.numeroRecibo,
    fecha: fila.fecha,
    cliente: {
      id: fila.clienteId,
      nombre: fila.clienteNombre,
      tipoDoc: fila.clienteTipoDoc,
      nroDoc: fila.clienteNroDoc,
      domicilio: fila.clienteDomicilio,
    },
    importe: fila.importe,
    medio: fila.medio,
    observacion: fila.observacion,
    usuario: {
      id: fila.usuarioId,
      nombre: fila.usuarioNombre,
    },
    saldoCliente,
  };
}
