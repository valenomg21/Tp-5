import { jsonOk, withAuthApi } from "@/lib/api-handler";
import { obtenerUsuarioAutenticado } from "@/services/auth.service";

export const GET = withAuthApi(async ({ usuario }) => {
  return jsonOk(obtenerUsuarioAutenticado(usuario), 200);
});
