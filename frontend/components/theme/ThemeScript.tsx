"use client";

import { useEffect } from "react";

export default function ThemeScript() {
  useEffect(() => {
    const stored = localStorage.getItem("ecommerce-storage");
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.isDarkMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (e) {
        console.error("Error parsing theme:", e);
      }
    }
  }, []);

  return null;
}
