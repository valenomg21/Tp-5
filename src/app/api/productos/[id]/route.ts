import {
  jsonOk,
  leerJsonBody,
  parsearIdNumerico,
  withAuthApi,
} from "@/lib/api-handler";
import {
  editarProducto,
  obtenerProductoPorId,
} from "@/services/productos.service";

export const GET = withAuthApi<{ id: string }>(
  async ({ params, usuario }) => {
    const id = parsearIdNumerico(params.id);
    const producto = await obtenerProductoPorId(usuario, id);
    return jsonOk(producto, 200);
  }
);

export const PATCH = withAuthApi<{ id: string }>(
  async ({ request, params, usuario }) => {
    const id = parsearIdNumerico(params.id);
    const body = await leerJsonBody(request);
    const actualizado = await editarProducto(usuario, id, body);
    return jsonOk(actualizado, 200);
  }
);
