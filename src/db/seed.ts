import "dotenv/config";
import bcrypt from "bcryptjs";
import { and, count, eq, sql } from "drizzle-orm";
import { client, db } from "./index";
import {
  categorias,
  clientes,
  facturaItems,
  facturas,
  movimientosCuenta,
  movimientosStock,
  pagos,
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
  "Sobres (Booster Packs)",
  "Elite Trainer Boxes (ETB)",
  "Cajas y Latas (Bundles & Tins)",
  "Mazos Listos (Battle Decks)",
  "Cartas Sueltas (Singles)",
  "Accesorios y Protección",
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
  // Sobres (Booster Packs)
  {
    codigo: "SOB-001",
    descripcion: "Sobre Scarlet & Violet: Prismatic Evolutions",
    categoria: "Sobres (Booster Packs)",
    precio: 2650000,
    stockMinimo: 25,
    stockInicial: 30,
  },
  {
    codigo: "SOB-002",
    descripcion: "Sobre Scarlet & Violet: Surging Sparks",
    categoria: "Sobres (Booster Packs)",
    precio: 1950000,
    stockMinimo: 24,
    stockInicial: 140,
  },
  {
    codigo: "SOB-003",
    descripcion: "Sobre Scarlet & Violet: 151 (Edición Especial)",
    categoria: "Sobres (Booster Packs)",
    precio: 2800000,
    stockMinimo: 20,
    stockInicial: 24,
  },
  {
    codigo: "SOB-004",
    descripcion: "Sobre Scarlet & Violet: Stellar Crown",
    categoria: "Sobres (Booster Packs)",
    precio: 1750000,
    stockMinimo: 20,
    stockInicial: 120,
  },
  {
    codigo: "SOB-005",
    descripcion: "Sobre Scarlet & Violet: Twilight Masquerade",
    categoria: "Sobres (Booster Packs)",
    precio: 1850000,
    stockMinimo: 20,
    stockInicial: 110,
  },

  // Elite Trainer Boxes (ETB)
  {
    codigo: "ETB-001",
    descripcion: "Elite Trainer Box: Prismatic Evolutions",
    categoria: "Elite Trainer Boxes (ETB)",
    precio: 34000000,
    stockMinimo: 6,
    stockInicial: 10,
  },
  {
    codigo: "ETB-002",
    descripcion: "Elite Trainer Box: Surging Sparks (Pikachu ex)",
    categoria: "Elite Trainer Boxes (ETB)",
    precio: 22500000,
    stockMinimo: 5,
    stockInicial: 40,
  },
  {
    codigo: "ETB-003",
    descripcion: "Elite Trainer Box: Shrouded Fable",
    categoria: "Elite Trainer Boxes (ETB)",
    precio: 19500000,
    stockMinimo: 5,
    stockInicial: 38,
  },
  {
    codigo: "ETB-004",
    descripcion: "Elite Trainer Box: Temporal Forces (Walking Wake)",
    categoria: "Elite Trainer Boxes (ETB)",
    precio: 21000000,
    stockMinimo: 5,
    stockInicial: 36,
  },
  {
    codigo: "ETB-005",
    descripcion: "Elite Trainer Box: Obsidian Flames (Charmander)",
    categoria: "Elite Trainer Boxes (ETB)",
    precio: 23500000,
    stockMinimo: 4,
    stockInicial: 35,
  },

  // Cajas y Latas (Bundles & Tins)
  {
    codigo: "CAJ-001",
    descripcion: "Booster Bundle Surging Sparks (6 sobres)",
    categoria: "Cajas y Latas (Bundles & Tins)",
    precio: 14500000,
    stockMinimo: 6,
    stockInicial: 55,
  },
  {
    codigo: "CAJ-002",
    descripcion: "Booster Bundle Prismatic Evolutions (6 sobres)",
    categoria: "Cajas y Latas (Bundles & Tins)",
    precio: 18500000,
    stockMinimo: 6,
    stockInicial: 48,
  },
  {
    codigo: "CAJ-003",
    descripcion: "Tin Coleccionista Charizard ex (5 sobres + Promo)",
    categoria: "Cajas y Latas (Bundles & Tins)",
    precio: 7400000,
    stockMinimo: 8,
    stockInicial: 60,
  },
  {
    codigo: "CAJ-004",
    descripcion: "Mini Tin Pokémon 151 / Kanto Friends (2 sobres)",
    categoria: "Cajas y Latas (Bundles & Tins)",
    precio: 3400000,
    stockMinimo: 12,
    stockInicial: 16,
  },
  {
    codigo: "CAJ-005",
    descripcion: "Collection Box Terapagos ex Ultra-Premium",
    categoria: "Cajas y Latas (Bundles & Tins)",
    precio: 29500000,
    stockMinimo: 4,
    stockInicial: 30,
  },

  // Mazos Listos (Battle Decks)
  {
    codigo: "MAZ-001",
    descripcion: "League Battle Deck: Charizard ex (Competitivo 60 cartas)",
    categoria: "Mazos Listos (Battle Decks)",
    precio: 9200000,
    stockMinimo: 6,
    stockInicial: 50,
  },
  {
    codigo: "MAZ-002",
    descripcion: "League Battle Deck: Gardevoir ex",
    categoria: "Mazos Listos (Battle Decks)",
    precio: 8800000,
    stockMinimo: 6,
    stockInicial: 45,
  },
  {
    codigo: "MAZ-003",
    descripcion: "ex Battle Deck: Chien-Pao ex (Español)",
    categoria: "Mazos Listos (Battle Decks)",
    precio: 3600000,
    stockMinimo: 8,
    stockInicial: 65,
  },
  {
    codigo: "MAZ-004",
    descripcion: "ex Battle Deck: Tinkaton ex (Español)",
    categoria: "Mazos Listos (Battle Decks)",
    precio: 3600000,
    stockMinimo: 8,
    stockInicial: 65,
  },
  {
    codigo: "MAZ-005",
    descripcion: "My First Battle: Pikachu & Bulbasaur (Doble Mazo)",
    categoria: "Mazos Listos (Battle Decks)",
    precio: 4900000,
    stockMinimo: 6,
    stockInicial: 50,
  },

  // Cartas Sueltas (Singles)
  {
    codigo: "SGL-001",
    descripcion: "Single: Charizard ex #199/165 SIR (151 - NM)",
    categoria: "Cartas Sueltas (Singles)",
    precio: 38000000,
    stockMinimo: 5,
    stockInicial: 8,
  },
  {
    codigo: "SGL-002",
    descripcion: "Single: Pikachu ex #238/191 SIR (Surging Sparks - NM)",
    categoria: "Cartas Sueltas (Singles)",
    precio: 32000000,
    stockMinimo: 3,
    stockInicial: 30,
  },
  {
    codigo: "SGL-003",
    descripcion: "Single: Umbreon ex #161/131 SIR (Prismatic - NM)",
    categoria: "Cartas Sueltas (Singles)",
    precio: 42000000,
    stockMinimo: 2,
    stockInicial: 25,
  },
  {
    codigo: "SGL-004",
    descripcion: "Single: Fezandipiti ex #038/064 (Competitiva - NM)",
    categoria: "Cartas Sueltas (Singles)",
    precio: 5800000,
    stockMinimo: 6,
    stockInicial: 55,
  },
  {
    codigo: "SGL-005",
    descripcion: "Single: Prime Catcher #157/162 ACE SPEC (NM)",
    categoria: "Cartas Sueltas (Singles)",
    precio: 5200000,
    stockMinimo: 6,
    stockInicial: 55,
  },

  // Accesorios y Protección
  {
    codigo: "ACC-001",
    descripcion: "Folios Dragon Shield Matte Dual 100u (Negro / Rojo)",
    categoria: "Accesorios y Protección",
    precio: 2450000,
    stockMinimo: 15,
    stockInicial: 95,
  },
  {
    codigo: "ACC-002",
    descripcion: "Paquete Toploaders Ultra Pro Rígidos 3x4 x25 u.",
    categoria: "Accesorios y Protección",
    precio: 1450000,
    stockMinimo: 20,
    stockInicial: 110,
  },
  {
    codigo: "ACC-003",
    descripcion: "Carpeta Álbum Ultra Pro 9 Bolsillos Pikachu",
    categoria: "Accesorios y Protección",
    precio: 4200000,
    stockMinimo: 10,
    stockInicial: 14,
  },
  {
    codigo: "ACC-004",
    descripcion: "Deck Box Satin Cube Ultra Pro (Capacidad 100+)",
    categoria: "Accesorios y Protección",
    precio: 3100000,
    stockMinimo: 10,
    stockInicial: 65,
  },
  {
    codigo: "ACC-005",
    descripcion: "Playmat Oficial Pokémon Lucario & Aura (Neoprene)",
    categoria: "Accesorios y Protección",
    precio: 6200000,
    stockMinimo: 6,
    stockInicial: 45,
  },
];

