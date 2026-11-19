import {
  jsonOk,
  leerJsonBody,
  parsearIdNumerico,
  withAuthApi,
} from "@/lib/api-handler";
import { editarCategoria } from "@/services/categorias.service";

export const PATCH = withAuthApi<{ id: string }>(
  async ({ request, params, usuario }) => {
    const id = parsearIdNumerico(params.id);
    const body = await leerJsonBody(request);
    const actualizada = await editarCategoria(usuario, id, body);
    return jsonOk(actualizada, 200);
  }
);
