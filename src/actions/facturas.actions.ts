"use server";

import { revalidatePath } from "next/cache";
import { runAuthAction } from "@/lib/action-handler";
import { anularFactura } from "@/services/facturas.service";

export async function anularFacturaAction(
  id: number,
  datosSinValidar: unknown
) {
  return runAuthAction(async (usuario) => {
    const factura = await anularFactura(usuario, id, datosSinValidar);
    revalidatePath("/ventas");
    revalidatePath(`/ventas/${id}`);
    revalidatePath("/productos");
    revalidatePath("/clientes");
    revalidatePath("/clientes/saldos");
    return factura;
  });
}
