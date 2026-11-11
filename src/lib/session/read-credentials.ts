import "server-only";

/**
 * Accepts JSON from the hydrated form and a regular form post from a page whose JavaScript
 * has not loaded yet, so credentials always travel in a POST body and never in the URL.
 */
export async function readCredentials(
  request: Request,
): Promise<{ fields: Record<string, string>; isFormPost: boolean }> {
  const isFormPost = !request.headers.get("content-type")?.includes("application/json");
  const entries = isFormPost
    ? [...(await request.formData()).entries()]
    : Object.entries((await request.json()) as Record<string, unknown>);
  return {
    fields: Object.fromEntries(entries.map(([key, value]) => [key, String(value ?? "")])),
    isFormPost,
  };
}
