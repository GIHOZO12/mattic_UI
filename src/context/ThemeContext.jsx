import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

const ThemeContext = createContext(null);
const modes = ["system", "light", "dark"];
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("store-theme") || "system";
    } catch {
      return "system";
    }
  });
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = mode === "dark" || (mode !== "light" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", dark ? "#141a20" : "#f5f3ea");
    };
    apply();
    try {
      localStorage.setItem("store-theme", mode);
    } catch {
      /* Storage may be disabled. */
    }
    media.addEventListener("change", apply);
    const sync = (event) => {
      if (event.key === "store-theme")
        setMode(modes.includes(event.newValue) ? event.newValue : "system");
    };
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", apply);
      window.removeEventListener("storage", sync);
    };
  }, [mode]);
  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeControl() {
  const { mode, setMode } = useContext(ThemeContext);
  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  return (
    <label className="theme-control">
      <Icon size={18} aria-hidden="true" />
      <select
        aria-label="Color theme"
        value={mode}
        onChange={(event) => setMode(event.target.value)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
