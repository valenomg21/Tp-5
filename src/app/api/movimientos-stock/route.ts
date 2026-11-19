import { jsonOk, withAuthApi } from "@/lib/api-handler";
import { listarMovimientosStock } from "@/services/stock.service";

export const GET = withAuthApi(async ({ request, usuario }) => {
  const sp = request.nextUrl.searchParams;
  const resultado = await listarMovimientosStock(usuario, {
    productoId: sp.get("productoId") ?? undefined,
    tipo: sp.get("tipo") ?? undefined,
    desde: sp.get("desde") ?? undefined,
    hasta: sp.get("hasta") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
  return jsonOk(resultado, 200);
});
