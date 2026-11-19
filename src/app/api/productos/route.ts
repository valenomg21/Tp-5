import { jsonOk, leerJsonBody, withAuthApi } from "@/lib/api-handler";
import { crearProducto, listarProductos } from "@/services/productos.service";

export const GET = withAuthApi(async ({ request, usuario }) => {
  const sp = request.nextUrl.searchParams;
  const resultado = await listarProductos(usuario, {
    q: sp.get("q") ?? undefined,
    categoriaId: sp.get("categoriaId") ?? undefined,
    bajoMinimo: sp.get("bajoMinimo") ?? undefined,
    activo: sp.get("activo") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
  return jsonOk(resultado, 200);
});

export const POST = withAuthApi(async ({ request, usuario }) => {
  const body = await leerJsonBody(request);
  const creado = await crearProducto(usuario, body);
  return jsonOk(creado, 201);
});
