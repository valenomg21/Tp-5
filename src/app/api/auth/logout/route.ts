import { noContent, withAuthApi } from "@/lib/api-handler";
import { borrarCookieSesionEnRespuesta } from "@/lib/session";

export const POST = withAuthApi(async () => {
  const response = noContent();
  return borrarCookieSesionEnRespuesta(response);
});
