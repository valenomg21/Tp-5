import { and, asc, desc, eq, gte, lt, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db, type DbOrTx } from "@/db";
import { clientes, facturas, movimientosCuenta } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import {
  formatearDocumento,
  formatearNumeroFactura,
  normalizarDocumento,
  rangoDiaArgentinaAUTC,
} from "@/lib/format";
import {
  crearClienteSchema,
  cuentaCorrienteQuerySchema,
  editarClienteSchema,
  listarClientesQuerySchema,
  mensajeDocumentoInvalido,
  validarDigitosDocumento,
} from "@/lib/schemas/clientes";
import type { UsuarioSesion } from "@/lib/session";

export interface ClientePublico {
  id: number;
  tipoDoc: "DNI" | "CUIT";
  nroDoc: string;
  nombre: string;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  cuentaCorriente: boolean;
  limiteCredito: number | null;
  saldo: number;
  disponible: number | null;
  activo: boolean;
}

export interface FacturaResumenCliente {
  id: number;
  numeroFormateado: string;
  fecha: string;
  total: number;
  formaPago: "contado" | "tarjeta" | "cuenta_corriente";
  estado: "emitida" | "anulada";
}

export interface ClienteDetallePublico extends ClientePublico {
  ultimasFacturas: FacturaResumenCliente[];
}

export interface ListadoClientesResultado {
  data: ClientePublico[];
  page: number;
  pageSize: number;
  total: number;
  totalAdeudado?: number;
}

export interface MovimientoCuentaPublico {
  fecha: string;
  tipo: "debito" | "credito";
  importe: number;
  descripcion: string;
  facturaId: number | null;
  pagoId: number | null;
  saldo: number;
}

export interface CuentaCorrienteResultado {
  cliente: { id: number; nombre: string };
  saldoAnterior: number;
  movimientos: MovimientoCuentaPublico[];
  saldo: number;
}

function exigirRolValido(usuario: UsuarioSesion) {
  if (usuario.rol !== "admin" && usuario.rol !== "vendedor") {
    throw new ApiError(403, "SIN_PERMISO", "No tiene permisos suficientes.");
  }
}

