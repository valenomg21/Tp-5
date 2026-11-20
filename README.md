# Sistema de Gestión Comercial

Aplicación web integral para la gestión comercial de un comercio minorista: control de catálogo e inventario por movimientos, gestión de clientes y cuentas corrientes con recibos imprimibles, mostrador de facturación atómica con comprobantes e historial, tablero de métricas con gráficos y administración de usuarios por roles.

---

## Integrantes

- **Nombre y Apellido** — Legajo: `_______`
- **Nombre y Apellido** — Legajo: `_______`

---

## Enlace en producción

- **URL pública (Vercel):** `https://<tu-proyecto>.vercel.app` *(completar tras el despliegue)*

---

## Stack tecnológico

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Estilos y UI:** Tailwind CSS v4 + shadcn/ui (`@base-ui/react`) + Lucide Icons + Sonner
- **Gráficos:** Chart.js + `react-chartjs-2`
- **Validación:** Zod v4 (esquemas compartidos entre formularios cliente y servidor)
- **Base de datos y ORM:** Drizzle ORM + `@libsql/client` (SQLite local / Turso en producción)
- **Autenticación:** Sesión con cookie `httpOnly` firmada con HMAC-SHA256 y contraseñas con `bcryptjs`

---

## Módulos implementados

1. **Autenticación, roles y usuarios (`/login`, `/perfil`, `/usuarios`)**
   - Dos roles: `admin` y `vendedor`.
   - Verificación en tres capas: `src/proxy.ts` (cookie firmada), layouts/Server Components (`obtenerUsuarioActual()` en BD) y cada servicio (`exigirAdmin` / `ApiError`).
   - Gestión de usuarios (alta, edición, baja lógica, prevención de auto-baja/auto-cambio de rol y restablecimiento de contraseña temporal).
2. **Catálogo, categorías y movimientos de stock (`/productos`, `/productos/[id]`, `/productos/categorias`)**
   - Alta y edición de productos sin permitir modificar `existencia` directamente.
   - Único punto de ajuste de stock vía `moverStock()` con trazabilidad (`ingreso`, `egreso`, `venta`, `anulacion`) y alertas por stock bajo mínimo.
3. **Clientes, cuenta corriente y pagos (`/clientes`, `/clientes/[id]`, `/clientes/saldos`)**
   - Búsqueda por nombre o documento normalizado (`DNI`/`CUIT` sin puntos ni guiones).
   - Saldo derivado dinámicamente desde `movimientos_cuenta` (`débitos - créditos`).
   - Registro de pagos parciales o totales con generación de recibo correlativo e imprimible (`@media print`).
4. **Ventas y facturación (`/ventas`, `/ventas/nueva`, `/ventas/[id]`)**
   - Mostrador rápido por teclado con búsqueda por código/descripción, alta rápida de cliente sin perder el carrito, soporte para **Contado** (con cálculo de vuelto), **Tarjeta** (`tipo`, `marca` y últimos 4 dígitos; nunca almacena número completo) y **Cuenta corriente** (control de habilitación y límite de crédito).
   - Emisión atómica con congelamiento histórico de código, descripción y precio unitario.
   - Comprobante interno imprimible y anulación con motivo obligatorio exclusiva de `admin` (reingresa stock y acredita cuenta corriente).
5. **Tablero comercial (`/`)**
   - Indicadores del día y del mes en hora de Argentina (`America/Argentina/Buenos_Aires`), saldo total en cuentas corrientes y alertas de reposición.
   - Gráficos con Chart.js (ventas diarias de los últimos 30 días y ventas del mes por forma de pago) y ranking Top 5 del mes.

---

## Requisitos previos e instalación local

- **Node.js** 20 o superior
- **pnpm**

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno
cp .env.example .env
# En PowerShell (Windows): Copy-Item .env.example .env

# 3. Aplicar migraciones SQLite
pnpm run db:migrate

# 4. Cargar usuarios y datos comerciales iniciales (idempotente)
pnpm run db:seed

