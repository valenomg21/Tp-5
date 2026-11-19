import { jsonOk, leerJsonBody, withAuthApi } from "@/lib/api-handler";
import { emitirFactura, listarFacturas } from "@/services/facturas.service";

export const GET = withAuthApi(async ({ request, usuario }) => {
  const sp = request.nextUrl.searchParams;
  const resultado = await listarFacturas(usuario, {
    q: sp.get("q") ?? undefined,
    desde: sp.get("desde") ?? undefined,
    hasta: sp.get("hasta") ?? undefined,
    clienteId: sp.get("clienteId") ?? undefined,
    vendedorId: sp.get("vendedorId") ?? undefined,
    forma: sp.get("forma") ?? undefined,
    estado: sp.get("estado") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
  return jsonOk(resultado, 200);
});

export const POST = withAuthApi(async ({ request, usuario }) => {
  const body = await leerJsonBody(request);
  const factura = await emitirFactura(usuario, body);
  return jsonOk(factura, 201);
});
