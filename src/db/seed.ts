import "dotenv/config";
import bcrypt from "bcryptjs";
import { and, count, eq, sql } from "drizzle-orm";
import { client, db } from "./index";
import {
  categorias,
  clientes,
  facturas,
  productos,
  usuarios,
} from "./schema";
import {
  normalizarDocumento,
  obtenerFechaISOArgentina,
  rangoDiaArgentinaAUTC,
} from "../lib/format";
import type { FormaPago } from "../lib/schemas/facturas";
import type { UsuarioSesion } from "../lib/session";
import { crearCategoria } from "../services/categorias.service";
import {
  calcularSaldoCliente,
  crearCliente,
} from "../services/clientes.service";
import { anularFactura, emitirFactura } from "../services/facturas.service";
import { registrarPago } from "../services/pagos.service";
import { crearProducto } from "../services/productos.service";

const USUARIOS_INICIALES = [
  {
    nombre: "Laura Méndez",
    email: "admin@comercio.test",
    passwordPlano: "Admin1234",
    rol: "admin" as const,
  },
  {
    nombre: "Pablo Ruiz",
    email: "vendedor@comercio.test",
    passwordPlano: "Vendedor1234",
    rol: "vendedor" as const,
  },
];

const CATEGORIAS_INICIALES = [
  "Herramientas Manuales",
  "Iluminación y Electricidad",
  "Pinturería y Acabados",
  "Fijaciones y Herrajes",
  "Seguridad Industrial",
  "Insumos y Limpieza",
] as const;

interface ProductoSeedDef {
  codigo: string;
  descripcion: string;
  categoria: (typeof CATEGORIAS_INICIALES)[number];
  precio: number;
  stockMinimo: number;
  stockInicial: number;
}

