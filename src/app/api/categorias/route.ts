import { jsonOk, leerJsonBody, withAuthApi } from "@/lib/api-handler";
import { crearCategoria, listarCategorias } from "@/services/categorias.service";

export const GET = withAuthApi(async ({ usuario }) => {
  const categorias = await listarCategorias(usuario);
  return jsonOk(categorias, 200);
});

export const POST = withAuthApi(async ({ request, usuario }) => {
  const body = await leerJsonBody(request);
  const creada = await crearCategoria(usuario, body);
  return jsonOk(creada, 201);
});
