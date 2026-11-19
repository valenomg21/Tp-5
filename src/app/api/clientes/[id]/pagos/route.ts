import {
  jsonOk,
  leerJsonBody,
  parsearIdNumerico,
  withAuthApi,
} from "@/lib/api-handler";
import { registrarPago } from "@/services/pagos.service";

export const POST = withAuthApi<{ id: string }>(
  async ({ request, params, usuario }) => {
    const clienteId = parsearIdNumerico(params.id);
    const body = await leerJsonBody(request);
    const recibo = await registrarPago(usuario, clienteId, body);
    return jsonOk(recibo, 201);
  }
);
