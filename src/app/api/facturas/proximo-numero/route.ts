import { jsonOk, withAuthApi } from "@/lib/api-handler";
import { obtenerProximoNumero } from "@/services/facturas.service";

export const GET = withAuthApi(async ({ usuario }) => {
  const resultado = await obtenerProximoNumero(usuario);
  return jsonOk(resultado, 200);
});
