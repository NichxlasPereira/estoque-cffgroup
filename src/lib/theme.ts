export type ThemeMode = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "estoque-cffgroup:theme";

const LIGHT_START_HOUR = 6;
const LIGHT_END_HOUR = 18;

export function themeForHour(hour: number): ResolvedTheme {
  return hour >= LIGHT_START_HOUR && hour < LIGHT_END_HOUR ? "light" : "dark";
}

export function resolveTheme(mode: ThemeMode, now: Date = new Date()): ResolvedTheme {
  if (mode === "light" || mode === "dark") return mode;
  return themeForHour(now.getHours());
}

export function readStoredThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "auto") return stored;
  } catch {
    // localStorage indisponível — usa o padrão
  }
  return "auto";
}

export function applyResolvedTheme(theme: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var KEY = ${JSON.stringify(THEME_STORAGE_KEY)};
    var mode = localStorage.getItem(KEY) || "auto";
    var theme = mode;
    if (mode === "auto") {
      var hour = new Date().getHours();
      theme = (hour >= ${LIGHT_START_HOUR} && hour < ${LIGHT_END_HOUR}) ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;
