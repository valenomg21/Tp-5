import { jsonOk, withAuthApi } from "@/lib/api-handler";
import { obtenerTablero } from "@/services/tablero.service";

export const GET = withAuthApi(async ({ usuario }) => {
  const metricas = await obtenerTablero(usuario);
  return jsonOk(metricas, 200);
});
