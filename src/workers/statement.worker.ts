import { processStatement } from "@/lib/statements/pipeline";
import { StatementError } from "@/lib/statements/types";
import type { WorkerRequest, WorkerResponse } from "./statement.protocol";

const post = (message: WorkerResponse) => self.postMessage(message);

self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    const result = await processStatement(data.file, {
      onStage: (stage) => post({ type: "stage", stage }),
      onPage: (page, total) => post({ type: "page", page, total }),
    });
    post({ type: "done", result });
  } catch (error) {
    post({
      type: "error",
      code: error instanceof StatementError ? error.code : "UNREADABLE",
    });
  }
};
