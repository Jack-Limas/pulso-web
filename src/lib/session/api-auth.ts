import "server-only";
import { serverEnv } from "@/lib/server-env";
import { ACCESS_EXPIRY_MARGIN_SECONDS } from "./constants";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  accessMaxAge: number;
}

export interface ApiError {
  code: string;
  message: string;
}

const API_REFRESH_COOKIE = /pulso_refresh=([^;]+)/;

/** Reads the expiry the API signed into the token, without trusting anything else in it. */
function secondsUntilExpiry(accessToken: string): number {
  const payload = accessToken.split(".")[1] ?? "";
  const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
  return Math.max(0, exp - Math.floor(Date.now() / 1000) - ACCESS_EXPIRY_MARGIN_SECONDS);
}

async function callAuth(
  procedure: string,
  body: object,
  refreshToken?: string,
): Promise<SessionTokens | ApiError> {
  const response = await fetch(`${serverEnv().apiUrl}/pulso.v1.AuthService/${procedure}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(refreshToken ? { Cookie: `pulso_refresh=${refreshToken}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  // A sleeping or restarting API answers with an HTML error page, not JSON.
  const json = (await response.json().catch(() => ({}))) as { accessToken?: string } & Partial<ApiError>;
  if (!response.ok || !json.accessToken) {
    return { code: json.code ?? "unavailable", message: json.message ?? "" };
  }
  const refresh = API_REFRESH_COOKIE.exec(response.headers.get("set-cookie") ?? "")?.[1];
  if (!refresh) {
    return { code: "internal", message: "Missing session cookie" };
  }
  return {
    accessToken: json.accessToken,
    refreshToken: refresh,
    accessMaxAge: secondsUntilExpiry(json.accessToken),
  };
}

export function isApiError(result: SessionTokens | ApiError): result is ApiError {
  return "code" in result;
}

export const login = (email: string, password: string) =>
  callAuth("Login", { email, password });

export const register = (input: {
  email: string;
  password: string;
  fullName: string;
  locale: string;
}) => callAuth("Register", input);

export const refresh = (refreshToken: string) => callAuth("RefreshSession", {}, refreshToken);

export async function logout(refreshToken: string): Promise<void> {
  await fetch(`${serverEnv().apiUrl}/pulso.v1.AuthService/Logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `pulso_refresh=${refreshToken}` },
    body: "{}",
    cache: "no-store",
  }).catch(() => undefined);
}
