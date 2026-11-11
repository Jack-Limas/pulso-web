import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";
import { StatementError } from "./types";

// pdf.js normally spawns its own worker. Handing it the worker code makes it parse on the
// current thread, so the Web Worker vs main thread comparison measures the same work.
(globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;

const SAME_LINE_TOLERANCE = 2;

interface PositionedText {
  text: string;
  x: number;
  y: number;
}

function groupIntoLines(items: PositionedText[]): string[] {
  const rows = new Map<number, PositionedText[]>();
  for (const item of items) {
    const key = Math.round(item.y / SAME_LINE_TOLERANCE);
    rows.set(key, [...(rows.get(key) ?? []), item]);
  }
  // PDF coordinates grow upwards, so the highest y is the first line on the page.
  return [...rows.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, row]) =>
      row
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text.trim())
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean);
}

export async function extractLines(
  data: ArrayBuffer,
  onPage?: (page: number, total: number) => void,
): Promise<string[]> {
  const task = pdfjs.getDocument({
    data: new Uint8Array(data),
    disableFontFace: true,
  });
  let document: pdfjs.PDFDocumentProxy;
  try {
    document = await task.promise;
  } catch {
    throw new StatementError("UNREADABLE");
  }
  const lines: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.flatMap((item) =>
      "str" in item ? [{ text: item.str, x: item.transform[4], y: item.transform[5] }] : [],
    );
    lines.push(...groupIntoLines(items));
    onPage?.(pageNumber, document.numPages);
  }
  await task.destroy();
  return lines;
}
