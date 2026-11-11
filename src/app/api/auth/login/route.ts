import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n/config";
import { isApiError, login } from "@/lib/session/api-auth";
import { writeSession } from "@/lib/session/cookies";
import { readCredentials } from "@/lib/session/read-credentials";

// A sleeping backend can take close to a minute to answer its first request.
export const maxDuration = 60;

const SEE_OTHER = 303;

export async function POST(request: Request) {
  const { fields, isFormPost } = await readCredentials(request);
  const locale = isLocale(fields.locale ?? "") ? fields.locale : "es";
  const result = await login(fields.email ?? "", fields.password ?? "");
  if (isApiError(result)) {
    return isFormPost
      ? NextResponse.redirect(new URL(`/${locale}/login?error=${result.code}`, request.url), SEE_OTHER)
      : NextResponse.json({ code: result.code }, { status: 401 });
  }
  const response = isFormPost
    ? NextResponse.redirect(new URL(`/${locale}/app/dashboard`, request.url), SEE_OTHER)
    : NextResponse.json({ ok: true });
  return writeSession(response, result);
}
