import { jsonOk, leerJsonBody, withAuthApi } from "@/lib/api-handler";
import { crearUsuario, listarUsuarios } from "@/services/usuarios.service";

export const GET = withAuthApi(async ({ request, usuario }) => {
  const sp = request.nextUrl.searchParams;
  const resultado = await listarUsuarios(usuario, {
    q: sp.get("q") ?? undefined,
    activo: sp.get("activo") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
  return jsonOk(resultado, 200);
});

export const POST = withAuthApi(async ({ request, usuario }) => {
  const body = await leerJsonBody(request);
  const creado = await crearUsuario(usuario, body);
  return jsonOk(creado, 201);
});
