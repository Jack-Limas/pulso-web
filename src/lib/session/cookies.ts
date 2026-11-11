import "server-only";
import type { NextResponse } from "next/server";
import type { SessionTokens } from "./api-auth";
import {
  ACCESS_COOKIE,
  cookieOptions,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE_SECONDS,
} from "./constants";

export function writeSession(response: NextResponse, tokens: SessionTokens): NextResponse {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.accessMaxAge));
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_MAX_AGE_SECONDS));
  return response;
}

export function clearSession(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
  response.cookies.set(REFRESH_COOKIE, "", cookieOptions(0));
  return response;
}
