import { createContext, useContext, useState, useEffect } from "react";

const LIGHT = {
  bg: "#F5F0E8", paper: "#FDFAF4", dark: "#2C1810",
  mid: "#6B4226", accent: "#C17F3A", accentLight: "#E8A84C",
  soft: "#D4C4A8", softDark: "#B8A88A",
  green: "#4A7C59", greenLight: "#EBF3EE", red: "#C0392B",
  listeningBg: "#FEF2F2",
};

const DARK = {
  bg: "#18130F", paper: "#241E18", dark: "#F0E8D8",
  mid: "#C9955A", accent: "#C17F3A", accentLight: "#E8A84C",
  soft: "#3A3025", softDark: "#8A7A68",
  green: "#5A9C6A", greenLight: "#1A2E20", red: "#E05050",
  listeningBg: "#2E1515",
};

const ThemeContext = createContext({ C: LIGHT, darkMode: false, toggleDarkMode: () => {} });

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("spark-dark-mode");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.body.style.background = darkMode ? DARK.bg : LIGHT.bg;
    document.body.style.color = darkMode ? DARK.dark : LIGHT.dark;
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("spark-dark-mode", String(next));
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ C: darkMode ? DARK : LIGHT, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
