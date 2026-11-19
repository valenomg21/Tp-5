export const ZONA_HORARIA_ARGENTINA = "America/Argentina/Buenos_Aires";

/**
 * Formatea un importe entero en centavos a pesos argentinos: "$ 12.345,50".
 * Usa aritmética entera para evitar errores de punto flotante (Regla 10).
 */
export function formatearMoneda(centavos: number): string {
  const enteroSeguro = Math.trunc(centavos);
  const negativo = enteroSeguro < 0;
  const absoluto = Math.abs(enteroSeguro);

  const parteEntera = Math.floor(absoluto / 100);
  const parteDecimal = String(absoluto % 100).padStart(2, "0");

  const milesFormateados = parteEntera
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${negativo ? "-" : ""}$ ${milesFormateados},${parteDecimal}`;
}

/**
 * Convierte un texto ingresado por el usuario ("12.345,50", "12345,50", "12345" o "12345.50")
 * a un entero en centavos. Devuelve null si el formato es inválido.
 */
export function parsearMonedaACentavos(texto: string): number | null {
  const limpio = texto.trim().replace(/^\$\s*/, "");
  if (!limpio) return null;

  let normalizado = limpio;

  if (limpio.includes(",")) {
    // Formato argentino: puntos como miles y coma como decimal
    normalizado = limpio.replace(/\./g, "").replace(",", ".");
  } else {
    const puntos = (limpio.match(/\./g) ?? []).length;
    if (puntos > 1) {
      // Múltiples puntos son separadores de miles sin decimales
      normalizado = limpio.replace(/\./g, "");
    } else if (puntos === 1) {
      const partes = limpio.split(".");
      // Si hay exactamente 3 dígitos luego del único punto y no hay coma, suele ser miles ("12.500")
      if (partes[1]?.length === 3 && partes[0].length >= 1) {
        normalizado = partes[0] + partes[1];
      }
    }
  }

  if (!/^-?\d+(\.\d{1,2})?$/.test(normalizado)) {
    return null;
  }

  const negativo = normalizado.startsWith("-");
  const sinSigno = negativo ? normalizado.slice(1) : normalizado;
  const [enterosStr, decimalesStr = ""] = sinSigno.split(".");

  const enteros = Number.parseInt(enterosStr, 10);
  const decimales = Number.parseInt(decimalesStr.padEnd(2, "0"), 10);
  const totalCentavos = enteros * 100 + decimales;

  if (!Number.isSafeInteger(totalCentavos)) {
    return null;
  }

  return negativo ? -totalCentavos : totalCentavos;
}

function convertirAFecha(fecha: string | Date): Date {
  return fecha instanceof Date ? fecha : new Date(fecha);
}

/**
 * Formatea una fecha UTC a "dd/mm/aaaa" en hora de Argentina.
 */
export function formatearFecha(fecha: string | Date): string {
  const d = convertirAFecha(fecha);
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_HORARIA_ARGENTINA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Formatea una hora UTC a "HH:mm" (24h) en hora de Argentina.
 */
export function formatearHora(fecha: string | Date): string {
  const d = convertirAFecha(fecha);
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_HORARIA_ARGENTINA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Formatea fecha y hora UTC a "dd/mm/aaaa HH:mm" en hora de Argentina.
 */
export function formatearFechaHora(fecha: string | Date): string {
  return `${formatearFecha(fecha)} ${formatearHora(fecha)}`;
}

/**
 * Devuelve la fecha en formato "AAAA-MM-DD" en hora de Argentina.
 */
export function obtenerFechaISOArgentina(fecha: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_ARGENTINA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);

  const year = partes.find((p) => p.type === "year")?.value ?? "0000";
  const month = partes.find((p) => p.type === "month")?.value ?? "01";
  const day = partes.find((p) => p.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

/**
 * Convierte un día calendario en hora de Argentina ("AAAA-MM-DD", UTC-3)
 * al rango inclusivo correspondiente en ISO 8601 UTC.
 */
export function rangoDiaArgentinaAUTC(fechaISO: string): {
  inicio: string;
  fin: string;
} {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
    throw new Error(`Fecha ISO inválida: ${fechaISO}`);
  }

  const inicio = new Date(`${fechaISO}T00:00:00.000-03:00`).toISOString();
  const fin = new Date(`${fechaISO}T23:59:59.999-03:00`).toISOString();

  return { inicio, fin };
}

/**
 * Deja únicamente los dígitos de un número de documento (DNI o CUIT).
 */
export function normalizarDocumento(nroDoc: string): string {
  return nroDoc.replace(/\D/g, "");
}

/**
 * Formatea DNI ("28.456.123") o CUIT ("20-28456123-4").
 * Si la longitud no coincide con el formato estándar, devuelve el valor limpio.
 */
export function formatearDocumento(
  tipoDoc: "DNI" | "CUIT",
  nroDoc: string
): string {
  const digitos = normalizarDocumento(nroDoc);

  if (tipoDoc === "CUIT" && digitos.length === 11) {
    return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
  }

  if (tipoDoc === "DNI" && (digitos.length === 7 || digitos.length === 8)) {
    return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return nroDoc.trim();
}

/**
 * Formatea el número de factura correlativo: "0001-00000001" (Regla 4).
 */
export function formatearNumeroFactura(
  puntoVenta: number,
  numero: number
): string {
  return `${String(puntoVenta).padStart(4, "0")}-${String(numero).padStart(8, "0")}`;
}

/**
 * Formatea el número de recibo de pago: "R 0001-00000001" (Regla 4, RF-C5).
 */
export function formatearNumeroRecibo(
  puntoVenta: number,
  numero: number
): string {
  return `R ${formatearNumeroFactura(puntoVenta, numero)}`;
}

const ETIQUETAS_FORMA_PAGO: Record<string, string> = {
  contado: "Contado",
  tarjeta: "Tarjeta",
  cuenta_corriente: "Cuenta corriente",
};

const ETIQUETAS_MEDIO_PAGO: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta de débito",
};

export function formatearFormaPago(forma: string): string {
  return ETIQUETAS_FORMA_PAGO[forma] ?? forma;
}

export function formatearMedioPago(medio: string): string {
  return ETIQUETAS_MEDIO_PAGO[medio] ?? medio;
}
