import type { Metric } from "web-vitals";

const thresholds: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  FID: [100, 300],
  CLS: [100, 250],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

function getRating(label: string, value: number): string {
  const [good, poor] = thresholds[label] ?? [Infinity, Infinity];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

export function reportWebVitals(metric: Metric) {
  const label = metric.name;
  const value = Math.round(
    label === "CLS" ? metric.value * 1000 : metric.value
  );
  const rating = getRating(label, value);

  if (process.env.NODE_ENV === "development") {
    const icon = rating === "good" ? "\u2705" : rating === "needs-improvement" ? "\u26A0\uFE0F" : "\uD83D\uDD34";
    const unit = label === "CLS" ? "" : "ms";
    console.log(`${icon} ${label}: ${value}${unit} (${rating})`);
  }

  if (process.env.NODE_ENV === "production") {
    const body = JSON.stringify({
      name: label,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/vitals", body);
    }
  }
}
