"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function clearAllTimeouts() {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    }

    function schedule(fn: () => void, ms: number) {
      const id = setTimeout(fn, ms);
      timeoutRefs.current.push(id);
    }

    clearAllTimeouts();

    setVisible(true);
    setProgress(30);

    schedule(() => setProgress(70), 300);
    schedule(() => setProgress(100), 600);
    schedule(() => {
      setVisible(false);
      setProgress(0);
    }, 900);

    return clearAllTimeouts;
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] rounded-r-full"
      style={{
        width: `${progress}%`,
        background:
          "linear-gradient(to right, var(--brand-primary), var(--brand-amber))",
        transition: "width 300ms ease-out",
      }}
    />
  );
}
