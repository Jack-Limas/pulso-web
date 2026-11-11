import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

export const PASSWORD = "e2e-password-123";

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@pulso.test`;
}

export async function register(page: Page, email = uniqueEmail("e2e"), fullName = "Prueba E2E") {
  await page.goto("/es/register");
  await page.getByLabel("Nombre completo").fill(fullName);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/es\/app\/dashboard$/);
  return email;
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/es/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/es\/app\/dashboard$/);
}

export async function createAndinoAccount(page: Page) {
  await page.goto("/es/app/upload");
  await page.getByLabel("Banco").selectOption({ label: "Banco Andino" });
  await page.getByLabel("Nombre de la cuenta").fill("Ahorros E2E");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("button", { name: /Ahorros E2E/ })).toBeVisible();
}

export async function waitForLive(page: Page) {
  await expect(page.getByText("En vivo", { exact: true })).toBeVisible();
}
