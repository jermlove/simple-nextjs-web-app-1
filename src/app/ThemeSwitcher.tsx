"use client";
import { useTheme } from "../theme-context";

export function ThemeSwitcher() {
  const { theme, setThemeByName, themes } = useTheme();

  return (
    <div style={{ margin: "1rem 0" }}>
      <label htmlFor="theme-select" style={{ marginRight: 8 }}>Theme:</label>
      <select
        id="theme-select"
        value={theme.name}
        onChange={(e) => setThemeByName(e.target.value)}
        style={{ padding: 4 }}
      >
        {themes.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
