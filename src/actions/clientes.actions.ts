"use server";

import { revalidatePath } from "next/cache";
import { runAuthAction } from "@/lib/action-handler";
import { crearCliente, editarCliente } from "@/services/clientes.service";
import { registrarPago } from "@/services/pagos.service";

export async function crearClienteAction(datosSinValidar: unknown) {
  return runAuthAction(async (usuario) => {
    const creado = await crearCliente(usuario, datosSinValidar);
    revalidatePath("/clientes");
    revalidatePath("/clientes/saldos");
    return creado;
  });
}

export async function editarClienteAction(
  id: number,
  datosSinValidar: unknown
) {
  return runAuthAction(async (usuario) => {
    const actualizado = await editarCliente(usuario, id, datosSinValidar);
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/clientes/saldos");
    return actualizado;
  });
}

export async function registrarPagoAction(
  clienteId: number,
  datosSinValidar: unknown
) {
  return runAuthAction(async (usuario) => {
    const recibo = await registrarPago(usuario, clienteId, datosSinValidar);
    revalidatePath("/");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath("/clientes/saldos");
    return recibo;
  });
}
