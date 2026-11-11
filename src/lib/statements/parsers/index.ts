import { type ParsedStatement, StatementError, type StatementParser } from "../types";
import { bancoAndinoParser } from "./banco-andino";
import { cooperativaSurParser } from "./cooperativa-sur";

// Supporting a new bank means adding one parser here; nothing else changes.
const PARSERS: StatementParser[] = [bancoAndinoParser, cooperativaSurParser];

export function parseStatement(lines: string[]): ParsedStatement {
  const parser = PARSERS.find((candidate) => candidate.matches(lines));
  if (!parser) {
    throw new StatementError("UNSUPPORTED_BANK");
  }
  const statement = parser.parse(lines);
  if (statement.transactions.length === 0) {
    throw new StatementError("NO_TRANSACTIONS");
  }
  return statement;
}
