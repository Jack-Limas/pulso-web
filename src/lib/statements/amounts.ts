/** "1.234.567,89" (Colombian format) to cents. */
export function parseColombianAmount(text: string): bigint {
  return toCents(text.replace(/[$\s.]/g, "").replace(",", "."));
}

/** "1,234,567.89" (US format) to cents. */
export function parseUsAmount(text: string): bigint {
  return toCents(text.replace(/[$\s,]/g, ""));
}

// Strings, not floats: 0.1 + 0.2 must never leak into money.
function toCents(normalized: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) {
    throw new Error(`Invalid amount: ${normalized}`);
  }
  const [, sign, units, decimals = ""] = match;
  const cents = BigInt(units!) * 100n + BigInt(decimals.padEnd(2, "0"));
  return sign ? -cents : cents;
}

/** "05/10/2026" to "2026-10-05". */
export function dayMonthYearToIso(text: string): string {
  const [day, month, year] = text.split("/");
  return `${year}-${month}-${day}`;
}
