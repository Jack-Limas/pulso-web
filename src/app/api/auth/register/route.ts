import { NextResponse } from "next/server";
import { isApiError, register } from "@/lib/session/api-auth";
import { writeSession } from "@/lib/session/cookies";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const result = await register({
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
    fullName: String(body.fullName ?? ""),
    locale: body.locale === "en" ? "en" : "es",
  });
  if (isApiError(result)) {
    return NextResponse.json({ code: result.code }, { status: 400 });
  }
  return writeSession(NextResponse.json({ ok: true }), result);
}
