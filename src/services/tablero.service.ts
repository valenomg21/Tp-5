import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  clientes,
  facturaItems,
  facturas,
  movimientosCuenta,
  productos,
} from "@/db/schema";
import { ApiError } from "@/lib/errors";
import {
  obtenerFechaISOArgentina,
  rangoDiaArgentinaAUTC,
} from "@/lib/format";
import { FORMAS_PAGO, type FormaPago } from "@/lib/schemas/facturas";
import type { UsuarioSesion } from "@/lib/session";

export interface TableroMetricas {
  hoy: {
    cantidad: number;
    importe: number;
  };
  mes: {
    cantidad: number;
    importe: number;
    ticketPromedio: number;
  };
  cuentasCorrientes: {
    totalAdeudado: number;
    clientesConSaldo: number;
  };
  bajoMinimo: {
    cantidad: number;
  };
  ventasDiarias: {
    fecha: string;
    importe: number;
  }[];
  porFormaDePago: {
    forma: FormaPago;
    importe: number;
  }[];
  masVendidos: {
    productoId: number;
    codigo: string;
    descripcion: string;
    unidades: number;
    importe: number;
  }[];
}

function exigirRolValido(usuario: UsuarioSesion): void {
  if (usuario.rol !== "admin" && usuario.rol !== "vendedor") {
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "No tiene permisos para acceder al tablero."
    );
  }
}

function construirUltimosDiasISO(hoyISO: string, cantidad: number): string[] {
  const [anio, mes, dia] = hoyISO.split("-").map(Number);
  // Mediodía UTC evita desfases de calendario al restar días calendario.
  const baseUtcMs = Date.UTC(anio, mes - 1, dia, 12, 0, 0);
  const fechas: string[] = [];

  for (let i = cantidad - 1; i >= 0; i -= 1) {
    const fecha = new Date(baseUtcMs - i * 86_400_000);
    const y = fecha.getUTCFullYear();
    const m = String(fecha.getUTCMonth() + 1).padStart(2, "0");
    const d = String(fecha.getUTCDate()).padStart(2, "0");
    fechas.push(`${y}-${m}-${d}`);
  }

  return fechas;
}

