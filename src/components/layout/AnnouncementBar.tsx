"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Truck, Leaf, Zap, Gift, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STORAGE_KEY = "announcement-dismissed";
const ROTATE_INTERVAL = 4000;

const messages: { text: string; icon: LucideIcon; highlight: string; link: string }[] = [
  { text: "Free delivery on orders over", icon: Truck, highlight: "£40", link: "/delivery" },
  { text: "Over 500", icon: Leaf, highlight: "organic products", link: "/products?is_organic=true" },
  { text: "Same-day delivery in", icon: Zap, highlight: "London", link: "/delivery" },
  { text: "Get 10% off —", icon: Gift, highlight: "Join free today", link: "/register" },
];

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % messages.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [dismissed]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }, []);

  if (dismissed) return null;

  const msg = messages[activeIndex];
  const Icon = msg.icon;

  return (
    <div className="relative bg-(--brand-dark)">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 px-10 py-2">
        <a
          href={msg.link}
          className="inline-flex items-center gap-2 text-[13px] text-white/70 hover:text-white transition-colors group"
        >
          <Icon className="h-3.5 w-3.5 text-(--brand-amber) shrink-0" />
          <span
            key={activeIndex}
            className="animate-[fade-slide-in_300ms_ease-out]"
          >
            {msg.text}{" "}
            <span className="font-semibold text-white">{msg.highlight}</span>
          </span>
          <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        </a>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
        aria-label="Dismiss announcement"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
