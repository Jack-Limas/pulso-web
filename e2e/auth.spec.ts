import { expect, test } from "@playwright/test";
import { login, PASSWORD, register, uniqueEmail } from "./support";

test.describe("authentication", () => {
  test("a new user lands on an empty dashboard", async ({ page }) => {
    await register(page);

    await expect(page.getByRole("heading", { name: "Aún no hay análisis" })).toBeVisible();
  });

  test("private pages send visitors to the login", async ({ page }) => {
    await page.goto("/es/app/dashboard");

    await expect(page).toHaveURL(/\/es\/login\?next=%2Fes%2Fapp%2Fdashboard$/);
  });

  test("a wrong password shows an error and keeps credentials out of the url", async ({ page }) => {
    const email = await register(page);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/es\/login/);

    await page.getByLabel("Correo electrónico").fill(email);
    await page.getByLabel("Contraseña").fill("not-the-password");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "incorrectos" })).toHaveText(
      "Correo o contraseña incorrectos.",
    );
    expect(page.url()).not.toContain("password");
  });

  test("signing out and back in restores the session", async ({ page }) => {
    const email = await register(page);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/es\/login/);

    await login(page, email, PASSWORD);

    await expect(page.getByText("Hola,")).toBeVisible();
  });

  test("the session cookies cannot be read from javascript", async ({ page }) => {
    await register(page, uniqueEmail("cookies"));

    expect(await page.evaluate(() => document.cookie)).not.toContain("pulso_");
  });
});

test.describe("preferences", () => {
  test("switches language and theme", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("link", { name: "en", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("of your money");

    await page.getByRole("button", { name: "Toggle theme" }).click();

    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
