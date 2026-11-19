import {
  jsonOk,
  leerJsonBody,
  parsearIdNumerico,
  withAuthApi,
} from "@/lib/api-handler";
import {
  listarMovimientosDeProducto,
  registrarMovimientoManual,
} from "@/services/stock.service";

export const GET = withAuthApi<{ id: string }>(
  async ({ request, params, usuario }) => {
    const productoId = parsearIdNumerico(params.id);
    const sp = request.nextUrl.searchParams;
    const resultado = await listarMovimientosDeProducto(usuario, productoId, {
      tipo: sp.get("tipo") ?? undefined,
      desde: sp.get("desde") ?? undefined,
      hasta: sp.get("hasta") ?? undefined,
      page: sp.get("page") ?? undefined,
      pageSize: sp.get("pageSize") ?? undefined,
    });
    return jsonOk(resultado, 200);
  }
);

export const POST = withAuthApi<{ id: string }>(
  async ({ request, params, usuario }) => {
    const productoId = parsearIdNumerico(params.id);
    const body = await leerJsonBody(request);
    const movimiento = await registrarMovimientoManual(usuario, productoId, body);
    return jsonOk(movimiento, 201);
  }
);
