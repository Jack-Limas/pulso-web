import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logout } from "@/lib/session/api-auth";
import { REFRESH_COOKIE } from "@/lib/session/constants";
import { clearSession } from "@/lib/session/cookies";

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await logout(refreshToken);
  }
  return clearSession(NextResponse.json({ ok: true }));
}
