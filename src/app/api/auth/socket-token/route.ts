import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/session/constants";

// The WebSocket goes straight to the API, so the browser needs the short-lived token for its
// first message. The long-lived refresh token never leaves the httpOnly cookie.
export async function GET() {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({ token: accessToken }, { headers: { "Cache-Control": "no-store" } });
}
