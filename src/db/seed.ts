import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { client, db } from "./index";
import { usuarios } from "./schema";

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

async function asegurarUsuario(datos: (typeof USUARIOS_INICIALES)[number]) {
  const [existente] = await db
    .select({ id: usuarios.id, email: usuarios.email, rol: usuarios.rol })
    .from(usuarios)
    .where(eq(usuarios.email, datos.email))
    .limit(1);

  if (existente) {
    console.log(`- Ya existe: ${existente.email} (${existente.rol})`);
    return;
  }

  const passwordHash = await bcrypt.hash(datos.passwordPlano, 10);

  await db.insert(usuarios).values({
    nombre: datos.nombre,
    email: datos.email,
    passwordHash,
    rol: datos.rol,
    activo: true,
  });

  console.log(
    `- Creado: ${datos.email} (${datos.rol}) | clave: ${datos.passwordPlano}`
  );
}

async function main() {
  console.log("Ejecutando seed inicial de usuarios...");

  for (const usuario of USUARIOS_INICIALES) {
    await asegurarUsuario(usuario);
  }

  console.log("Seed inicial completado.");
}

main()
  .catch((error) => {
    console.error("Error al ejecutar seed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    client.close();
  });
