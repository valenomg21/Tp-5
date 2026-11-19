export const SESSION_COOKIE_NAME = "sgc_sesion";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface PayloadToken {
  uid: number;
  exp: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function obtenerSecreto(): string {
  const secreto = process.env.SESSION_SECRET?.trim();
  if (!secreto || secreto.length < 16) {
    throw new Error(
      "SESSION_SECRET debe estar definido y tener al menos 16 caracteres."
    );
  }
  return secreto;
}

function bytesABase64Url(bytes: Uint8Array): string {
  let binario = "";
  for (let i = 0; i < bytes.length; i++) {
    binario += String.fromCharCode(bytes[i]);
  }
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlABytes(texto: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(texto)) {
    return null;
  }
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4)) % 4;
  const binario = atob(base64 + "=".repeat(padding));
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

async function importarClaveHmac(uso: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(obtenerSecreto()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [uso]
  );
}

/**
 * Firma un token de sesión con HMAC-SHA256 usando Web Crypto API.
 */
export async function firmarTokenSesion(usuarioId: number): Promise<string> {
  const payload: PayloadToken = {
    uid: usuarioId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const datosCodificados = bytesABase64Url(
    textEncoder.encode(JSON.stringify(payload))
  );
  const clave = await importarClaveHmac("sign");
  const firma = await crypto.subtle.sign(
    "HMAC",
    clave,
    textEncoder.encode(datosCodificados)
  );

  return `${datosCodificados}.${bytesABase64Url(new Uint8Array(firma))}`;
}

/**
 * Verifica firma HMAC y expiración del token. Devuelve null si es inválido o vencido.
 */
export async function verificarTokenSesion(
  token: string | null | undefined
): Promise<{ usuarioId: number } | null> {
  if (!token) return null;

  const partes = token.split(".");
  if (partes.length !== 2) return null;

  const [datosCodificados, firmaCodificada] = partes;
  if (!datosCodificados || !firmaCodificada) return null;

  const firmaBytes = base64UrlABytes(firmaCodificada);
  const payloadBytes = base64UrlABytes(datosCodificados);
  if (!firmaBytes || !payloadBytes) return null;

  try {
    const clave = await importarClaveHmac("verify");
    const firmaBuffer = new Uint8Array(firmaBytes).buffer;
    const datosBuffer = new Uint8Array(textEncoder.encode(datosCodificados)).buffer;
    const firmaValida = await crypto.subtle.verify(
      "HMAC",
      clave,
      firmaBuffer,
      datosBuffer
    );
    if (!firmaValida) return null;

    const parsed = JSON.parse(textDecoder.decode(payloadBytes)) as Partial<PayloadToken>;
    if (
      typeof parsed.uid !== "number" ||
      !Number.isInteger(parsed.uid) ||
      parsed.uid <= 0 ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { usuarioId: parsed.uid };
  } catch {
    return null;
  }
}
