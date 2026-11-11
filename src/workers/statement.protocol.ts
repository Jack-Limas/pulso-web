import type { ProcessedStatement } from "@/lib/statements/pipeline";
import type { ProcessingStage, StatementErrorCode } from "@/lib/statements/types";

export interface WorkerRequest {
  file: ArrayBuffer;
}

export type WorkerResponse =
  | { type: "stage"; stage: ProcessingStage }
  | { type: "page"; page: number; total: number }
  | { type: "done"; result: ProcessedStatement }
  | { type: "error"; code: StatementErrorCode };
