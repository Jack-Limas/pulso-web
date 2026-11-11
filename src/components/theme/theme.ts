export const THEME_KEY = "pulso-theme";

// Runs before the first paint so a dark preference never flashes the light theme.
export const themeBootstrapScript = `try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
