import "server-only";

export function serverEnv() {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL is not configured");
  }
  return { apiUrl: apiUrl.replace(/\/$/, "") };
}
