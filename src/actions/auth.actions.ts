"use server";

import { runAuthAction, runPublicAction } from "@/lib/action-handler";
import {
  borrarCookieSesion,
  establecerCookieSesion,
  type UsuarioSesion,
} from "@/lib/session";
import {
  cambiarContrasenaPropia,
  iniciarSesion,
} from "@/services/auth.service";

export async function loginAction(datosSinValidar: unknown) {
  return runPublicAction<UsuarioSesion>(async () => {
    const { usuario, token } = await iniciarSesion(datosSinValidar);
    await establecerCookieSesion(token);
    return usuario;
  });
}

export async function logoutAction() {
  return runPublicAction(async () => {
    await borrarCookieSesion();
    return { ok: true };
  });
}

export async function cambiarPasswordAction(datosSinValidar: unknown) {
  return runAuthAction(async (usuario) => {
    await cambiarContrasenaPropia(usuario, datosSinValidar);
    return { ok: true };
  });
}
