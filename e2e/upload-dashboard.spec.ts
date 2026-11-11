import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { createAndinoAccount, register, waitForLive } from "./support";

const ANDINO_PDF = join(__dirname, "fixtures", "banco-andino.pdf");
const UNKNOWN_BANK_PDF = join(__dirname, "fixtures", "unknown-bank.pdf");

async function upload(page: Page, file: string) {
  await page.locator('input[type="file"]').setInputFiles(file);
}

test.describe("statement upload and dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await register(page);
    await createAndinoAccount(page);
    await waitForLive(page);
  });

  test("a pdf is read in a web worker, analyzed live and shown on the dashboard", async ({ page }) => {
    await upload(page, ANDINO_PDF);

    await expect(page.getByTestId("upload-status")).toHaveText("Proceso completado", { timeout: 60_000 });
    const metrics = page.getByTestId("upload-metrics");
    await expect(metrics).toContainText("Web Worker");
    await expect(metrics).toContainText("24");

    await page.getByRole("link", { name: "Ver mi panel" }).click();
    await expect(page.getByRole("heading", { name: "Gastos por categoría" })).toBeVisible();
    await expect(page.getByText("Ingresos").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recomendaciones" })).toBeVisible();
  });

  test("the main thread mode processes the same file", async ({ page }) => {
    await page.getByRole("radio", { name: "Hilo principal" }).click();

    await upload(page, ANDINO_PDF);

    await expect(page.getByTestId("upload-status")).toHaveText("Proceso completado", { timeout: 60_000 });
    await expect(page.getByTestId("upload-metrics")).toContainText("Hilo principal");
  });

  test("the same statement cannot be uploaded twice", async ({ page }) => {
    await upload(page, ANDINO_PDF);
    await expect(page.getByTestId("upload-status")).toHaveText("Proceso completado", { timeout: 60_000 });

    await upload(page, ANDINO_PDF);

    await expect(page.getByText("Este extracto ya fue subido.")).toBeVisible();
  });

  test("a statement from an unknown bank is rejected in the browser", async ({ page }) => {
    await upload(page, UNKNOWN_BANK_PDF);

    await expect(page.getByText("Aún no reconocemos el banco de este extracto.")).toBeVisible();
  });

  test("transactions can be searched and recategorized", async ({ page }) => {
    await upload(page, ANDINO_PDF);
    await expect(page.getByTestId("upload-status")).toHaveText("Proceso completado", { timeout: 60_000 });

    await page.goto("/es/app/transactions");
    await page.getByPlaceholder("Buscar descripción").fill("uber");
    const row = page.getByRole("row").filter({ hasText: "UBER TRIP" }).first();
    await expect(row).toBeVisible();
    await row.getByRole("combobox").selectOption({ label: "Entretenimiento" });

    await expect(page.getByText("Categoría guardada; Pulso la recordará para este comercio.")).toBeVisible();
  });
});
