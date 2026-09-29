import { NextRequest, NextResponse } from "next/server";
import { FREQ_COOKIE, frequenciaPassword, isFrequenciaPath, isValidSessionToken } from "@/lib/frequenciaAuth";

export function proxy(request: NextRequest) {
  const basicAuthFailure = checkBasicAuth(request);
  if (basicAuthFailure) return basicAuthFailure;
  return checkFrequencia(request) ?? NextResponse.next();
}

/** Segunda barreira: o módulo de frequência exige a senha própria. */
function checkFrequencia(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  if (!isFrequenciaPath(pathname)) return null;

  const password = frequenciaPassword();
  if (password && isValidSessionToken(request.cookies.get(FREQ_COOKIE)?.value, password)) return null;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Acesso à frequência bloqueado. Entre com a senha." }, { status: 401 });
  }
  const login = new URL("/frequencia/entrar", request.url);
  login.searchParams.set("voltar", pathname + search);
  return NextResponse.redirect(login);
}

function checkBasicAuth(request: NextRequest): NextResponse | null {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return null;
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    if (user === expectedUser && password === expectedPassword) {
      return null;
    }
  }

  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Estoque CFFGROUP"' },
  });
}

export const config = {
  // Public static assets are excluded so Next's image optimizer (and direct
  // requests) can fetch them without hitting the auth wall — see hero-office.jpg,
  // whose /_next/image request otherwise 400s because that internal fetch
  // carries no Basic Auth credentials.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|hero-office.jpg).*)"],
};
