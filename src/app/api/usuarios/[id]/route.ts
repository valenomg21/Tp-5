import {
  jsonOk,
  leerJsonBody,
  parsearIdNumerico,
  withAuthApi,
} from "@/lib/api-handler";
import { editarUsuario } from "@/services/usuarios.service";

export const PATCH = withAuthApi<{ id: string }>(
  async ({ request, params, usuario }) => {
    const id = parsearIdNumerico(params.id);
    const body = await leerJsonBody(request);
    const actualizado = await editarUsuario(usuario, id, body);
    return jsonOk(actualizado, 200);
  }
);
