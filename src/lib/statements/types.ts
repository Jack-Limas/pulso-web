export type EntryType = "INCOME" | "EXPENSE";

export interface ParsedTransaction {
  occurredOn: string;
  description: string;
  type: EntryType;
  amountCents: bigint;
}

export interface ParsedStatement {
  bankCode: string;
  periodStart: string;
  periodEnd: string;
  openingBalanceCents: bigint;
  closingBalanceCents: bigint;
  transactions: ParsedTransaction[];
}

/** Each bank prints its statement differently, so each one gets its own parser. */
export interface StatementParser {
  bankCode: string;
  matches(lines: string[]): boolean;
  parse(lines: string[]): ParsedStatement;
}

export type StatementErrorCode =
  | "NOT_A_PDF"
  | "TOO_LARGE"
  | "UNREADABLE"
  | "UNSUPPORTED_BANK"
  | "MISSING_HEADER"
  | "NO_TRANSACTIONS";

export class StatementError extends Error {
  constructor(readonly code: StatementErrorCode) {
    super(code);
    this.name = "StatementError";
  }
}

export type ProcessingStage = "reading" | "extracting" | "parsing" | "hashing";
