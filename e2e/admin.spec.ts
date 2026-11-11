import { expect, test } from "@playwright/test";
import { login, register, waitForLive } from "./support";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("administration", () => {
  test.skip(!adminEmail || !adminPassword, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

  test("regular users cannot open the admin console", async ({ page }) => {
    await register(page);

    await expect(page.getByRole("link", { name: "Administración" })).toHaveCount(0);
    const response = await page.goto("/es/app/admin");
    expect(response?.status()).toBe(404);
  });

  test("an announcement reaches another user's browser in real time", async ({ page, browser }) => {
    // A second, isolated browser plays the regular user who receives the broadcast.
    const userContext = await browser.newContext({ locale: "es-CO" });
    const userPage = await userContext.newPage();
    await register(userPage);
    await waitForLive(userPage);

    await login(page, adminEmail!, adminPassword!);
    await page.getByRole("link", { name: "Administración" }).click();
    await expect(page.getByText("Usuarios en línea")).toBeVisible();

    const title = `Mantenimiento ${Date.now()}`;
    await page.getByLabel("Título").fill(title);
    await page.getByLabel("Mensaje").fill("Pulso estará en mantenimiento a las 10 p. m.");
    await page.getByRole("button", { name: "Enviar en vivo" }).click();

    await expect(page.getByText("Anuncio enviado a todas las instancias.")).toBeVisible();
    await expect(userPage.getByText(`Anuncio: ${title}`)).toBeVisible();
    await userContext.close();
  });
});
