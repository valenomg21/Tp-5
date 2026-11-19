import {
  jsonOk,
  leerJsonBody,
  parsearIdNumerico,
  withAuthApi,
} from "@/lib/api-handler";
import { anularFactura } from "@/services/facturas.service";

export const POST = withAuthApi<{ id: string }>(
  async ({ request, params, usuario }) => {
    const id = parsearIdNumerico(params.id);
    const body = await leerJsonBody(request);
    const factura = await anularFactura(usuario, id, body);
    return jsonOk(factura, 200);
  }
);
