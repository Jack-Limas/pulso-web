export const ACCESS_COOKIE = "pulso_access";
export const REFRESH_COOKIE = "pulso_refresh";
export const REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
// Expire the cookie a little before the token, so the server never forwards a dying token.
export const ACCESS_EXPIRY_MARGIN_SECONDS = 30;

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
