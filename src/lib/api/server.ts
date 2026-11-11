import "server-only";
import { createClient, type Interceptor } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminService } from "@/gen/pulso/v1/admin_service_pb";
import { AuthService } from "@/gen/pulso/v1/auth_service_pb";
import { BankAccountService } from "@/gen/pulso/v1/bank_account_service_pb";
import { InsightsService } from "@/gen/pulso/v1/insights_service_pb";
import { StatementService } from "@/gen/pulso/v1/statement_service_pb";
import { serverEnv } from "@/lib/server-env";
import { ACCESS_COOKIE } from "@/lib/session/constants";

const CATALOG_REVALIDATE_SECONDS = 3600;

function transport(accessToken?: string) {
  const authorize: Interceptor = (next) => (request) => {
    if (accessToken) {
      request.header.set("authorization", `Bearer ${accessToken}`);
    }
    return next(request);
  };
  return createConnectTransport({
    baseUrl: serverEnv().apiUrl,
    interceptors: [authorize],
    // Private data is never cached; public catalog data may be reused between regenerations.
    fetch: (input, init) =>
      fetch(
        input,
        accessToken
          ? { ...init, cache: "no-store" }
          : { ...init, next: { revalidate: CATALOG_REVALIDATE_SECONDS } },
      ),
  });
}

/** For public data such as the bank catalog; safe to use while prerendering. */
export function publicClients() {
  return { bankAccounts: createClient(BankAccountService, transport()) };
}

/** Reads the session cookie, so any page using it renders on every request (SSR). */
export async function privateClients(locale: string) {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    redirect(`/${locale}/login`);
  }
  const t = transport(accessToken);
  return {
    auth: createClient(AuthService, t),
    bankAccounts: createClient(BankAccountService, t),
    statements: createClient(StatementService, t),
    insights: createClient(InsightsService, t),
    admin: createClient(AdminService, t),
  };
}
