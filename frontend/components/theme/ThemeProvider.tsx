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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    console.log("🎨 Applying theme:", {
      isDarkMode,
      theme,
      willAddDark: isDarkMode,
    });

    // Force apply the class
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Also set a data attribute for debugging
    root.setAttribute("data-theme", isDarkMode ? "dark" : "light");

    // Force a reflow to ensure styles are applied
    document.body.style.display = "none";
    document.body.offsetHeight; // Force reflow
    document.body.style.display = "";
  }, [isDarkMode, mounted]);

  // Listen for system preference changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      console.log("📱 System theme changed:", e.matches ? "dark" : "light");
      if (theme === "system") {
        // The store will handle this
      }
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
