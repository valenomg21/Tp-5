"use server";

import { revalidatePath } from "next/cache";
import { runAuthAction } from "@/lib/action-handler";
import { crearProducto, editarProducto } from "@/services/productos.service";
import { registrarMovimientoManual } from "@/services/stock.service";

export async function crearProductoAction(datosSinValidar: unknown) {
  return runAuthAction(async (usuario) => {
    const creado = await crearProducto(usuario, datosSinValidar);
    revalidatePath("/productos");
    return creado;
  });
}

export async function editarProductoAction(
  id: number,
  datosSinValidar: unknown
) {
  return runAuthAction(async (usuario) => {
    const actualizado = await editarProducto(usuario, id, datosSinValidar);
    revalidatePath("/productos");
    revalidatePath(`/productos/${id}`);
    return actualizado;
  });
}

export async function registrarMovimientoStockAction(
  productoId: number,
  datosSinValidar: unknown
) {
  return runAuthAction(async (usuario) => {
    const movimiento = await registrarMovimientoManual(
      usuario,
      productoId,
      datosSinValidar
    );
    revalidatePath("/productos");
    revalidatePath(`/productos/${productoId}`);
    return movimiento;
  });
}
