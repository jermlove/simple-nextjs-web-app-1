"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { themes } from "../themes/themes";

type Theme = typeof themes[number];

interface ThemeContextType {
  theme: Theme;
  setThemeByName: (name: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    Object.entries(theme.properties).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [theme]);

  const setThemeByName = (name: string) => {
    const found = themes.find((t) => t.name === name);
    if (found) setTheme(found);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeByName, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
