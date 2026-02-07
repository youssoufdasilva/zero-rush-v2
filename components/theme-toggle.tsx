"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("theme") as Theme | null;
  return stored ?? "system";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay to avoid hydration mismatch - intentional setState in effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
    
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted, theme]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="w-9 h-9"
      title={`Current: ${theme}. Click to cycle.`}
    >
      {theme === "light" && <SunIcon className="w-5 h-5" />}
      {theme === "dark" && <MoonIcon className="w-5 h-5" />}
      {theme === "system" && <MonitorIcon className="w-5 h-5" />}
      <span className="sr-only">Toggle theme (current: {theme})</span>
    </Button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
