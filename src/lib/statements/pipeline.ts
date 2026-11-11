import { extractLines } from "./extract-lines";
import { parseStatement } from "./parsers";
import { type ParsedStatement, type ProcessingStage, StatementError } from "./types";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const PDF_SIGNATURE = "%PDF-";

export interface ProcessedStatement {
  statement: ParsedStatement;
  fileHash: string;
  processingMs: number;
}

export interface ProgressHandlers {
  onStage(stage: ProcessingStage): void;
  onPage(page: number, total: number): void;
}

function assertPdf(data: ArrayBuffer): void {
  if (data.byteLength > MAX_FILE_BYTES) {
    throw new StatementError("TOO_LARGE");
  }
  const header = new TextDecoder().decode(data.slice(0, PDF_SIGNATURE.length));
  if (header !== PDF_SIGNATURE) {
    throw new StatementError("NOT_A_PDF");
  }
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Runs unchanged on the main thread or inside the Web Worker. */
export async function processStatement(
  data: ArrayBuffer,
  progress: ProgressHandlers,
): Promise<ProcessedStatement> {
  const started = performance.now();
  progress.onStage("reading");
  assertPdf(data);

  progress.onStage("hashing");
  // Hash first: pdf.js may detach the buffer it receives.
  const fileHash = await sha256Hex(data);

  progress.onStage("extracting");
  const lines = await extractLines(data.slice(0), progress.onPage);

  progress.onStage("parsing");
  const statement = parseStatement(lines);

  return { statement, fileHash, processingMs: Math.round(performance.now() - started) };
}