const PRODUCTOS_INICIALES: ProductoSeedDef[] = [
  // Herramientas Manuales
  {
    codigo: "FER-001",
    descripcion: "Martillo galponero cabo fibra 20 oz",
    categoria: "Herramientas Manuales",
    precio: 1450000,
    stockMinimo: 12,
    stockInicial: 18,
  },
  {
    codigo: "FER-002",
    descripcion: "Juego de destornilladores aislados x6",
    categoria: "Herramientas Manuales",
    precio: 1890000,
    stockMinimo: 10,
    stockInicial: 65,
  },
  {
    codigo: "FER-003",
    descripcion: "Pinza universal cromo vanadio 8\"",
    categoria: "Herramientas Manuales",
    precio: 1120000,
    stockMinimo: 10,
    stockInicial: 60,
  },
  {
    codigo: "FER-004",
    descripcion: "Cinta métrica reforzada 5 metros",
    categoria: "Herramientas Manuales",
    precio: 640000,
    stockMinimo: 15,
    stockInicial: 20,
  },
  {
    codigo: "FER-005",
    descripcion: "Llave francesa ajustable 10\"",
    categoria: "Herramientas Manuales",
    precio: 1580000,
    stockMinimo: 8,
    stockInicial: 55,
  },
  // Iluminación y Electricidad
  {
    codigo: "ILU-001",
    descripcion: "Lámpara LED bulbo 12W luz cálida",
    categoria: "Iluminación y Electricidad",
    precio: 295000,
    stockMinimo: 25,
    stockInicial: 30,
  },
  {
    codigo: "ILU-002",
    descripcion: "Reflector LED exterior 50W IP65",
    categoria: "Iluminación y Electricidad",
    precio: 1640000,
    stockMinimo: 8,
    stockInicial: 50,
  },
  {
    codigo: "ILU-003",
    descripcion: "Prolongador eléctrico 5 bocas 3 metros",
    categoria: "Iluminación y Electricidad",
    precio: 980000,
    stockMinimo: 10,
    stockInicial: 65,
  },
  {
    codigo: "ILU-004",
    descripcion: "Cinta aisladora PVC negra 20 metros",
    categoria: "Iluminación y Electricidad",
    precio: 185000,
    stockMinimo: 20,
    stockInicial: 110,
  },
  {
    codigo: "ILU-005",
    descripcion: "Cable unipolar 2.5 mm rollo x100 metros",
    categoria: "Iluminación y Electricidad",
    precio: 4250000,
    stockMinimo: 6,
    stockInicial: 40,
  },
  // Pinturería y Acabados
  {
    codigo: "PIN-001",
    descripcion: "Látex interior mate blanco 4 litros",
    categoria: "Pinturería y Acabados",
    precio: 2890000,
    stockMinimo: 8,
    stockInicial: 55,
  },
  {
    codigo: "PIN-002",
    descripcion: "Esmalte sintético brillante blanco 1 litro",
    categoria: "Pinturería y Acabados",
    precio: 1240000,
    stockMinimo: 10,
    stockInicial: 60,
  },
  {
    codigo: "PIN-003",
    descripcion: "Rodillo antigota lana sintética 22 cm",
    categoria: "Pinturería y Acabados",
    precio: 675000,
    stockMinimo: 12,
    stockInicial: 75,
  },
  {
    codigo: "PIN-004",
    descripcion: "Pincel cerda mixta N° 20",
    categoria: "Pinturería y Acabados",
    precio: 390000,
    stockMinimo: 15,
    stockInicial: 18,
  },
  {
    codigo: "PIN-005",
    descripcion: "Aguarrás mineral botella 1 litro",
    categoria: "Pinturería y Acabados",
    precio: 520000,
    stockMinimo: 12,
    stockInicial: 70,
  },
  // Fijaciones y Herrajes
  {
    codigo: "FIJ-001",
    descripcion: "Caja tornillos autoperforantes 8x1 x200 u.",
    categoria: "Fijaciones y Herrajes",
    precio: 490000,
    stockMinimo: 15,
    stockInicial: 95,
  },
  {
    codigo: "FIJ-002",
    descripcion: "Tarugos nylon 8 mm con tope x100 u.",
    categoria: "Fijaciones y Herrajes",
    precio: 360000,
    stockMinimo: 14,
    stockInicial: 90,
  },
  {
    codigo: "FIJ-003",
    descripcion: "Candado bronce macizo 40 mm",
    categoria: "Fijaciones y Herrajes",
    precio: 1320000,
    stockMinimo: 8,
    stockInicial: 50,
  },
  {
    codigo: "FIJ-004",
    descripcion: "Bisagra munición acero inoxidable 100 mm",
    categoria: "Fijaciones y Herrajes",
    precio: 740000,
    stockMinimo: 12,
    stockInicial: 80,
  },
  {
    codigo: "FIJ-005",
    descripcion: "Adhesivo sellador silicona neutra 280 ml",
    categoria: "Fijaciones y Herrajes",
    precio: 615000,
    stockMinimo: 14,
    stockInicial: 16,
  },
  // Seguridad Industrial
  {
    codigo: "SEG-001",
    descripcion: "Guantes moteados algodón refuerzo PVC",
    categoria: "Seguridad Industrial",
    precio: 240000,
    stockMinimo: 20,
    stockInicial: 120,
  },
  {
    codigo: "SEG-002",
    descripcion: "Antiparra policarbonato transparente antiempaño",
    categoria: "Seguridad Industrial",
    precio: 480000,
    stockMinimo: 12,
    stockInicial: 70,
  },
  {
    codigo: "SEG-003",
    descripcion: "Casco de seguridad con ajuste a cremallera",
    categoria: "Seguridad Industrial",
    precio: 1150000,
    stockMinimo: 8,
    stockInicial: 45,
  },
  {
    codigo: "SEG-004",
    descripcion: "Protector auditivo tipo copa 26 dB",
    categoria: "Seguridad Industrial",
    precio: 1490000,
    stockMinimo: 6,
    stockInicial: 40,
  },
  {
    codigo: "SEG-005",
    descripcion: "Chaleco reflectivo alta visibilidad talle L",
    categoria: "Seguridad Industrial",
    precio: 590000,
    stockMinimo: 10,
    stockInicial: 8,
  },
  // Insumos y Limpieza
  {
    codigo: "LIM-001",
    descripcion: "Detergente industrial concentrado 5 litros",
    categoria: "Insumos y Limpieza",
    precio: 890000,
    stockMinimo: 10,
    stockInicial: 65,
  },
  {
    codigo: "LIM-002",
    descripcion: "Rollo papel secamanos industrial x2 unidades",
    categoria: "Insumos y Limpieza",
    precio: 730000,
    stockMinimo: 12,
    stockInicial: 75,
  },
  {
    codigo: "LIM-003",
    descripcion: "Bolsas consorcio reforzadas 80x110 x10 u.",
    categoria: "Insumos y Limpieza",
    precio: 340000,
    stockMinimo: 18,
    stockInicial: 100,
  },
  {
    codigo: "LIM-004",
    descripcion: "Escobillón cerda dura 40 cm con cabo",
    categoria: "Insumos y Limpieza",
    precio: 620000,
    stockMinimo: 8,
    stockInicial: 50,
  },
  {
    codigo: "LIM-005",
    descripcion: "Desengrasante multiuso gatillo 750 ml",
    categoria: "Insumos y Limpieza",
    precio: 460000,
    stockMinimo: 10,
    stockInicial: 60,
  },
];