// RF-T1, RF-T2, RF-T3, Sección 11.7: calcula métricas comerciales y alertas de stock.
// Solo considera facturas en estado "emitida" y agrupa día/mes en hora de Argentina.
export async function obtenerTablero(
  usuario: UsuarioSesion
): Promise<TableroMetricas> {
  exigirRolValido(usuario);

  const hoyISO = obtenerFechaISOArgentina();
  const inicioMesISO = `${hoyISO.slice(0, 7)}-01`;
  const ultimos30DiasISO = construirUltimosDiasISO(hoyISO, 30);
  const inicio30DiasISO = ultimos30DiasISO[0];

  const rangoMesInicio = rangoDiaArgentinaAUTC(inicioMesISO).inicio;
  const rango30DiasInicio = rangoDiaArgentinaAUTC(inicio30DiasISO).inicio;
  const rangoHoyFin = rangoDiaArgentinaAUTC(hoyISO).fin;
  const desdeMinimoUTC =
    rango30DiasInicio < rangoMesInicio ? rango30DiasInicio : rangoMesInicio;

  const saldosSq = db
    .select({
      clienteId: movimientosCuenta.clienteId,
      saldoCalculado:
        sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`.as(
          "saldo_calculado"
        ),
    })
    .from(movimientosCuenta)
    .groupBy(movimientosCuenta.clienteId)
    .as("saldos_tablero");

  const saldoExpr = sql<number>`coalesce(${saldosSq.saldoCalculado}, 0)`;

  const [facturasPeriodo, filasMasVendidos, [resumenDeuda], [resumenStock]] =
    await Promise.all([
      db
        .select({
          fecha: facturas.fecha,
          total: facturas.total,
          formaPago: facturas.formaPago,
        })
        .from(facturas)
        .where(
          and(
            eq(facturas.estado, "emitida"),
            gte(facturas.fecha, desdeMinimoUTC),
            lte(facturas.fecha, rangoHoyFin)
          )
        ),
      db
        .select({
          productoId: productos.id,
          codigo: productos.codigo,
          descripcion: productos.descripcion,
          unidades: sql<number>`coalesce(sum(${facturaItems.cantidad}), 0)`,
          importe: sql<number>`coalesce(sum(${facturaItems.subtotal}), 0)`,
        })
        .from(facturaItems)
        .innerJoin(facturas, eq(facturaItems.facturaId, facturas.id))
        .innerJoin(productos, eq(facturaItems.productoId, productos.id))
        .where(
          and(
            eq(facturas.estado, "emitida"),
            gte(facturas.fecha, rangoMesInicio),
            lte(facturas.fecha, rangoHoyFin)
          )
        )
        .groupBy(productos.id, productos.codigo, productos.descripcion)
        .orderBy(
          desc(sql`coalesce(sum(${facturaItems.cantidad}), 0)`),
          desc(sql`coalesce(sum(${facturaItems.subtotal}), 0)`),
          asc(productos.codigo)
        )
        .limit(5),
      db
        .select({
          totalAdeudado: sql<number>`coalesce(sum(${saldoExpr}), 0)`,
          clientesConSaldo: sql<number>`count(*)`,
        })
        .from(clientes)
        .leftJoin(saldosSq, eq(clientes.id, saldosSq.clienteId))
        .where(sql`${saldoExpr} > 0`),
      db
        .select({
          cantidad: sql<number>`count(*)`,
        })
        .from(productos)
        .where(
          and(
            eq(productos.activo, true),
            sql`${productos.existencia} < ${productos.stockMinimo}`
          )
        ),
    ]);

  let hoyCantidad = 0;
  let hoyImporte = 0;
  let mesCantidad = 0;
  let mesImporte = 0;

  const acumuladoPorDia = new Map<string, number>(
    ultimos30DiasISO.map((fecha) => [fecha, 0])
  );
  const acumuladoPorForma = new Map<FormaPago, number>(
    FORMAS_PAGO.map((forma) => [forma, 0])
  );

  for (const factura of facturasPeriodo) {
    const fechaArg = obtenerFechaISOArgentina(new Date(factura.fecha));

    if (fechaArg === hoyISO) {
      hoyCantidad += 1;
      hoyImporte += factura.total;
    }

    if (fechaArg >= inicioMesISO && fechaArg <= hoyISO) {
      mesCantidad += 1;
      mesImporte += factura.total;
      acumuladoPorForma.set(
        factura.formaPago,
        (acumuladoPorForma.get(factura.formaPago) ?? 0) + factura.total
      );
    }

    if (acumuladoPorDia.has(fechaArg)) {
      acumuladoPorDia.set(
        fechaArg,
        (acumuladoPorDia.get(fechaArg) ?? 0) + factura.total
      );
    }
  }

  return {
    hoy: {
      cantidad: hoyCantidad,
      importe: hoyImporte,
    },
    mes: {
      cantidad: mesCantidad,
      importe: mesImporte,
      ticketPromedio: mesCantidad > 0 ? Math.round(mesImporte / mesCantidad) : 0,
    },
    cuentasCorrientes: {
      totalAdeudado: Number(resumenDeuda?.totalAdeudado ?? 0),
      clientesConSaldo: Number(resumenDeuda?.clientesConSaldo ?? 0),
    },
    bajoMinimo: {
      cantidad: Number(resumenStock?.cantidad ?? 0),
    },
    ventasDiarias: ultimos30DiasISO.map((fecha) => ({
      fecha,
      importe: acumuladoPorDia.get(fecha) ?? 0,
    })),
    porFormaDePago: FORMAS_PAGO.map((forma) => ({
      forma,
      importe: acumuladoPorForma.get(forma) ?? 0,
    })),
    masVendidos: filasMasVendidos.map((item) => ({
      productoId: item.productoId,
      codigo: item.codigo,
      descripcion: item.descripcion,
      unidades: Number(item.unidades ?? 0),
      importe: Number(item.importe ?? 0),
    })),
  };
}
