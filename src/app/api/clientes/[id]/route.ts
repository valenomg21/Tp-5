import {
  jsonOk,
  leerJsonBody,
  parsearIdNumerico,
  withAuthApi,
} from "@/lib/api-handler";
import { editarCliente, obtenerClientePorId } from "@/services/clientes.service";

export const GET = withAuthApi<{ id: string }>(
  async ({ params, usuario }) => {
    const id = parsearIdNumerico(params.id);
    const cliente = await obtenerClientePorId(usuario, id);
    return jsonOk(cliente, 200);
  }
);

export const PATCH = withAuthApi<{ id: string }>(
  async ({ request, params, usuario }) => {
    const id = parsearIdNumerico(params.id);
    const body = await leerJsonBody(request);
    const actualizado = await editarCliente(usuario, id, body);
    return jsonOk(actualizado, 200);
  }
);
