"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie-consent";

type ConsentValue = "all" | "essential";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return;

    const timer = setTimeout(() => {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  function handleConsent(value: ConsentValue) {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
    setTimeout(() => setMounted(false), 500);
  }

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className={`
        fixed bottom-0 left-0 right-0
        z-(--z-toast)
        transition-all duration-500 ease-(--ease-premium)
        ${visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
      `}
    >
      <div
        className="
          mx-auto p-5
          bg-(--color-surface) border border-(--color-border)
          max-w-lg mb-4 rounded-2xl shadow-(--shadow-2xl)
          max-md:max-w-none max-md:mb-0 max-md:rounded-b-none max-md:rounded-t-(--radius-2xl)
        "
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none shrink-0" aria-hidden="true">
            🍪
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              We value your privacy
            </h2>
            <p className="mt-1.5 text-sm text-(--color-text-secondary) leading-relaxed">
              We use cookies to enhance your browsing experience, serve
              personalised content, and analyse our traffic. By clicking
              &lsquo;Accept All&rsquo;, you consent to our use of cookies.{" "}
              <Link
                href="/cookies"
                className="text-(--brand-primary) hover:underline font-medium"
              >
                Cookie Policy
              </Link>
            </p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleConsent("all")}
                className="
                  px-4 py-2.5 text-sm font-semibold text-white rounded-lg
                  bg-(--brand-amber) hover:bg-(--brand-amber-hover)
                  transition-colors duration-(--duration-base)
                  cursor-pointer
                "
              >
                Accept All
              </button>
              <button
                onClick={() => handleConsent("essential")}
                className="
                  px-4 py-2.5 text-sm font-semibold rounded-lg
                  border border-(--color-border) text-foreground
                  hover:bg-(--color-elevated)
                  transition-colors duration-(--duration-base)
                  cursor-pointer
                "
              >
                Essential Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
