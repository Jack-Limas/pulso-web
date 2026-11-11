import { describe, expect, it } from "vitest";
import { dayMonthYearToIso, parseColombianAmount, parseUsAmount } from "../statements/amounts";
import { parseStatement } from "../statements/parsers";
import { StatementError } from "../statements/types";

const ANDINO = [
  "BANCO ANDINO",
  "Extracto de cuenta de ahorros",
  "Periodo: 01/10/2026 - 31/10/2026",
  "Saldo anterior: $ 1.000.000,00",
  "Fecha Descripción Valor Saldo",
  "01/10/2026 NOMINA EMPRESA SAS 3.500.000,00 4.500.000,00",
  "05/10/2026 COMPRA POS STARBUCKS -8.500,00 4.491.500,00",
  "Página 1 de 1",
  "Saldo final: $ 4.491.500,00",
];

const COOPERATIVA = [
  "COOPERATIVA SUR",
  "Desde 2026-10-01 hasta 2026-10-31",
  "Saldo inicial $ 1,000,000.00",
  "Fecha Concepto Tipo Monto",
  "2026-10-02 PAGO NETFLIX DB $ 44,900.00",
  "2026-10-15 TRANSFERENCIA RECIBIDA CR $ 250,000.50",
  "Saldo final $ 1,205,100.50",
];

describe("amounts", () => {
  it.each([
    ["1.234.567,89", 123_456_789n],
    ["-8.500,00", -850_000n],
    ["0,05", 5n],
  ])("reads the Colombian amount %s", (text, cents) => {
    expect(parseColombianAmount(text)).toBe(cents);
  });

  it("reads US amounts", () => {
    expect(parseUsAmount("$ 1,205,100.50")).toBe(120_510_050n);
  });

  it("rejects text that is not an amount", () => {
    expect(() => parseColombianAmount("abc")).toThrow();
  });

  it("converts day/month/year dates", () => {
    expect(dayMonthYearToIso("05/10/2026")).toBe("2026-10-05");
  });
});

describe("parseStatement", () => {
  it("reads a Banco Andino statement with signed values", () => {
    const statement = parseStatement(ANDINO);

    expect(statement).toMatchObject({
      bankCode: "banco-andino",
      periodStart: "2026-10-01",
      periodEnd: "2026-10-31",
      openingBalanceCents: 100_000_000n,
      closingBalanceCents: 449_150_000n,
    });
    expect(statement.transactions).toEqual([
      {
        occurredOn: "2026-10-01",
        description: "NOMINA EMPRESA SAS",
        type: "INCOME",
        amountCents: 350_000_000n,
      },
      {
        occurredOn: "2026-10-05",
        description: "COMPRA POS STARBUCKS",
        type: "EXPENSE",
        amountCents: 850_000n,
      },
    ]);
  });

  it("reads a Cooperativa Sur statement with credit and debit columns", () => {
    const statement = parseStatement(COOPERATIVA);

    expect(statement.bankCode).toBe("cooperativa-sur");
    expect(statement.transactions.map((t) => [t.type, t.amountCents])).toEqual([
      ["EXPENSE", 4_490_000n],
      ["INCOME", 25_000_050n],
    ]);
  });

  it.each([
    ["an unknown bank", ["BANCO DESCONOCIDO", "01/10/2026 X -1,00 1,00"], "UNSUPPORTED_BANK"],
    ["a statement without rows", ANDINO.filter((line) => !/^\d{2}\//.test(line)), "NO_TRANSACTIONS"],
    ["a statement without period", ANDINO.filter((line) => !line.startsWith("Periodo")), "MISSING_HEADER"],
  ])("rejects %s", (_case, lines, code) => {
    expect(() => parseStatement(lines)).toThrow(new StatementError(code as never));
  });
});
