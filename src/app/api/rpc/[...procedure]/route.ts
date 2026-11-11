import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/server-env";
import { isApiError, refresh } from "@/lib/session/api-auth";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session/constants";
import { clearSession, writeSession } from "@/lib/session/cookies";

// Only what the browser legitimately needs; sign in and out have their own routes.
const ALLOWED = /^pulso\.v1\.(BankAccountService|StatementService|InsightsService|AdminService)\/\w+$|^pulso\.v1\.AuthService\/GetCurrentUser$/;
const FORWARDED_HEADERS = ["content-type", "connect-protocol-version", "connect-timeout-ms"];

async function forward(procedure: string, request: Request, body: ArrayBuffer, token?: string) {
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  return fetch(`${serverEnv().apiUrl}/${procedure}`, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });
}

/** Backend for Frontend: the browser talks to this origin and never holds the API tokens. */
export async function POST(
  request: Request,
  context: { params: Promise<{ procedure: string[] }> },
) {
  const procedure = (await context.params).procedure.join("/");
  if (!ALLOWED.test(procedure)) {
    return NextResponse.json({ code: "not_found", message: "Unknown procedure" }, { status: 404 });
  }
  const jar = await cookies();
  const body = await request.arrayBuffer();
  let session = undefined;
  let upstream = await forward(procedure, request, body, jar.get(ACCESS_COOKIE)?.value);

  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (upstream.status === 401 && refreshToken) {
    const renewed = await refresh(refreshToken);
    if (isApiError(renewed)) {
      return clearSession(new NextResponse(upstream.body, upstream));
    }
    session = renewed;
    upstream = await forward(procedure, request, body, renewed.accessToken);
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/proto" },
  });
  return session ? writeSession(response, session) : response;
}
