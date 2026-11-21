# Sistema de Gestión Comercial

Aplicación web para la gestión comercial de un comercio minorista: administración de productos, categorías y movimientos de stock, gestión de clientes con cuenta corriente y registro de pagos con recibos imprimibles, mostrador de facturación atómica con anulación, tablero con gráficos estadísticos y control de acceso por roles (`admin` y `vendedor`).

---

## Integrantes

- **Nombre y Apellido** — Legajo: `_______`
- **Nombre y Apellido** — Legajo: `_______`
- **Nombre y Apellido** — Legajo: `_______`

---

## URL pública

- **Aplicación en Vercel:** `https://<tu-proyecto>.vercel.app` *(completar con el enlace publicado)*

---

## Instalación y ejecución local

Requisitos: **Node.js 20+** y **pnpm**.

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar archivo de variables de entorno
cp .env.example .env
# En PowerShell (Windows): Copy-Item .env.example .env

# 3. Aplicar migraciones de la base de datos SQLite
pnpm run db:migrate

# 4. Cargar usuarios y datos de prueba iniciales
pnpm run db:seed

# 5. Iniciar el servidor de desarrollo
pnpm run dev
```

La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).

---

## Variables de entorno (`.env.example`)

| Variable | Valor en local | Uso |
| --- | --- | --- |
| `DATABASE_URL` | `file:./local.db` | Ruta SQLite local o URL `libsql://...` de Turso en producción |
| `DATABASE_AUTH_TOKEN` | `""` | Vacío en local; token de autenticación de Turso en producción |
| `SESSION_SECRET` | Cadena aleatoria (>= 16 chars) | Secreto para firmar las cookies `httpOnly` de sesión |
| `NEXT_PUBLIC_APP_NAME` | `"Sistema de Gestión Comercial"` | Nombre visible del comercio en la aplicación y comprobantes |

---

## Usuarios de prueba por rol

| Rol | Nombre | Email | Contraseña |
| --- | --- | --- | --- |
| `admin` | Laura Méndez | `admin@comercio.test` | `Admin1234` |
| `vendedor` | Pablo Ruiz | `vendedor@comercio.test` | `Vendedor1234` |