const CLIENTES_INICIALES = [
  {
    tipoDoc: "CUIT" as const,
    nroDoc: "30-71458920-1",
    nombre: "Constructora del Sur SRL",
    domicilio: "Av. Rivadavia 2450, CABA",
    telefono: "11-4589-2010",
    email: "compras@constructoradelsur.test",
    cuentaCorriente: true,
    limiteCredito: 120000000,
  },
  {
    tipoDoc: "CUIT" as const,
    nroDoc: "30-68912450-8",
    nombre: "Mantenimiento Integral Norte SA",
    domicilio: "Av. Maipú 1820, Vicente López",
    telefono: "11-4791-3340",
    email: "administracion@mantenimientonorte.test",
    cuentaCorriente: true,
    limiteCredito: 100000000,
  },
  {
    tipoDoc: "DNI" as const,
    nroDoc: "28.456.123",
    nombre: "Martín Sebastián Gómez",
    domicilio: "Calle 12 N° 845, La Plata",
    telefono: "221-512-7789",
    email: "mgomez@correo.test",
    cuentaCorriente: true,
    limiteCredito: 60000000,
  },
  {
    tipoDoc: "CUIT" as const,
    nroDoc: "27-29345612-4",
    nombre: "Estudio Arquitectura Belgrano",
    domicilio: "Juramento 2140, CABA",
    telefono: "11-4784-9901",
    email: "obras@estudiobelgrano.test",
    cuentaCorriente: true,
    limiteCredito: 90000000,
  },
  {
    tipoDoc: "DNI" as const,
    nroDoc: "31.902.445",
    nombre: "Carolina Alejandra Vega",
    domicilio: "San Martín 612, Quilmes",
    telefono: "11-6241-8832",
    email: "cvega@correo.test",
    cuentaCorriente: true,
    limiteCredito: 50000000,
  },
  {
    tipoDoc: "CUIT" as const,
    nroDoc: "30-70983112-6",
    nombre: "Logística Pampeana SRL",
    domicilio: "Ruta 9 Km 42, Escobar",
    telefono: "348-442-1190",
    email: "insumos@logisticapampeana.test",
    cuentaCorriente: true,
    limiteCredito: null,
  },
  {
    tipoDoc: "DNI" as const,
    nroDoc: "33.512.789",
    nombre: "Federico Nahuel Pereyra",
    domicilio: "Mitre 320, Avellaneda",
    telefono: "11-5302-4411",
    email: "fpereyra@correo.test",
    cuentaCorriente: false,
    limiteCredito: null,
  },
  {
    tipoDoc: "DNI" as const,
    nroDoc: "26.789.341",
    nombre: "Luciana Beatriz Morales",
    domicilio: "Belgrano 1140, Morón",
    telefono: "11-4483-9022",
    email: null,
    cuentaCorriente: false,
    limiteCredito: null,
  },
  {
    tipoDoc: "CUIT" as const,
    nroDoc: "20-34890123-7",
    nombre: "Taller Mecánico El Progreso",
    domicilio: "Av. Eva Perón 4120, Lanús",
    telefono: "11-4241-5509",
    email: "tallerelprogreso@correo.test",
    cuentaCorriente: false,
    limiteCredito: null,
  },
  {
    tipoDoc: "DNI" as const,
    nroDoc: "36.120.984",
    nombre: "Nicolás Agustín Ferreyra",
    domicilio: "Sarmiento 910, San Isidro",
    telefono: "11-5998-3014",
    email: "nferreyra@correo.test",
    cuentaCorriente: false,
    limiteCredito: null,
  },
];

