import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verificarTokenSesion,
} from "@/lib/session-token";

// Barrera 1 (Sección 10.5): redirige al login si falta o es inválida la cookie firmada.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sesion = await verificarTokenSesion(token);

  if (!sesion) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
