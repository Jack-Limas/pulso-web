import { dayMonthYearToIso, parseColombianAmount } from "../amounts";
import { type ParsedTransaction, StatementError, type StatementParser } from "../types";

const DATE = String.raw`\d{2}/\d{2}/\d{4}`;
const AMOUNT = String.raw`-?[\d.]+,\d{2}`;
const PERIOD = new RegExp(`Periodo:\\s*(${DATE})\\s*-\\s*(${DATE})`);
const OPENING = new RegExp(`Saldo anterior:\\s*\\$\\s*(${AMOUNT})`);
const CLOSING = new RegExp(`Saldo final:\\s*\\$\\s*(${AMOUNT})`);
const ROW = new RegExp(`^(${DATE})\\s+(.+?)\\s+(${AMOUNT})\\s+(${AMOUNT})$`);

function find(lines: string[], pattern: RegExp): RegExpExecArray {
  for (const line of lines) {
    const match = pattern.exec(line);
    if (match) {
      return match;
    }
  }
  throw new StatementError("MISSING_HEADER");
}

/** DD/MM/YYYY dates, Colombian amounts, and one signed value column. */
export const bancoAndinoParser: StatementParser = {
  bankCode: "banco-andino",

  matches: (lines) => lines.some((line) => line.includes("BANCO ANDINO")),

  parse(lines) {
    const [, start, end] = find(lines, PERIOD);
    const transactions: ParsedTransaction[] = [];
    for (const line of lines) {
      const row = ROW.exec(line.trim());
      if (!row) {
        continue;
      }
      const [, date, description, value] = row;
      const cents = parseColombianAmount(value!);
      transactions.push({
        occurredOn: dayMonthYearToIso(date!),
        description: description!,
        type: cents < 0n ? "EXPENSE" : "INCOME",
        amountCents: cents < 0n ? -cents : cents,
      });
    }
    return {
      bankCode: this.bankCode,
      periodStart: dayMonthYearToIso(start!),
      periodEnd: dayMonthYearToIso(end!),
      openingBalanceCents: parseColombianAmount(find(lines, OPENING)[1]!),
      closingBalanceCents: parseColombianAmount(find(lines, CLOSING)[1]!),
      transactions,
    };
  },
};
