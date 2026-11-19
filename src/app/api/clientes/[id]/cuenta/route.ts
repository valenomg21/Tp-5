import { jsonOk, parsearIdNumerico, withAuthApi } from "@/lib/api-handler";
import { obtenerCuentaCorrienteCliente } from "@/services/clientes.service";

export const GET = withAuthApi<{ id: string }>(
  async ({ request, params, usuario }) => {
    const clienteId = parsearIdNumerico(params.id);
    const sp = request.nextUrl.searchParams;
    const cuenta = await obtenerCuentaCorrienteCliente(usuario, clienteId, {
      desde: sp.get("desde") ?? undefined,
      hasta: sp.get("hasta") ?? undefined,
    });
    return jsonOk(cuenta, 200);
  }
);
