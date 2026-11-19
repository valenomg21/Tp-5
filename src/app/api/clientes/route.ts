import { jsonOk, leerJsonBody, withAuthApi } from "@/lib/api-handler";
import { crearCliente, listarClientes } from "@/services/clientes.service";

export const GET = withAuthApi(async ({ request, usuario }) => {
  const sp = request.nextUrl.searchParams;
  const resultado = await listarClientes(usuario, {
    q: sp.get("q") ?? undefined,
    conDeuda: sp.get("conDeuda") ?? undefined,
    orden: sp.get("orden") ?? undefined,
    activo: sp.get("activo") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
  return jsonOk(resultado, 200);
});

export const POST = withAuthApi(async ({ request, usuario }) => {
  const body = await leerJsonBody(request);
  const creado = await crearCliente(usuario, body);
  return jsonOk(creado, 201);
});
