import { jsonOk, parsearIdNumerico, withAuthApi } from "@/lib/api-handler";
import { restablecerContrasenaUsuario } from "@/services/usuarios.service";

export const POST = withAuthApi<{ id: string }>(
  async ({ params, usuario }) => {
    const id = parsearIdNumerico(params.id);
    const resultado = await restablecerContrasenaUsuario(usuario, id);
    return jsonOk(resultado, 200);
  }
);
