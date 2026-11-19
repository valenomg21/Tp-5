"use server";

import { revalidatePath } from "next/cache";
import { runAuthAction } from "@/lib/action-handler";
import {
  crearUsuario,
  editarUsuario,
  restablecerContrasenaUsuario,
} from "@/services/usuarios.service";

export async function crearUsuarioAction(datosSinValidar: unknown) {
  return runAuthAction(async (usuario) => {
    const creado = await crearUsuario(usuario, datosSinValidar);
    revalidatePath("/usuarios");
    return creado;
  });
}

export async function editarUsuarioAction(
  id: number,
  datosSinValidar: unknown
) {
  return runAuthAction(async (usuario) => {
    const actualizado = await editarUsuario(usuario, id, datosSinValidar);
    revalidatePath("/usuarios");
    return actualizado;
  });
}

export async function resetPasswordUsuarioAction(id: number) {
  return runAuthAction(async (usuario) => {
    return restablecerContrasenaUsuario(usuario, id);
  });
}
