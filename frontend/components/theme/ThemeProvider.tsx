"use client";

import { useEffect, useState } from "react";
import { useIsDarkMode, useTheme } from "@/store";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDarkMode = useIsDarkMode();
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  console.log("ThemeProvider - theme:", theme, "isDarkMode:", isDarkMode);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Apply dark class
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Set data-theme attribute (now correctly matching isDarkMode)
    root.setAttribute("data-theme", isDarkMode ? "dark" : "light");

    console.log(
      "🎨 Theme applied - dark class:",
      root.classList.contains("dark"),
    );
  }, [isDarkMode, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      console.log("📱 System theme changed:", e.matches ? "dark" : "light");
      // The store will handle this via the setTheme logic when theme is "system"
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  // Prevent flash of wrong theme
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <>{children}</>;
}
