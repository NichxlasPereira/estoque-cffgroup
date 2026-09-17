import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    if (user === expectedUser && password === expectedPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Estoque CFFGROUP"' },
  });
}

export const config = {
  // Public static assets are excluded so Next's image optimizer (and direct
  // requests) can fetch them without hitting the auth wall — see warehouse.jpg,
  // whose /_next/image request otherwise 400s because that internal fetch
  // carries no Basic Auth credentials.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|warehouse.jpg).*)"],
};
