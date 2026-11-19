import {
  jsonOk,
  leerJsonBody,
  withPublicApi,
} from "@/lib/api-handler";
import { aplicarCookieSesionEnRespuesta } from "@/lib/session";
import { iniciarSesion } from "@/services/auth.service";

export const POST = withPublicApi(async ({ request }) => {
  const body = await leerJsonBody(request);
  const { usuario, token } = await iniciarSesion(body);
  const response = jsonOk(usuario, 200);
  return aplicarCookieSesionEnRespuesta(response, token);
});
