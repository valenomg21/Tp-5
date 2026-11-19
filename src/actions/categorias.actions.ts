"use server";

import { revalidatePath } from "next/cache";
import { runAuthAction } from "@/lib/action-handler";
import { crearCategoria, editarCategoria } from "@/services/categorias.service";

export async function crearCategoriaAction(datosSinValidar: unknown) {
  return runAuthAction(async (usuario) => {
    const creada = await crearCategoria(usuario, datosSinValidar);
    revalidatePath("/productos");
    revalidatePath("/productos/categorias");
    return creada;
  });
}

export async function editarCategoriaAction(
  id: number,
  datosSinValidar: unknown
) {
  return runAuthAction(async (usuario) => {
    const actualizada = await editarCategoria(usuario, id, datosSinValidar);
    revalidatePath("/productos");
    revalidatePath("/productos/categorias");
    return actualizada;
  });
}
