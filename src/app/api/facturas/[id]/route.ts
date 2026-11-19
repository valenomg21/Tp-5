import { jsonOk, parsearIdNumerico, withAuthApi } from "@/lib/api-handler";
import { obtenerFacturaPorId } from "@/services/facturas.service";

export const GET = withAuthApi<{ id: string }>(
  async ({ params, usuario }) => {
    const id = parsearIdNumerico(params.id);
    const factura = await obtenerFacturaPorId(usuario, id);
    return jsonOk(factura, 200);
  }
);
