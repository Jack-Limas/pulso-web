import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { createAndinoAccount, register, waitForLive } from "./support";

const NOVEMBER_SAMPLE = join(__dirname, "..", "public", "samples", "extracto-banco-andino.pdf");

test.describe("alert center", () => {
  test("the downloadable sample is a mid-november statement", async ({ request }) => {
    const response = await request.get("/samples/extracto-banco-andino.pdf");

    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  });

  test("an unusual purchase becomes a high alert and the menu counts it until seen", async ({ page }) => {
    await register(page);
    await createAndinoAccount(page);
    await waitForLive(page);

    await page.locator('input[type="file"]').setInputFiles(NOVEMBER_SAMPLE);
    await expect(page.getByTestId("upload-status")).toHaveText("Proceso completado", { timeout: 60_000 });
    await expect(page.getByTestId("alerts-badge")).toBeVisible();

    await page.getByRole("link", { name: /Alertas/ }).click();

    await expect(page.getByRole("heading", { name: "Centro de alertas" })).toBeVisible();
    const consola = page.getByTestId("alert-item").filter({ hasText: "AMAZON COMPRA CONSOLA" });
    await expect(consola).toContainText("Alta");
    await expect(consola).toContainText("Noviembre de 2026");
    await expect(page.getByTestId("alerts-high")).not.toHaveText("0");
    await expect(page.getByTestId("alerts-badge")).toHaveCount(0);
  });

  test("filters by priority", async ({ page }) => {
    await register(page);
    await createAndinoAccount(page);
    await page.locator('input[type="file"]').setInputFiles(NOVEMBER_SAMPLE);
    await expect(page.getByTestId("upload-status")).toHaveText("Proceso completado", { timeout: 60_000 });
    await page.goto("/es/app/alerts");

    await page.getByRole("button", { name: /^Baja/ }).click();

    const items = page.getByTestId("alert-item");
    await expect(items.first()).toBeVisible();
    for (const text of await items.allInnerTexts()) {
      expect(text).toContain("Baja");
    }
  });
});
