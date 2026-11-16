export const THEME_KEY = "pulso-theme";

// Runs before the first paint so a dark preference never flashes the light theme.
export const themeBootstrapScript = `try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export function applyStoredTheme(): void {
  try {
    document.documentElement.dataset.theme =
      localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    // Storage can be blocked; the page keeps whatever theme it has.
  }
}