async function asegurarUsuario(
  datos: (typeof USUARIOS_INICIALES)[number]
): Promise<UsuarioSesion> {
  const [existente] = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      rol: usuarios.rol,
    })
    .from(usuarios)
    .where(eq(usuarios.email, datos.email))
    .limit(1);

  if (existente) {
    console.log(`- Usuario existente: ${existente.email} (${existente.rol})`);
    return existente;
  }

  const passwordHash = await bcrypt.hash(datos.passwordPlano, 10);

  const [creado] = await db
    .insert(usuarios)
    .values({
      nombre: datos.nombre,
      email: datos.email,
      passwordHash,
      rol: datos.rol,
      activo: true,
    })
    .returning({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      rol: usuarios.rol,
    });

  console.log(
    `- Usuario creado: ${datos.email} (${datos.rol}) | clave: ${datos.passwordPlano}`
  );
  return creado;
}

async function asegurarCategorias(admin: UsuarioSesion) {
  const mapa = new Map<string, number>();

  for (const nombre of CATEGORIAS_INICIALES) {
    const [existente] = await db
      .select({ id: categorias.id, nombre: categorias.nombre })
      .from(categorias)
      .where(sql`lower(${categorias.nombre}) = ${nombre.toLowerCase()}`)
      .limit(1);

    if (existente) {
      mapa.set(nombre, existente.id);
      continue;
    }

    const creada = await crearCategoria(admin, { nombre });
    mapa.set(nombre, creada.id);
  }

  return mapa;
}

interface ProductoParaSeed {
  id: number;
  codigo: string;
  precio: number;
  existencia: number;
}

async function asegurarProductos(
  admin: UsuarioSesion,
  categoriasMapa: Map<string, number>
): Promise<Map<string, ProductoParaSeed>> {
  const resultado = new Map<string, ProductoParaSeed>();

  for (const def of PRODUCTOS_INICIALES) {
    const [existente] = await db
      .select({
        id: productos.id,
        codigo: productos.codigo,
        precio: productos.precio,
        existencia: productos.existencia,
      })
      .from(productos)
      .where(sql`lower(${productos.codigo}) = ${def.codigo.toLowerCase()}`)
      .limit(1);

    if (existente) {
      resultado.set(def.codigo, existente);
      continue;
    }

    const categoriaId = categoriasMapa.get(def.categoria)!;
    const creado = await crearProducto(admin, {
      codigo: def.codigo,
      descripcion: def.descripcion,
      categoriaId,
      precio: def.precio,
      stockMinimo: def.stockMinimo,
      stockInicial: def.stockInicial,
    });

    resultado.set(def.codigo, {
      id: creado.id,
      codigo: creado.codigo,
      precio: creado.precio,
      existencia: creado.existencia,
    });
  }

  return resultado;
}

interface ClienteParaSeed {
  id: number;
  nombre: string;
  cuentaCorriente: boolean;
}