const CLIENTES_INICIALES = [
  {
    tipoDoc: "CUIT" as const,
    nroDoc: "30-71458920-1",
    nombre: "Liga Kanto Buenos Aires SRL",
    domicilio: "Av. Corrientes 2450, CABA",
    telefono: "11-4589-2010",
    email: "compras@ligakanto.test",
    cuentaCorriente: true,
    limiteCredito: 1000000000,
  },
  {
    tipoDoc: "CUIT" as const,
    nroDoc: "30-68912450-8",
    nombre: "Comiquería Rayquaza Norte SA",
    domicilio: "Av. Cabildo 1820, CABA",
    telefono: "11-4791-3340",
    email: "pedidos@rayquazanorte.test",
    cuentaCorriente: true,
    limiteCredito: 950000000,
  },
  {
    tipoDoc: "DNI" as const,
    nroDoc: "28.456.123",
    nombre: "Martín Sebastián Gómez",
    domicilio: "Calle 12 N° 845, La Plata",
    telefono: "221-512-7789",
    email: "mgomez@correo.test",
    cuentaCorriente: true,
    limiteCredito: 700000000,
  },
  {
    tipoDoc: "CUIT" as const,
    nroDoc: "27-29345612-4",
    nombre: "Club Estratégico Paldea",
    domicilio: "Juramento 2140, Belgrano",
    telefono: "11-4784-9901",
    email: "torneos@clubpaldea.test",
    cuentaCorriente: true,
    limiteCredito: 900000000,
  },
  {
    tipoDoc: "DNI" as const,
    nroDoc: "31.902.445",
    nombre: "Carolina Alejandra Vega",
    domicilio: "San Martín 612, Quilmes",
    telefono: "11-6241-8832",
    email: "cvega@correo.test",
    cuentaCorriente: true,
    limiteCredito: 650000000,
  },
  {
    tipoDoc: "CUIT" as const,
    nroDoc: "30-70983112-6",
    nombre: "Gremio Johto Coleccionables SRL",
    domicilio: "Bv. Oroño 940, Rosario",
    telefono: "341-442-1190",
    email: "mayorista@gremiojohto.test",
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
    nombre: "Arena Sinnoh Hobby Store",
    domicilio: "Av. Hipólito Yrigoyen 4120, Lanús",
    telefono: "11-4241-5509",
    email: "contacto@arenasinnoh.test",
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

async function limpiarCatalogoYOperaciones() {
  console.log("- Limpiando datos previos (--reset) manteniendo usuarios...");
  await db.delete(movimientosCuenta);
  await db.delete(pagos);
  await db.delete(movimientosStock);
  await db.delete(facturaItems);
  await db.delete(facturas);
  await db.delete(productos);
  await db.delete(categorias);
  await db.delete(clientes);
}

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
    const inicioHoyMs = new Date(rangoDiaArgentinaAUTC(hoyISO).inicio).getTime();
    const ahoraSeguroMs = Math.max(inicioHoyMs + 120_000, Date.now() - 60_000);
    const fraccion = (indiceEnElDia + 1) / (totalEnElDia + 1);
    const marcaMs = Math.floor(
      inicioHoyMs + fraccion * (ahoraSeguroMs - inicioHoyMs)
    );
    return new Date(marcaMs).toISOString();
  }

  const horas = 10 + ((indiceEnElDia * 3) % 9);
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
  // Productos pensados para quedar bajo stock mínimo (y SGL-001 en 0) tras las ventas
  const codigosRotacionAlta = [
    "SOB-001",
    "SOB-003",
    "ETB-001",
    "CAJ-004",
    "SGL-001",
    "ACC-003",
  ];
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

    const itemsSeleccionados: { productoId: number; cantidad: number }[] = [];
    const idsUsados = new Set<number>();

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
      const cantidad = Math.min(((i + j) % 3) + 1, prodSec.existencia);
      itemsSeleccionados.push({ productoId: prodSec.id, cantidad });
      idsUsados.add(prodSec.id);
      prodSec.existencia -= cantidad;
    }

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
                : Math.ceil((subtotalEstimado + 500000) / 500000) * 500000,
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
      motivo: "Error en edición solicitada por el entrenador al retirar",
    });
  }
  if (emitidasCtaCte[1]) {
    aAnular.push({
      id: emitidasCtaCte[1],
      motivo: "Caja sellada reemplazada por pedido de liga",
    });
  }

  for (const item of aAnular) {
    await anularFactura(admin, item.id, {
      motivo: item.motivo,
    });
  }

  const medios = ["transferencia", "efectivo", "tarjeta_debito"] as const;
  let pagosRegistrados = 0;

  for (let idx = 0; idx < clientesConCtaCte.length; idx += 1) {
    const cli = clientesConCtaCte[idx];
    const deuda = await calcularSaldoCliente(db, cli.id);
    if (deuda <= 0) continue;

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
  const esReset = process.argv.includes("--reset");
  console.log(
    esReset
      ? "Ejecutando seed completo Pokémon TCG con reinicio (--reset)..."
      : "Ejecutando seed completo Pokémon TCG..."
  );

  const admin = await asegurarUsuario(USUARIOS_INICIALES[0]);
  const vendedor = await asegurarUsuario(USUARIOS_INICIALES[1]);

  if (esReset) {
    await limpiarCatalogoYOperaciones();
  }

  const [conteoFacturas] = await db.select({ total: count() }).from(facturas);
  const totalFacturasExistentes = Number(conteoFacturas?.total ?? 0);

  if (totalFacturasExistentes >= 50) {
    console.log(
      `- Seed ya aplicado previamente (${totalFacturasExistentes} facturas existentes). Usá "-- --reset" si deseás reemplazar el catálogo.`
    );
    return;
  }

  const categoriasMapa = await asegurarCategorias(admin);
  const productosMapa = await asegurarProductos(admin, categoriasMapa);
  const clientesLista = await asegurarClientes(admin);

  console.log(
    `- Catálogo PokéDeck TCG asegurado: ${categoriasMapa.size} categorías, ${productosMapa.size} productos, ${clientesLista.length} clientes.`
  );

  await sembrarOperaciones(admin, vendedor, productosMapa, clientesLista);

  console.log("Seed PokéDeck TCG completado correctamente.");
}

main()
  .catch((error) => {
    console.error("Error al ejecutar seed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    client.close();
  });
