import { jsonOk, parsearIdNumerico, withAuthApi } from "@/lib/api-handler";
import { obtenerPagoPorId } from "@/services/pagos.service";

export const GET = withAuthApi<{ id: string }>(
  async ({ params, usuario }) => {
    const pagoId = parsearIdNumerico(params.id);
    const recibo = await obtenerPagoPorId(usuario, pagoId);
    return jsonOk(recibo, 200);
  }
);
