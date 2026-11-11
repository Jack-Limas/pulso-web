import { parseUsAmount } from "../amounts";
import { type ParsedTransaction, StatementError, type StatementParser } from "../types";

const DATE = String.raw`\d{4}-\d{2}-\d{2}`;
const AMOUNT = String.raw`[\d,]+\.\d{2}`;
const PERIOD = new RegExp(`Desde\\s+(${DATE})\\s+hasta\\s+(${DATE})`);
const OPENING = new RegExp(`Saldo inicial\\s*\\$\\s*(${AMOUNT})`);
const CLOSING = new RegExp(`Saldo final\\s*\\$\\s*(${AMOUNT})`);
const ROW = new RegExp(`^(${DATE})\\s+(.+?)\\s+(CR|DB)\\s+\\$\\s*(${AMOUNT})$`);

function find(lines: string[], pattern: RegExp): RegExpExecArray {
  for (const line of lines) {
    const match = pattern.exec(line);
    if (match) {
      return match;
    }
  }
  throw new StatementError("MISSING_HEADER");
}

/** ISO dates, US formatted amounts, and an explicit credit/debit column. */
export const cooperativaSurParser: StatementParser = {
  bankCode: "cooperativa-sur",

  matches: (lines) => lines.some((line) => line.includes("COOPERATIVA SUR")),

  parse(lines) {
    const [, start, end] = find(lines, PERIOD);
    const transactions: ParsedTransaction[] = [];
    for (const line of lines) {
      const row = ROW.exec(line.trim());
      if (!row) {
        continue;
      }
      const [, date, description, kind, amount] = row;
      transactions.push({
        occurredOn: date!,
        description: description!,
        type: kind === "CR" ? "INCOME" : "EXPENSE",
        amountCents: parseUsAmount(amount!),
      });
    }
    return {
      bankCode: this.bankCode,
      periodStart: start!,
      periodEnd: end!,
      openingBalanceCents: parseUsAmount(find(lines, OPENING)[1]!),
      closingBalanceCents: parseUsAmount(find(lines, CLOSING)[1]!),
      transactions,
    };
  },
};
