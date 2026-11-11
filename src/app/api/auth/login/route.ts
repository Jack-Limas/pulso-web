import { NextResponse } from "next/server";
import { isApiError, login } from "@/lib/session/api-auth";
import { writeSession } from "@/lib/session/cookies";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  const result = await login(String(email ?? ""), String(password ?? ""));
  if (isApiError(result)) {
    return NextResponse.json({ code: result.code }, { status: 401 });
  }
  return writeSession(NextResponse.json({ ok: true }), result);
}