# 5. Iniciar en modo desarrollo
pnpm run dev
```

La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).

### Scripts disponibles (`package.json`)

| Script | Descripción |
| --- | --- |
| `pnpm run dev` | Inicia el servidor de desarrollo de Next.js |
| `pnpm run build` | Genera la compilación de producción |
| `pnpm run start` | Inicia la aplicación compilada en producción |
| `pnpm run lint` | Ejecuta ESLint |
| `pnpm run typecheck` | Verifica tipos TypeScript (`tsc --noEmit`) |
| `pnpm run db:generate` | Genera nuevas migraciones SQL con Drizzle Kit |
| `pnpm run db:migrate` | Ejecuta migraciones pendientes (`src/db/migrate.ts`) |
| `pnpm run db:seed` | Ejecuta el seed inicial usando los servicios de negocio (`src/db/seed.ts`) |

---

## Variables de entorno (`.env.example`)

| Variable | Local (`SQLite`) | Producción (`Turso` + `Vercel`) | Descripción |
| --- | --- | --- | --- |
| `DATABASE_URL` | `file:./local.db` | `libsql://<db>-<org>.turso.io` | URL de conexión libSQL |
| `DATABASE_AUTH_TOKEN` | `""` (vacío) | Token de Turso | Credencial de acceso remoto a Turso |
| `SESSION_SECRET` | Cadena aleatoria (>= 16 chars) | Clave secreta fuerte (>= 32 chars) | Secreto HMAC-SHA256 para firmar la cookie `sgc_sesion` |
| `NEXT_PUBLIC_APP_NAME` | `"Sistema de Gestión Comercial"` | Nombre del comercio | Título visible en cabecera, login y comprobantes |

---

## Usuarios de prueba y datos iniciales (`db:seed`)

| Rol | Nombre | Email | Contraseña |
| --- | --- | --- | --- |
| `admin` | Laura Méndez | `admin@comercio.test` | `Admin1234` |
| `vendedor` | Pablo Ruiz | `vendedor@comercio.test` | `Vendedor1234` |

Al ejecutar `pnpm run db:seed`, se crean invocando los mismos servicios de la aplicación:
- `2` usuarios iniciales (`admin` y `vendedor`).
- `6` categorías y `30` productos con stock inicial por movimiento (incluyendo artículos bajo stock mínimo).
- `10` clientes (varios con cuenta corriente habilitada y límites asignados).
- `50` facturas distribuidas en los últimos 30 días usando contado, tarjeta y cuenta corriente (`2` anuladas como muestra) y `5` pagos en cuenta corriente.

---

## Arquitectura y mapa de reglas de negocio (Defensa)

### Estructura de carpetas

```text
src/
├── actions/         # Server Actions delgadas (validan sesión y llaman a src/services/)
├── app/
│   ├── (app)/       # Páginas protegidas (Server Components + loading.tsx)
│   ├── api/         # 31 Route Handlers REST bajo /api/* (delgados)
│   └── login/       # Pantalla pública de acceso
├── components/      # Primitivas de maquetación, UI (shadcn/ui), compartidos y formularios cliente
├── db/              # Esquema Drizzle (schema.ts), cliente libSQL (index.ts), migrate.ts y seed.ts
├── hooks/           # Hook común de formularios (useFormAction)
├── lib/             # Sesión HMAC, errores (ApiError), formatos, helpers API/Actions y esquemas Zod
└── services/        # Única capa con reglas de negocio y transacciones atómicas
```

### Dónde vive cada regla de negocio

| Regla / Concepto | Archivo principal | Símbolo / Mecanismo |
| --- | --- | --- |
| Movimiento atómico y control concurrente de stock (`STOCK_INSUFICIENTE`, nunca stock negativo) | `src/services/stock.service.ts` | `moverStock(tx, input)` con `UPDATE ... WHERE existencia >= cantidad` |
| Prohibición de editar `existencia` vía `PATCH` de producto | `src/lib/schemas/productos.ts` y `src/services/productos.service.ts` | `editarProductoSchema.strict()` + `crearProducto` con movimiento inicial |
| Emisión atómica de factura (precios desde BD, congelamiento de renglones, vuelto, límite de crédito, numeración correlativa y débito en cuenta) | `src/services/facturas.service.ts` | `emitirFactura(usuario, datos, opciones)` en `db.transaction` |
| Anulación exclusiva de `admin` con motivo obligatorio, reingreso de stock y reversión contable | `src/services/facturas.service.ts` | `anularFactura(usuario, id, datos)` (`exigirAdmin`, `FACTURA_ANULADA`) |
| Rechazo de número completo de tarjeta (solo `tipo`, `marca`, `ultimos4`) | `src/lib/schemas/facturas.ts` | `pagoTarjetaSchema.strict()` |
| Saldo de cliente derivado (`SUM(débitos) - SUM(créditos)`) y bloqueo de baja con deuda | `src/services/clientes.service.ts` | `calcularSaldoCliente(tx, clienteId)` y `editarCliente` (`SALDO_PENDIENTE`) |
| Pagos a cuenta corriente con recibo correlativo y tope contra deuda actual | `src/services/pagos.service.ts` | `registrarPago(usuario, clienteId, datos)` (`PAGO_SUPERA_DEUDA`) |
| Categorías únicas y bloqueo de desactivación con productos activos | `src/services/categorias.service.ts` | `editarCategoria` (`NOMBRE_DUPLICADO`, `CATEGORIA_EN_USO`) |
| Autenticación, verificación de usuario activo en BD y permisos por rol (`401`/`403`) | `src/proxy.ts`, `src/lib/session.ts` y `src/services/auth.service.ts` | `obtenerUsuarioActual()`, `exigirAdmin()`, `iniciarSesion()` |
| Prevención de auto-desactivación / auto-quita de rol | `src/services/usuarios.service.ts` | `editarUsuario` (`OPERACION_SOBRE_SI_MISMO`) |
| Métricas del tablero en zona horaria Argentina (`emitida` únicamente) | `src/services/tablero.service.ts` y `src/lib/format.ts` | `obtenerTablero()`, `obtenerFechaISOArgentina()`, `rangoDiaArgentinaAUTC()` |
| Manejo unificado de errores HTTP y campos Zod | `src/lib/errors.ts`, `src/lib/api-handler.ts`, `src/lib/action-handler.ts` | `ApiError(status, code, message, details)` |

