import { leerJsonBody, noContent, withAuthApi } from "@/lib/api-handler";
import { cambiarContrasenaPropia } from "@/services/auth.service";

export const PUT = withAuthApi(async ({ request, usuario }) => {
  const body = await leerJsonBody(request);
  await cambiarContrasenaPropia(usuario, body);
  return noContent();
});
