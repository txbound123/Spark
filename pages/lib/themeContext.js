import { createContext, useContext, useState, useEffect } from "react";

const LIGHT = {
  bg: "#F5F0E8", paper: "#FDFAF4", dark: "#2C1810",
  mid: "#6B4226", accent: "#C17F3A", accentLight: "#E8A84C",
  soft: "#D4C4A8", softDark: "#B8A88A",
  green: "#4A7C59", greenLight: "#EBF3EE", red: "#C0392B",
};

const DARK = {
  bg: "#1C1410", paper: "#261C17", dark: "#F0E6D3",
  mid: "#C8A882", accent: "#D4924A", accentLight: "#E8A84C",
  soft: "#3D2A20", softDark: "#7A6252",
  green: "#5A9C6A", greenLight: "#1A2E20", red: "#D4483A",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("spark-theme");
    if (saved === "dark") setDarkMode(true);
  }, []);

  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("spark-theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ C: darkMode ? DARK : LIGHT, darkMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