function limpiarTextoOpcional(valor: string | null | undefined): string | null {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

function mapearClientePublico(
  fila: {
    id: number;
    tipoDoc: "DNI" | "CUIT";
    nroDoc: string;
    nombre: string;
    domicilio: string | null;
    telefono: string | null;
    email: string | null;
    cuentaCorriente: boolean;
    limiteCredito: number | null;
    activo: boolean;
  },
  saldo: number
): ClientePublico {
  const disponible =
    fila.cuentaCorriente && fila.limiteCredito !== null
      ? Math.max(0, fila.limiteCredito - saldo)
      : null;

  return {
    id: fila.id,
    tipoDoc: fila.tipoDoc,
    nroDoc: fila.nroDoc,
    nombre: fila.nombre,
    domicilio: fila.domicilio,
    telefono: fila.telefono,
    email: fila.email,
    cuentaCorriente: fila.cuentaCorriente,
    limiteCredito: fila.limiteCredito,
    saldo,
    disponible,
    activo: fila.activo,
  };
}

// Regla 7, Sección 10.2: única fuente de verdad para derivar el saldo de cuenta corriente.
export async function calcularSaldoCliente(
  tx: DbOrTx,
  clienteId: number
): Promise<number> {
  const [fila] = await tx
    .select({
      saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
    })
    .from(movimientosCuenta)
    .where(eq(movimientosCuenta.clienteId, clienteId));

  return Number(fila?.saldo ?? 0);
}

// RF-C1, RF-C6, Regla 7: listado paginado de clientes con búsqueda por nombre o documento y saldo calculado.
export async function listarClientes(
  usuario: UsuarioSesion,
  querySinValidar: unknown
): Promise<ListadoClientesResultado> {
  exigirRolValido(usuario);

  const parsed = listarClientesQuerySchema.parse(querySinValidar);

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
    .as("saldos_cliente");

  const saldoExpr = sql<number>`coalesce(${saldosSq.saldoCalculado}, 0)`;
  const condiciones: SQL[] = [];

  if (parsed.q) {
    const patronNombre = `%${parsed.q.toLowerCase()}%`;
    const digitos = normalizarDocumento(parsed.q);

    if (digitos) {
      const patronDoc = `%${digitos}%`;
      const filtro = or(
        sql`lower(${clientes.nombre}) like ${patronNombre}`,
        sql`${clientes.nroDocNormalizado} like ${patronDoc}`
      );
      if (filtro) condiciones.push(filtro);
    } else {
      condiciones.push(sql`lower(${clientes.nombre}) like ${patronNombre}`);
    }
  }

  if (parsed.activo === "true") {
    condiciones.push(eq(clientes.activo, true));
  } else if (parsed.activo === "false") {
    condiciones.push(eq(clientes.activo, false));
  }

  if (parsed.conDeuda === "true") {
    condiciones.push(sql`${saldoExpr} > 0`);
  }

  const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

  const [agregado] = await db
    .select({
      total: sql<number>`count(*)`,
      totalAdeudado: sql<number>`coalesce(sum(${saldoExpr}), 0)`,
    })
    .from(clientes)
    .leftJoin(saldosSq, eq(clientes.id, saldosSq.clienteId))
    .where(whereClause);

  const total = Number(agregado?.total ?? 0);
  const offset = (parsed.page - 1) * parsed.pageSize;

  const ordenEfectivo =
    parsed.orden ?? (parsed.conDeuda === "true" ? "saldo" : "nombre");

  const filas = await db
    .select({
      id: clientes.id,
      tipoDoc: clientes.tipoDoc,
      nroDoc: clientes.nroDoc,
      nombre: clientes.nombre,
      domicilio: clientes.domicilio,
      telefono: clientes.telefono,
      email: clientes.email,
      cuentaCorriente: clientes.cuentaCorriente,
      limiteCredito: clientes.limiteCredito,
      activo: clientes.activo,
      saldo: saldoExpr,
    })
    .from(clientes)
    .leftJoin(saldosSq, eq(clientes.id, saldosSq.clienteId))
    .where(whereClause)
    .orderBy(
      ...(ordenEfectivo === "saldo"
        ? [desc(saldoExpr), asc(clientes.nombre), asc(clientes.id)]
        : [asc(clientes.nombre), asc(clientes.id)])
    )
    .limit(parsed.pageSize)
    .offset(offset);

  const data = filas.map((f) => mapearClientePublico(f, Number(f.saldo ?? 0)));

  return {
    data,
    page: parsed.page,
    pageSize: parsed.pageSize,
    total,
    ...(parsed.conDeuda === "true"
      ? { totalAdeudado: Number(agregado?.totalAdeudado ?? 0) }
      : {}),
  };
}

// RF-C3, Regla 7: ficha del cliente con saldo derivado y sus últimas 6 facturas.
export async function obtenerClientePorId(
  usuario: UsuarioSesion,
  id: number
): Promise<ClienteDetallePublico> {
  exigirRolValido(usuario);

  const [fila] = await db
    .select({
      id: clientes.id,
      tipoDoc: clientes.tipoDoc,
      nroDoc: clientes.nroDoc,
      nombre: clientes.nombre,
      domicilio: clientes.domicilio,
      telefono: clientes.telefono,
      email: clientes.email,
      cuentaCorriente: clientes.cuentaCorriente,
      limiteCredito: clientes.limiteCredito,
      activo: clientes.activo,
    })
    .from(clientes)
    .where(eq(clientes.id, id))
    .limit(1);

  if (!fila) {
    throw new ApiError(404, "NO_ENCONTRADO", "El cliente no existe.");
  }

  const [saldo, facturasRecientes] = await Promise.all([
    calcularSaldoCliente(db, id),
    db
      .select({
        id: facturas.id,
        puntoVenta: facturas.puntoVenta,
        numero: facturas.numero,
        fecha: facturas.fecha,
        total: facturas.total,
        formaPago: facturas.formaPago,
        estado: facturas.estado,
      })
      .from(facturas)
      .where(eq(facturas.clienteId, id))
      .orderBy(desc(facturas.fecha), desc(facturas.id))
      .limit(6),
  ]);

  return {
    ...mapearClientePublico(fila, saldo),
    ultimasFacturas: facturasRecientes.map((f) => ({
      id: f.id,
      numeroFormateado: formatearNumeroFactura(f.puntoVenta, f.numero),
      fecha: f.fecha,
      total: f.total,
      formaPago: f.formaPago,
      estado: f.estado,
    })),
  };
}

// RF-C2, RF-V2: alta de cliente validando unicidad de tipo y número de documento.
export async function crearCliente(
  usuario: UsuarioSesion,
  datosSinValidar: unknown
): Promise<ClientePublico> {
  exigirRolValido(usuario);

  const parsed = crearClienteSchema.parse(datosSinValidar);
  const nroDocNormalizado = normalizarDocumento(parsed.nroDoc);
  const nroDocFormateado = formatearDocumento(parsed.tipoDoc, parsed.nroDoc);

  const [duplicado] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(
      and(
        eq(clientes.tipoDoc, parsed.tipoDoc),
        eq(clientes.nroDocNormalizado, nroDocNormalizado)
      )
    )
    .limit(1);

  if (duplicado) {
    throw new ApiError(
      409,
      "DOCUMENTO_DUPLICADO",
      "Ya existe un cliente registrado con ese documento.",
      [
        {
          campo: "nroDoc",
          mensaje: "Ya existe un cliente registrado con ese documento.",
        },
      ]
    );
  }

  const cuentaCorriente = Boolean(parsed.cuentaCorriente);
  const limiteCredito = cuentaCorriente ? (parsed.limiteCredito ?? null) : null;

  const [creado] = await db
    .insert(clientes)
    .values({
      tipoDoc: parsed.tipoDoc,
      nroDoc: nroDocFormateado,
      nroDocNormalizado,
      nombre: parsed.nombre,
      domicilio: limpiarTextoOpcional(parsed.domicilio),
      telefono: limpiarTextoOpcional(parsed.telefono),
      email: limpiarTextoOpcional(parsed.email)?.toLowerCase() ?? null,
      cuentaCorriente,
      limiteCredito,
      activo: true,
    })
    .returning();

  return mapearClientePublico(creado, 0);
}

// RF-C2, RF-C7, Regla 7 y 12: edición y baja lógica validando saldo cero si se desactiva o quita cuenta corriente.
export async function editarCliente(
  usuario: UsuarioSesion,
  id: number,
  datosSinValidar: unknown
): Promise<ClientePublico> {
  exigirRolValido(usuario);

  const parsed = editarClienteSchema.parse(datosSinValidar);

  const [existente] = await db
    .select()
    .from(clientes)
    .where(eq(clientes.id, id))
    .limit(1);

  if (!existente) {
    throw new ApiError(404, "NO_ENCONTRADO", "El cliente no existe.");
  }

  const saldo = await calcularSaldoCliente(db, id);

  if (parsed.activo === false && saldo !== 0) {
    throw new ApiError(
      422,
      "SALDO_PENDIENTE",
      "No se puede dar de baja un cliente que tiene saldo pendiente."
    );
  }

  if (parsed.cuentaCorriente === false && saldo !== 0) {
    throw new ApiError(
      422,
      "SALDO_PENDIENTE",
      "No se puede deshabilitar la cuenta corriente de un cliente con saldo pendiente."
    );
  }

  const tipoDocFinal = parsed.tipoDoc ?? existente.tipoDoc;
  const nroDocFuente = parsed.nroDoc ?? existente.nroDoc;

  if (!validarDigitosDocumento(tipoDocFinal, nroDocFuente)) {
    throw new ApiError(422, "VALIDACION", "Hay campos con errores.", [
      {
        campo: "nroDoc",
        mensaje: mensajeDocumentoInvalido(tipoDocFinal),
      },
    ]);
  }

  const nroDocNormalizadoFinal = normalizarDocumento(nroDocFuente);
  const nroDocFormateadoFinal = formatearDocumento(tipoDocFinal, nroDocFuente);

  if (parsed.tipoDoc !== undefined || parsed.nroDoc !== undefined) {
    const [duplicado] = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(
        and(
          eq(clientes.tipoDoc, tipoDocFinal),
          eq(clientes.nroDocNormalizado, nroDocNormalizadoFinal),
          ne(clientes.id, id)
        )
      )
      .limit(1);

    if (duplicado) {
      throw new ApiError(
        409,
        "DOCUMENTO_DUPLICADO",
        "Ya existe otro cliente registrado con ese documento.",
        [
          {
            campo: "nroDoc",
            mensaje: "Ya existe otro cliente registrado con ese documento.",
          },
        ]
      );
    }
  }

  const cuentaCorrienteFinal =
    parsed.cuentaCorriente ?? existente.cuentaCorriente;
  const limiteCreditoFinal = cuentaCorrienteFinal
    ? parsed.limiteCredito !== undefined
      ? parsed.limiteCredito
      : existente.limiteCredito
    : null;

  const cambios: Partial<typeof clientes.$inferInsert> = {
    cuentaCorriente: cuentaCorrienteFinal,
    limiteCredito: limiteCreditoFinal,
  };

  if (parsed.tipoDoc !== undefined || parsed.nroDoc !== undefined) {
    cambios.tipoDoc = tipoDocFinal;
    cambios.nroDoc = nroDocFormateadoFinal;
    cambios.nroDocNormalizado = nroDocNormalizadoFinal;
  }

  if (parsed.nombre !== undefined) cambios.nombre = parsed.nombre;
  if (parsed.domicilio !== undefined) {
    cambios.domicilio = limpiarTextoOpcional(parsed.domicilio);
  }
  if (parsed.telefono !== undefined) {
    cambios.telefono = limpiarTextoOpcional(parsed.telefono);
  }
  if (parsed.email !== undefined) {
    cambios.email = limpiarTextoOpcional(parsed.email)?.toLowerCase() ?? null;
  }
  if (parsed.activo !== undefined) cambios.activo = parsed.activo;

  const [actualizado] = await db
    .update(clientes)
    .set(cambios)
    .where(eq(clientes.id, id))
    .returning();

  return mapearClientePublico(actualizado, saldo);
}

// RF-C4, Regla 7: movimientos de cuenta corriente en orden cronológico con saldo acumulado.
export async function obtenerCuentaCorrienteCliente(
  usuario: UsuarioSesion,
  clienteId: number,
  querySinValidar: unknown
): Promise<CuentaCorrienteResultado> {
  exigirRolValido(usuario);

  const parsed = cuentaCorrienteQuerySchema.parse(querySinValidar);

  const [cliente] = await db
    .select({ id: clientes.id, nombre: clientes.nombre })
    .from(clientes)
    .where(eq(clientes.id, clienteId))
    .limit(1);

  if (!cliente) {
    throw new ApiError(404, "NO_ENCONTRADO", "El cliente no existe.");
  }

  let saldoAnterior = 0;
  const condiciones: SQL[] = [eq(movimientosCuenta.clienteId, clienteId)];

  if (parsed.desde !== undefined) {
    const inicioDesde = rangoDiaArgentinaAUTC(parsed.desde).inicio;
    const [prev] = await db
      .select({
        saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
      })
      .from(movimientosCuenta)
      .where(
        and(
          eq(movimientosCuenta.clienteId, clienteId),
          lt(movimientosCuenta.fecha, inicioDesde)
        )
      );

    saldoAnterior = Number(prev?.saldo ?? 0);
    condiciones.push(gte(movimientosCuenta.fecha, inicioDesde));
  }

  if (parsed.hasta !== undefined) {
    condiciones.push(
      lte(movimientosCuenta.fecha, rangoDiaArgentinaAUTC(parsed.hasta).fin)
    );
  }

  const filas = await db
    .select({
      fecha: movimientosCuenta.fecha,
      tipo: movimientosCuenta.tipo,
      importe: movimientosCuenta.importe,
      descripcion: movimientosCuenta.descripcion,
      facturaId: movimientosCuenta.facturaId,
      pagoId: movimientosCuenta.pagoId,
    })
    .from(movimientosCuenta)
    .where(and(...condiciones))
    .orderBy(asc(movimientosCuenta.fecha), asc(movimientosCuenta.id));

  let acumulado = saldoAnterior;
  const movimientos: MovimientoCuentaPublico[] = filas.map((f) => {
    acumulado += f.tipo === "debito" ? f.importe : -f.importe;
    return {
      fecha: f.fecha,
      tipo: f.tipo,
      importe: f.importe,
      descripcion: f.descripcion,
      facturaId: f.facturaId,
      pagoId: f.pagoId,
      saldo: acumulado,
    };
  });

  return {
    cliente: { id: cliente.id, nombre: cliente.nombre },
    saldoAnterior,
    movimientos,
    saldo: acumulado,
  };
}
