/**
 * Creates the demo users and uploads their synthetic statements through the public API,
 * reusing the same parser the browser runs.
 *
 *   API_URL=https://... DEMO_PASSWORD=... npx tsx scripts/seed-demo.ts ../pulso-ai/output
 *
 * Node has no Web Worker, so these uploads are recorded as main thread processing.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { extractLines } from "../src/lib/statements/extract-lines";
import { parseStatement } from "../src/lib/statements/parsers";

interface DemoUser {
  slug: string;
  fullName: string;
  bankCode: string;
  alias: string;
  months: string[];
}

const RECENT = ["2026-08", "2026-09", "2026-10"];
// October is left out on purpose: those PDFs are for uploading by hand in the browser.
const LONG_HISTORY = ["2026-06", "2026-07", "2026-08", "2026-09"];

const USERS: DemoUser[] = [
  { slug: "estudiante", fullName: "Valentina Rojas", bankCode: "banco-andino", alias: "Ahorros", months: RECENT },
  { slug: "freelancer", fullName: "Andrés Gómez", bankCode: "cooperativa-sur", alias: "Cuenta cooperativa", months: RECENT },
  { slug: "pyme", fullName: "Panadería La Espiga", bankCode: "banco-andino", alias: "Cuenta empresarial", months: RECENT },
  { slug: "familia", fullName: "Carolina Mejía", bankCode: "cooperativa-sur", alias: "Ahorro familiar", months: RECENT },
  { slug: "conductor", fullName: "Jhon Fredy Muñoz", bankCode: "banco-andino", alias: "Cuenta conductor", months: LONG_HISTORY },
  { slug: "docente", fullName: "Laura Castillo", bankCode: "cooperativa-sur", alias: "Nómina", months: LONG_HISTORY },
  { slug: "medica", fullName: "Sofía Arango", bankCode: "banco-andino", alias: "Cuenta principal", months: LONG_HISTORY },
  { slug: "emprendedora", fullName: "Mariana Torres", bankCode: "cooperativa-sur", alias: "Tienda online", months: LONG_HISTORY },
];
const EMAIL_DOMAIN = "pulso.demo";

const apiUrl = process.env.API_URL?.replace(/\/$/, "");
const password = process.env.DEMO_PASSWORD;
const pdfDir = process.argv[2];
if (!apiUrl || !password || !pdfDir) {
  throw new Error("Usage: API_URL=... DEMO_PASSWORD=... tsx scripts/seed-demo.ts <pdf-dir>");
}

async function call<T>(procedure: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${apiUrl}/pulso.v1.${procedure}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body, (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
  });
  const json = (await response.json().catch(() => ({}))) as T & { code?: string };
  if (!response.ok) {
    throw Object.assign(new Error(`${procedure}: ${json.code}`), { code: json.code });
  }
  return json;
}

async function signIn(user: DemoUser): Promise<string> {
  const email = `${user.slug}@${EMAIL_DOMAIN}`;
  try {
    const { accessToken } = await call<{ accessToken: string }>("AuthService/Register", {
      email,
      password,
      fullName: user.fullName,
      locale: "es",
    });
    return accessToken;
  } catch (error) {
    if ((error as { code?: string }).code !== "already_exists") {
      throw error;
    }
    const { accessToken } = await call<{ accessToken: string }>("AuthService/Login", { email, password });
    return accessToken;
  }
}

async function accountFor(user: DemoUser, token: string): Promise<string> {
  type Account = { id: string; bank: { code: string } };
  const { accounts = [] } = await call<{ accounts?: Account[] }>("BankAccountService/ListBankAccounts", {}, token);
  const existing = accounts.find((account) => account.bank.code === user.bankCode);
  if (existing) {
    return existing.id;
  }
  const { banks } = await call<{ banks: { id: string; code: string }[] }>("BankAccountService/ListSupportedBanks", {});
  const bank = banks.find((candidate) => candidate.code === user.bankCode);
  if (!bank) {
    throw new Error(`Bank ${user.bankCode} is not available`);
  }
  const { account } = await call<{ account: Account }>(
    "BankAccountService/CreateBankAccount",
    { supportedBankId: bank.id, alias: user.alias, type: "ACCOUNT_TYPE_SAVINGS" },
    token,
  );
  return account.id;
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex");
}

async function uploadedPeriods(token: string, accountId: string): Promise<Set<string>> {
  const { statements = [] } = await call<{ statements?: { periodStart: string }[] }>(
    "StatementService/ListStatements",
    { bankAccountId: accountId, page: { pageSize: 100 } },
    token,
  );
  return new Set(statements.map((statement) => statement.periodStart.slice(0, 7)));
}

async function upload(user: DemoUser, token: string, accountId: string, month: string) {
  const fileName = `${user.slug}-${month}.pdf`;
  const file = await readFile(join(pdfDir!, fileName));
  const bytes = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
  const started = performance.now();
  const statement = parseStatement(await extractLines(bytes.slice(0)));
  const processingMs = Math.round(performance.now() - started);
  try {
    await call(
      "StatementService/UploadStatement",
      {
        bankAccountId: accountId,
        fileName,
        fileHash: await sha256Hex(bytes),
        periodStart: statement.periodStart,
        periodEnd: statement.periodEnd,
        openingBalanceCents: statement.openingBalanceCents,
        closingBalanceCents: statement.closingBalanceCents,
        transactions: statement.transactions.map((transaction) => ({
          ...transaction,
          type: transaction.type === "INCOME" ? "TRANSACTION_TYPE_INCOME" : "TRANSACTION_TYPE_EXPENSE",
        })),
        metrics: { mode: "PROCESSING_MODE_MAIN_THREAD", uploadMs: 0, processingMs },
      },
      token,
    );
    console.log(`  ${fileName}: ${statement.transactions.length} transactions uploaded`);
  } catch (error) {
    if ((error as { code?: string }).code !== "already_exists") {
      throw error;
    }
    console.log(`  ${fileName}: already uploaded`);
  }
}

async function main(): Promise<void> {
  for (const user of USERS) {
    console.log(`${user.slug}@${EMAIL_DOMAIN}`);
    const token = await signIn(user);
    const accountId = await accountFor(user, token);
    // A period already there is skipped, even if its PDF was regenerated with other bytes.
    const done = await uploadedPeriods(token, accountId);
    // In order, so each month is analyzed with the previous ones as its baseline.
    for (const month of user.months.filter((candidate) => !done.has(candidate))) {
      await upload(user, token, accountId, month);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
