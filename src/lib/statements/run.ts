import type { WorkerRequest, WorkerResponse } from "@/workers/statement.protocol";
import type { ProcessedStatement, ProgressHandlers } from "./pipeline";
import { StatementError } from "./types";

export type ProcessingMode = "worker" | "main";

function runInWorker(file: ArrayBuffer, progress: ProgressHandlers): Promise<ProcessedStatement> {
  const worker = new Worker(new URL("../../workers/statement.worker.ts", import.meta.url), {
    type: "module",
  });
  return new Promise((resolve, reject) => {
    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      switch (data.type) {
        case "stage":
          progress.onStage(data.stage);
          break;
        case "page":
          progress.onPage(data.page, data.total);
          break;
        case "done":
          worker.terminate();
          resolve(data.result);
          break;
        case "error":
          worker.terminate();
          reject(new StatementError(data.code));
      }
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new StatementError("UNREADABLE"));
    };
    // Transferring the buffer moves it to the worker instead of copying it.
    worker.postMessage({ file } satisfies WorkerRequest, [file]);
  });
}

async function runOnMainThread(
  file: ArrayBuffer,
  progress: ProgressHandlers,
): Promise<ProcessedStatement> {
  const { processStatement } = await import("./pipeline");
  return processStatement(file, progress);
}

export function processInBrowser(
  mode: ProcessingMode,
  file: ArrayBuffer,
  progress: ProgressHandlers,
): Promise<ProcessedStatement> {
  return mode === "worker" ? runInWorker(file, progress) : runOnMainThread(file, progress);
}
