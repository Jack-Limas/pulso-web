import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isApiError, refresh } from "@/lib/session/api-auth";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session/constants";
import { writeSession } from "@/lib/session/cookies";

// A sleeping backend can take close to a minute to answer its first request.
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };

// The WebSocket goes straight to the API, so the browser needs the short-lived token for its
// first message. The long-lived refresh token never leaves the httpOnly cookie.
export async function GET() {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    return NextResponse.json({ token: accessToken }, { headers: NO_STORE });
  }
  // A page left open past the token lifetime must still be able to reconnect its socket.
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  const session = refreshToken ? await refresh(refreshToken) : undefined;
  if (!session || isApiError(session)) {
    return NextResponse.json({ code: "unauthenticated" }, { status: 401, headers: NO_STORE });
  }
  return writeSession(NextResponse.json({ token: session.accessToken }, { headers: NO_STORE }), session);
}
