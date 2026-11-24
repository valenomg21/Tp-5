import bcrypt from "bcryptjs";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import {
  cambiarPasswordSchema,
  loginDemoSchema,
  loginSchema,
} from "@/lib/schemas/auth";
import type { UsuarioSesion } from "@/lib/session";
import { firmarTokenSesion } from "@/lib/session-token";

// RF-U1, RF-U4: autentica credenciales contra BD, rechaza inactivos con el mismo error.
export async function iniciarSesion(datosSinValidar: unknown): Promise<{
  usuario: UsuarioSesion;
  token: string;
}> {
  const { email, password } = loginSchema.parse(datosSinValidar);
  const emailNormalizado = email.toLowerCase();

  const [fila] = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      passwordHash: usuarios.passwordHash,
      rol: usuarios.rol,
      activo: usuarios.activo,
    })
    .from(usuarios)
    .where(eq(usuarios.email, emailNormalizado))
    .limit(1);

  if (!fila || !fila.activo) {
    throw new ApiError(
      401,
      "CREDENCIALES_INVALIDAS",
      "Email o contraseña incorrectos."
    );
  }

  const coincide = await bcrypt.compare(password, fila.passwordHash);
  if (!coincide) {
    throw new ApiError(
      401,
      "CREDENCIALES_INVALIDAS",
      "Email o contraseña incorrectos."
    );
  }

  const token = await firmarTokenSesion(fila.id);

  return {
    usuario: {
      id: fila.id,
      nombre: fila.nombre,
      email: fila.email,
      rol: fila.rol,
    },
    token,
  };
}

const EMAIL_DEMO_POR_ROL = {
  admin: "admin@comercio.test",
  vendedor: "vendedor@comercio.test",
} as const;

// RF-U1 (modo demo): inicia sesión directa para el rol elegido sin validar contraseña,
// manteniendo la verificación de usuario activo y la cookie firmada HMAC-SHA256.
export async function iniciarSesionDemo(datosSinValidar: unknown): Promise<{
  usuario: UsuarioSesion;
  token: string;
}> {
  const { rol } = loginDemoSchema.parse(datosSinValidar);
  const emailPreferido = EMAIL_DEMO_POR_ROL[rol];

  const columnas = {
    id: usuarios.id,
    nombre: usuarios.nombre,
    email: usuarios.email,
    rol: usuarios.rol,
  };

  let [fila] = await db
    .select(columnas)
    .from(usuarios)
    .where(
      and(
        eq(usuarios.email, emailPreferido),
        eq(usuarios.rol, rol),
        eq(usuarios.activo, true)
      )
    )
    .limit(1);

  if (!fila) {
    [fila] = await db
      .select(columnas)
      .from(usuarios)
      .where(and(eq(usuarios.rol, rol), eq(usuarios.activo, true)))
      .orderBy(asc(usuarios.id))
      .limit(1);
  }

  if (!fila) {
    throw new ApiError(
      404,
      "NO_ENCONTRADO",
      "No hay un usuario demo activo disponible para ese rol."
    );
  }

  const token = await firmarTokenSesion(fila.id);

  return {
    usuario: {
      id: fila.id,
      nombre: fila.nombre,
      email: fila.email,
      rol: fila.rol,
    },
    token,
  };
}

// RF-U2: devuelve la identidad pública del usuario autenticado.
export function obtenerUsuarioAutenticado(
  usuario: UsuarioSesion
): UsuarioSesion {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
}

// RF-U5: cambia la contraseña propia verificando previamente la contraseña actual.
export async function cambiarContrasenaPropia(
  usuario: UsuarioSesion,
  datosSinValidar: unknown
): Promise<void> {
  const { actual, nueva } = cambiarPasswordSchema.parse(datosSinValidar);

  const [fila] = await db
    .select({
      id: usuarios.id,
      passwordHash: usuarios.passwordHash,
    })
    .from(usuarios)
    .where(eq(usuarios.id, usuario.id))
    .limit(1);

  if (!fila) {
    throw new ApiError(401, "NO_AUTENTICADO", "La sesión no es válida.");
  }

  const coincide = await bcrypt.compare(actual, fila.passwordHash);
  if (!coincide) {
    throw new ApiError(
      422,
      "CONTRASENA_ACTUAL_INCORRECTA",
      "La contraseña actual es incorrecta.",
      [{ campo: "actual", mensaje: "La contraseña actual es incorrecta." }]
    );
  }

  const nuevoHash = await bcrypt.hash(nueva, 10);

  await db
    .update(usuarios)
    .set({ passwordHash: nuevoHash })
    .where(eq(usuarios.id, usuario.id));
}