### Resumen de la API REST (31 endpoints)

- **Autenticación:** `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/password`.
- **Usuarios (solo `admin`):** `GET /api/usuarios`, `POST /api/usuarios`, `PATCH /api/usuarios/[id]`, `POST /api/usuarios/[id]/reset-password`.
- **Categorías, productos y stock:** `GET /api/categorias`, `POST /api/categorias` (`admin`), `PATCH /api/categorias/[id]` (`admin`), `GET /api/productos`, `GET /api/productos/[id]`, `POST /api/productos` (`admin`), `PATCH /api/productos/[id]` (`admin`), `GET /api/productos/[id]/movimientos`, `POST /api/productos/[id]/movimientos` (`admin`), `GET /api/movimientos-stock`.
- **Clientes y pagos:** `GET /api/clientes`, `POST /api/clientes`, `GET /api/clientes/[id]`, `PATCH /api/clientes/[id]`, `GET /api/clientes/[id]/cuenta`, `POST /api/clientes/[id]/pagos`, `GET /api/pagos/[id]`.
- **Facturas y tablero:** `GET /api/facturas`, `POST /api/facturas`, `GET /api/facturas/proximo-numero`, `GET /api/facturas/[id]`, `POST /api/facturas/[id]/anulacion` (`admin`), `GET /api/tablero`.

---

## Despliegue en Turso + Vercel

### 1. Crear base de datos en Turso

```bash
# Instalar o iniciar sesión en Turso CLI
turso auth login

# Crear la base de datos
turso db create gestion-comercial

# Obtener la URL de conexión (libsql://...)
turso db show gestion-comercial --url

# Generar un token de autenticación
turso db tokens create gestion-comercial
```

### 2. Aplicar migraciones y seed contra Turso

Definí temporalmente en tu terminal las credenciales de Turso y ejecutá migraciones y seed (usando `DATABASE_URL` y `DATABASE_AUTH_TOKEN` de producción):

```powershell
# PowerShell (Windows)
$env:DATABASE_URL="libsql://<tu-db>-<tu-org>.turso.io"
$env:DATABASE_AUTH_TOKEN="<tu-token-de-turso>"
pnpm run db:migrate
pnpm run db:seed
```

*(En Bash/Linux/macOS: `DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." pnpm run db:migrate && DATABASE_URL="..." DATABASE_AUTH_TOKEN="..." pnpm run db:seed`.)*

### 3. Desplegar en Vercel

1. Subí el repositorio a GitHub e importalo en [vercel.com](https://vercel.com) como proyecto **Next.js**.
2. En **Settings -> Environment Variables**, cargá las 4 variables:
   - `DATABASE_URL` = `libsql://<tu-db>-<tu-org>.turso.io`
   - `DATABASE_AUTH_TOKEN` = `<tu-token-de-turso>`
   - `SESSION_SECRET` = `<cadena-aleatoria-segura-de-al-menos-32-caracteres>`
   - `NEXT_PUBLIC_APP_NAME` = `"Sistema de Gestión Comercial"` *(o el nombre de tu comercio)*
3. Ejecutá el deploy (`pnpm run build` se corre automáticamente en Vercel) y probá el acceso sobre la URL pública.