async function asegurarClientes(admin: UsuarioSesion): Promise<ClienteParaSeed[]> {
  const resultado: ClienteParaSeed[] = [];

  for (const def of CLIENTES_INICIALES) {
    const nroDocNorm = normalizarDocumento(def.nroDoc);
    const [existente] = await db
      .select({
        id: clientes.id,
        nombre: clientes.nombre,
        cuentaCorriente: clientes.cuentaCorriente,
      })
      .from(clientes)
      .where(
        and(
          eq(clientes.tipoDoc, def.tipoDoc),
          eq(clientes.nroDocNormalizado, nroDocNorm)
        )
      )
      .limit(1);

    if (existente) {
      resultado.push(existente);
      continue;
    }

    const creado = await crearCliente(admin, def);
    resultado.push({
      id: creado.id,
      nombre: creado.nombre,
      cuentaCorriente: creado.cuentaCorriente,
    });
  }

  return resultado;
}

function restarDiasISO(hoyISO: string, diasAtras: number): string {
  const [anio, mes, dia] = hoyISO.split("-").map(Number);
  const ms = Date.UTC(anio, mes - 1, dia, 12, 0, 0) - diasAtras * 86_400_000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function construirTimestampFactura(
  hoyISO: string,
  diasAtras: number,
  indiceEnElDia: number,
  totalEnElDia: number
): string {
  const fechaISO = restarDiasISO(hoyISO, diasAtras);

  if (diasAtras === 0) {
    // Asegura que todas las facturas de hoy queden dentro del día argentino y nunca en el futuro.
    const inicioHoyMs = new Date(rangoDiaArgentinaAUTC(hoyISO).inicio).getTime();
    const ahoraSeguroMs = Math.max(inicioHoyMs + 120_000, Date.now() - 60_000);
    const fraccion = (indiceEnElDia + 1) / (totalEnElDia + 1);
    const marcaMs = Math.floor(
      inicioHoyMs + fraccion * (ahoraSeguroMs - inicioHoyMs)
    );
    return new Date(marcaMs).toISOString();
  }

  const horas = 9 + ((indiceEnElDia * 3) % 10);
  const minutos = 10 + ((indiceEnElDia * 17) % 45);
  return new Date(
    `${fechaISO}T${String(horas).padStart(2, "0")}:${String(minutos).padStart(
      2,
      "0"
    )}:00.000-03:00`
  ).toISOString();
}

// Distribución de 50 ventas a lo largo de los últimos 30 días (más antiguos primero).
function construirCalendarioDias(): number[] {
  const diasAtrasPorFactura: number[] = [];
  for (let dia = 29; dia >= 1; dia -= 1) {
    diasAtrasPorFactura.push(dia);
  }
  for (let dia = 28; dia >= 2 && diasAtrasPorFactura.length < 46; dia -= 2) {
    diasAtrasPorFactura.push(dia);
  }
  for (const diaExtra of [1, 3, 5, 7]) {
    if (diasAtrasPorFactura.length < 46) {
      diasAtrasPorFactura.push(diaExtra);
    }
  }
  diasAtrasPorFactura.sort((a, b) => b - a);
  // 4 facturas para el día de hoy
  diasAtrasPorFactura.push(0, 0, 0, 0);
  return diasAtrasPorFactura;
}

async function sembrarOperaciones(
  admin: UsuarioSesion,
  vendedor: UsuarioSesion,
  productosMapa: Map<string, ProductoParaSeed>,
  clientesLista: ClienteParaSeed[]
) {
  const hoyISO = obtenerFechaISOArgentina();
  const calendario = construirCalendarioDias();

  const conteoPorDia = new Map<number, number>();
  for (const d of calendario) {
    conteoPorDia.set(d, (conteoPorDia.get(d) ?? 0) + 1);
  }
  const indicePorDia = new Map<number, number>();

  const clientesConCtaCte = clientesLista.filter((c) => c.cuentaCorriente);
  const codigosOrdenados = PRODUCTOS_INICIALES.map((p) => p.codigo);
  // Códigos pensados para quedar bajo mínimo tras las ventas del seed
  const codigosRotacionAlta = ["FER-001", "FER-004", "ILU-001", "PIN-004", "FIJ-005", "SEG-005"];
  const marcasTarjeta = ["Visa", "Mastercard", "Cabal", "Naranja X"];

  const emitidasContado: number[] = [];
  const emitidasCtaCte: number[] = [];

  for (let i = 0; i < calendario.length; i += 1) {
    const diasAtras = calendario[i];
    const totalDia = conteoPorDia.get(diasAtras) ?? 1;
    const idxDia = indicePorDia.get(diasAtras) ?? 0;
    indicePorDia.set(diasAtras, idxDia + 1);

    const fecha = construirTimestampFactura(hoyISO, diasAtras, idxDia, totalDia);
    const usuarioEmisor = i % 3 === 0 ? admin : vendedor;

    // Forma de pago: ~22 contado, ~16 tarjeta, ~12 cuenta_corriente
    let forma: FormaPago = "contado";
    if (i % 4 === 1) {
      forma = "cuenta_corriente";
    } else if (i % 3 === 2) {
      forma = "tarjeta";
    }

    let clienteId: number | null = null;
    if (forma === "cuenta_corriente") {
      const cli =
        clientesConCtaCte[Math.floor(i / 4) % clientesConCtaCte.length];
      clienteId = cli.id;
    } else if (i % 5 !== 0) {
      const cli = clientesLista[i % clientesLista.length];
      clienteId = cli.id;
    }

    // Selección de 2 o 3 ítems por factura verificando stock disponible en memoria
    const itemsSeleccionados: { productoId: number; cantidad: number }[] = [];
    const idsUsados = new Set<number>();

    // Primer ítem: alterna entre los de rotación alta (en primeras 24 ventas) y rotación normal
    const codigoPrincipal =
      i < 24 && i % 2 === 0
        ? codigosRotacionAlta[Math.floor(i / 2) % codigosRotacionAlta.length]
        : codigosOrdenados[(i * 3 + 5) % codigosOrdenados.length];

    const prodPrincipal = productosMapa.get(codigoPrincipal);
    if (prodPrincipal && prodPrincipal.existencia >= 2) {
      const esRotacionAlta = codigosRotacionAlta.includes(codigoPrincipal);
      const cantidadDeseada = esRotacionAlta ? 4 : (i % 3) + 1;
      const cantidad = Math.min(cantidadDeseada, prodPrincipal.existencia);
      if (cantidad >= 1) {
        itemsSeleccionados.push({ productoId: prodPrincipal.id, cantidad });
        idsUsados.add(prodPrincipal.id);
        prodPrincipal.existencia -= cantidad;
      }
    }

    const cantRenglonesExtra = (i % 2) + 1;
    for (let j = 1; j <= 6 && itemsSeleccionados.length < 1 + cantRenglonesExtra; j += 1) {
      const codigoSec = codigosOrdenados[(i * 5 + j * 7) % codigosOrdenados.length];
      if (codigosRotacionAlta.includes(codigoSec)) continue;
      const prodSec = productosMapa.get(codigoSec);
      if (!prodSec || idsUsados.has(prodSec.id) || prodSec.existencia < 1) {
        continue;
      }
      const cantidad = Math.min((i + j) % 3 + 1, prodSec.existencia);
      itemsSeleccionados.push({ productoId: prodSec.id, cantidad });
      idsUsados.add(prodSec.id);
      prodSec.existencia -= cantidad;
    }

    // Garantía de al menos 1 ítem con stock
    if (itemsSeleccionados.length === 0) {
      for (const codigo of codigosOrdenados) {
        const p = productosMapa.get(codigo);
        if (p && p.existencia >= 1) {
          itemsSeleccionados.push({ productoId: p.id, cantidad: 1 });
          p.existencia -= 1;
          break;
        }
      }
    }

    // Cálculo local solo para determinar montoRecibido en contado
    let subtotalEstimado = 0;
    for (const item of itemsSeleccionados) {
      for (const prod of productosMapa.values()) {
        if (prod.id === item.productoId) {
          subtotalEstimado += prod.precio * item.cantidad;
          break;
        }
      }
    }

    const pagoInput =
      forma === "contado"
        ? {
            forma: "contado" as const,
            montoRecibido:
              i % 2 === 0
                ? subtotalEstimado
                : Math.ceil((subtotalEstimado + 100000) / 100000) * 100000,
          }
        : forma === "tarjeta"
          ? {
              forma: "tarjeta" as const,
              tarjeta: {
                tipo: i % 2 === 0 ? ("debito" as const) : ("credito" as const),
                marca: marcasTarjeta[i % marcasTarjeta.length],
                ultimos4: String(4100 + ((i * 137) % 5800)),
              },
            }
          : { forma: "cuenta_corriente" as const };

    const factura = await emitirFactura(
      usuarioEmisor,
      {
        clienteId,
        items: itemsSeleccionados,
        pago: pagoInput,
      },
      { fecha }
    );

    if (forma === "contado" && diasAtras > 0 && i >= 24) {
      emitidasContado.push(factura.id);
    } else if (forma === "cuenta_corriente" && clienteId !== null && diasAtras > 0) {
      emitidasCtaCte.push(factura.id);
    }
  }

  // Anular 2 facturas históricas (1 contado y 1 cuenta corriente) usando el administrador (Regla 5)
  const aAnular: { id: number; motivo: string }[] = [];
  if (emitidasContado[0]) {
    aAnular.push({
      id: emitidasContado[0],
      motivo: "Error en la carga de cantidades del comprobante",
    });
  }
  if (emitidasCtaCte[1]) {
    aAnular.push({
      id: emitidasCtaCte[1],
      motivo: "Devolución total acordada con el cliente",
    });
  }

  for (const item of aAnular) {
    await anularFactura(admin, item.id, {
      motivo: item.motivo,
    });
  }

  // Registrar pagos parciales y cancelaciones en cuenta corriente usando registrarPago
  const medios = ["transferencia", "efectivo", "tarjeta_debito"] as const;
  let pagosRegistrados = 0;

  for (let idx = 0; idx < clientesConCtaCte.length; idx += 1) {
    const cli = clientesConCtaCte[idx];
    const deuda = await calcularSaldoCliente(db, cli.id);
    if (deuda <= 0) continue;

    // El primer cliente cancela el 100% de su saldo; los siguientes abonan el 45%
    const importePago =
      idx === 0 ? deuda : Math.min(deuda, Math.max(10000, Math.floor((deuda * 45) / 100)));

    const fechaPago = construirTimestampFactura(hoyISO, 1, idx, 6);
    await registrarPago(
      idx % 2 === 0 ? admin : vendedor,
      cli.id,
      {
        importe: importePago,
        medio: medios[idx % medios.length],
        observacion:
          idx === 0
            ? "Cancelación total de saldo pendiente"
            : "Pago parcial a cuenta corriente",
      },
      { fecha: fechaPago }
    );
    pagosRegistrados += 1;
    if (pagosRegistrados >= 5) break;
  }

  console.log(
    `- Operaciones generadas: ${calendario.length} facturas emitidas (${aAnular.length} anuladas), ${pagosRegistrados} pagos registrados.`
  );
}

async function main() {
  console.log("Ejecutando seed inicial completo...");

  const admin = await asegurarUsuario(USUARIOS_INICIALES[0]);
  const vendedor = await asegurarUsuario(USUARIOS_INICIALES[1]);

  const [conteoFacturas] = await db.select({ total: count() }).from(facturas);
  const totalFacturasExistentes = Number(conteoFacturas?.total ?? 0);

  if (totalFacturasExistentes >= 50) {
    console.log(
      `- Seed ya aplicado previamente (${totalFacturasExistentes} facturas existentes). No se realizaron duplicados.`
    );
    return;
  }

  const categoriasMapa = await asegurarCategorias(admin);
  const productosMapa = await asegurarProductos(admin, categoriasMapa);
  const clientesLista = await asegurarClientes(admin);

  console.log(
    `- Catálogo asegurado: ${categoriasMapa.size} categorías, ${productosMapa.size} productos, ${clientesLista.length} clientes.`
  );

  await sembrarOperaciones(admin, vendedor, productosMapa, clientesLista);

  console.log("Seed comercial completado correctamente.");
}

main()
  .catch((error) => {
    console.error("Error al ejecutar seed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    client.close();
  });
