/**
 * Performance Monitoring Utilities
 * Lightweight, non-blocking performance tracking for web applications
 */

// =============================================================================
// Types
// =============================================================================

export type WebVitalName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';

export interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender';
  entries: PerformanceEntry[];
}

export interface PerformanceMark {
  name: string;
  startTime: number;
  timestamp: number;
}

export interface PerformanceMeasure {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

export interface ResourceTiming {
  name: string;
  initiatorType: string;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  duration: number;
  startTime: number;
  responseEnd: number;
  protocol: string;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
}

export interface PerformanceReport {
  webVitals: Partial<Record<WebVitalName, WebVitalMetric>>;
  marks: PerformanceMark[];
  measures: PerformanceMeasure[];
  resources: ResourceTiming[];
  memory: MemoryInfo | null;
  timestamp: number;
}

export type WebVitalCallback = (metric: WebVitalMetric) => void;
export type ReportCallback = (report: PerformanceReport) => void;

// =============================================================================
// Thresholds for Web Vitals ratings
// Based on Google's Core Web Vitals thresholds
// =============================================================================

const THRESHOLDS: Record<WebVitalName, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 },         // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 },        // Cumulative Layout Shift (unitless)
  TTFB: { good: 800, poor: 1800 },       // Time to First Byte (ms)
  FCP: { good: 1800, poor: 3000 },       // First Contentful Paint (ms)
  INP: { good: 200, poor: 500 },         // Interaction to Next Paint (ms)
};

// =============================================================================
// Utility Functions
// =============================================================================

function getRating(name: WebVitalName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function generateUniqueId(): string {
  return `v${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getNavigationType(): WebVitalMetric['navigationType'] {
  if (typeof window === 'undefined') return 'navigate';

  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav) {
    return nav.type as WebVitalMetric['navigationType'];
  }
  return 'navigate';
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof performance !== 'undefined';
}

// =============================================================================
// Web Vitals Tracking
// =============================================================================

class WebVitalsTracker {
  private callbacks: WebVitalCallback[] = [];
  private metrics: Partial<Record<WebVitalName, WebVitalMetric>> = {};
  private observers: PerformanceObserver[] = [];
  private initialized = false;

  subscribe(callback: WebVitalCallback): () => void {
    this.callbacks.push(callback);

    // Emit any already collected metrics
    Object.values(this.metrics).forEach((metric) => {
      if (metric) callback(metric);
    });

    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  private emit(metric: WebVitalMetric): void {
    this.metrics[metric.name] = metric;
    this.callbacks.forEach((cb) => {
      try {
        cb(metric);
      } catch (error) {
        console.error('[Performance] Error in Web Vital callback:', error);
      }
    });
  }

  init(): void {
    if (this.initialized || !isBrowser()) return;
    this.initialized = true;

    // Use requestIdleCallback for non-blocking initialization
    const scheduleInit = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

    scheduleInit(() => {
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
      this.observeFCP();
      this.observeTTFB();
      this.observeINP();
    });
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };

        if (lastEntry) {
          this.emit({
            name: 'LCP',
            value: lastEntry.startTime,
            rating: getRating('LCP', lastEntry.startTime),
            delta: lastEntry.startTime,
            id: generateUniqueId(),
            navigationType: getNavigationType(),
            entries: [lastEntry],
          });
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch {
      // LCP not supported
    }
  }

  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as (PerformanceEntry & { processingStart: number; startTime: number })[];

        entries.forEach((entry) => {
          const value = entry.processingStart - entry.startTime;
          this.emit({
            name: 'FID',
            value,
            rating: getRating('FID', value),
            delta: value,
            id: generateUniqueId(),
            navigationType: getNavigationType(),
            entries: [entry],
          });
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch {
      // FID not supported
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];
      let sessionValue = 0;
      let sessionEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[];

        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0] as PerformanceEntry | undefined;
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1] as PerformanceEntry | undefined;

            // If the entry occurred less than 1 second after the previous entry
            // and less than 5 seconds after the first entry in the session
            if (
              sessionValue &&
              entry.startTime - (lastSessionEntry?.startTime ?? 0) < 1000 &&
              entry.startTime - (firstSessionEntry?.startTime ?? 0) < 5000
            ) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }

            // Update CLS if the current session value is larger
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              clsEntries = [...sessionEntries];

              this.emit({
                name: 'CLS',
                value: clsValue,
                rating: getRating('CLS', clsValue),
                delta: entry.value,
                id: generateUniqueId(),
                navigationType: getNavigationType(),
                entries: clsEntries,
              });
            }
          }
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch {
      // CLS not supported
    }
  }

  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');

        if (fcpEntry) {
          this.emit({
            name: 'FCP',
            value: fcpEntry.startTime,
            rating: getRating('FCP', fcpEntry.startTime),
            delta: fcpEntry.startTime,
            id: generateUniqueId(),
            navigationType: getNavigationType(),
            entries: [fcpEntry],
          });
        }
      });

      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch {
      // FCP not supported
    }
  }

  private observeTTFB(): void {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

      if (nav) {
        const value = nav.responseStart - nav.requestStart;
        this.emit({
          name: 'TTFB',
          value,
          rating: getRating('TTFB', value),
          delta: value,
          id: generateUniqueId(),
          navigationType: getNavigationType(),
          entries: [nav],
        });
      }
    } catch {
      // TTFB not supported
    }
  }

  private observeINP(): void {
    try {
      let inpValue = 0;
      let inpEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as (PerformanceEntry & { duration: number })[];

        entries.forEach((entry) => {
          if (entry.duration > inpValue) {
            inpValue = entry.duration;
            inpEntries = [entry];

            this.emit({
              name: 'INP',
              value: inpValue,
              rating: getRating('INP', inpValue),
              delta: inpValue,
              id: generateUniqueId(),
              navigationType: getNavigationType(),
              entries: inpEntries,
            });
          }
        });
      });

      observer.observe({ type: 'event', buffered: true });
      this.observers.push(observer);
    } catch {
      // INP not supported
    }
  }

  getMetrics(): Partial<Record<WebVitalName, WebVitalMetric>> {
    return { ...this.metrics };
  }

  disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// =============================================================================
// Performance Marks and Measures
// =============================================================================

class PerformanceMarker {
  private marks: Map<string, PerformanceMark> = new Map();

  mark(name: string): PerformanceMark | null {
    if (!isBrowser()) return null;

    try {
      performance.mark(name);
      const entries = performance.getEntriesByName(name, 'mark');
      const entry = entries[entries.length - 1];

      if (entry) {
        const mark: PerformanceMark = {
          name,
          startTime: entry.startTime,
          timestamp: Date.now(),
        };
        this.marks.set(name, mark);
        return mark;
      }
    } catch {
      // Mark not supported
    }
    return null;
  }

  measure(name: string, startMark: string, endMark?: string): PerformanceMeasure | null {
    if (!isBrowser()) return null;

    try {
      const end = endMark || `${name}-end`;

      if (!endMark) {
        performance.mark(end);
      }

      performance.measure(name, startMark, end);
      const entries = performance.getEntriesByName(name, 'measure');
      const entry = entries[entries.length - 1] as unknown as PerformanceMeasure & { startTime: number; duration: number };

      if (entry) {
        return {
          name,
          duration: entry.duration,
          startTime: entry.startTime,
          endTime: entry.startTime + entry.duration,
        };
      }
    } catch {
      // Measure not supported
    }
    return null;
  }

  getMarks(): PerformanceMark[] {
    return Array.from(this.marks.values());
  }

  clearMarks(): void {
    if (!isBrowser()) return;
    try {
      performance.clearMarks();
      this.marks.clear();
    } catch {
      // Clear not supported
    }
  }

  clearMeasures(): void {
    if (!isBrowser()) return;
    try {
      performance.clearMeasures();
    } catch {
      // Clear not supported
    }
  }
}

// =============================================================================
// Resource Timing Analysis
// =============================================================================

function getResourceTimings(options?: {
  type?: string;
  minSize?: number;
  maxEntries?: number;
}): ResourceTiming[] {
  if (!isBrowser()) return [];

  try {
    let entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    if (options?.type) {
      entries = entries.filter((e) => e.initiatorType === options.type);
    }

    if (options?.minSize) {
      const minSize = options.minSize;
      entries = entries.filter((e) => e.transferSize >= minSize);
    }

    if (options?.maxEntries) {
      entries = entries.slice(-options.maxEntries);
    }

    return entries.map((entry) => ({
      name: entry.name,
      initiatorType: entry.initiatorType,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      duration: entry.duration,
      startTime: entry.startTime,
      responseEnd: entry.responseEnd,
      protocol: entry.nextHopProtocol,
    }));
  } catch {
    return [];
  }
}

function getSlowResources(threshold: number = 1000): ResourceTiming[] {
  return getResourceTimings().filter((r) => r.duration > threshold);
}

function getLargeResources(threshold: number = 100000): ResourceTiming[] {
  return getResourceTimings().filter((r) => r.transferSize > threshold);
}

function getResourceSummary(): {
  totalResources: number;
  totalSize: number;
  totalDuration: number;
  byType: Record<string, { count: number; size: number; duration: number }>;
} {
  const resources = getResourceTimings();
  const byType: Record<string, { count: number; size: number; duration: number }> = {};

  resources.forEach((r) => {
    if (!byType[r.initiatorType]) {
      byType[r.initiatorType] = { count: 0, size: 0, duration: 0 };
    }
    byType[r.initiatorType].count++;
    byType[r.initiatorType].size += r.transferSize;
    byType[r.initiatorType].duration += r.duration;
  });

  return {
    totalResources: resources.length,
    totalSize: resources.reduce((acc, r) => acc + r.transferSize, 0),
    totalDuration: resources.reduce((acc, r) => acc + r.duration, 0),
    byType,
  };
}

// =============================================================================
// Memory Usage Tracking
// =============================================================================

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Performance {
    memory?: PerformanceMemory;
  }
}

function getMemoryInfo(): MemoryInfo | null {
  if (!isBrowser()) return null;

  try {
    const memory = performance.memory;

    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
  } catch {
    // Memory API not available
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// =============================================================================
// Singleton Instances
// =============================================================================

let webVitalsTracker: WebVitalsTracker | null = null;
let performanceMarker: PerformanceMarker | null = null;

function getWebVitalsTracker(): WebVitalsTracker {
  if (!webVitalsTracker) {
    webVitalsTracker = new WebVitalsTracker();
  }
  return webVitalsTracker;
}

function getPerformanceMarker(): PerformanceMarker {
  if (!performanceMarker) {
    performanceMarker = new PerformanceMarker();
  }
  return performanceMarker;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Initialize Web Vitals tracking
 * Call this once in your app layout or entry point
 */
export function initWebVitals(): void {
  getWebVitalsTracker().init();
}

/**
 * Subscribe to Web Vitals metrics
 * Returns an unsubscribe function
 */
export function onWebVital(callback: WebVitalCallback): () => void {
  return getWebVitalsTracker().subscribe(callback);
}

/**
 * Get all collected Web Vitals metrics
 */
export function getWebVitals(): Partial<Record<WebVitalName, WebVitalMetric>> {
  return getWebVitalsTracker().getMetrics();
}

/**
 * Create a performance mark
 */
export function mark(name: string): PerformanceMark | null {
  return getPerformanceMarker().mark(name);
}

/**
 * Measure duration between two marks
 */
export function measure(name: string, startMark: string, endMark?: string): PerformanceMeasure | null {
  return getPerformanceMarker().measure(name, startMark, endMark);
}

/**
 * Utility: Measure async operation duration
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startMark = `${name}-start`;
  mark(startMark);

  const result = await operation();

  const measurement = measure(name, startMark);

  return {
    result,
    duration: measurement?.duration ?? 0,
  };
}

/**
 * Get resource timings with optional filtering
 */
export { getResourceTimings, getSlowResources, getLargeResources, getResourceSummary };

/**
 * Get memory info (if available)
 */
export { getMemoryInfo, formatBytes };

/**
 * Generate a full performance report
 */
export function generatePerformanceReport(): PerformanceReport {
  return {
    webVitals: getWebVitals(),
    marks: getPerformanceMarker().getMarks(),
    measures: [], // Would need to track these separately
    resources: getResourceTimings({ maxEntries: 50 }),
    memory: getMemoryInfo(),
    timestamp: Date.now(),
  };
}

/**
 * Log performance metrics to console (development only)
 */
export function logPerformanceMetrics(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const report = generatePerformanceReport();

  console.group('[Performance Report]');

  console.group('Web Vitals');
  Object.entries(report.webVitals).forEach(([name, metric]) => {
    if (metric) {
      const color = metric.rating === 'good' ? 'green' : metric.rating === 'poor' ? 'red' : 'orange';
      console.log(`%c${name}: ${metric.value.toFixed(2)} (${metric.rating})`, `color: ${color}`);
    }
  });
  console.groupEnd();

  if (report.memory) {
    console.group('Memory');
    console.log(`Used: ${formatBytes(report.memory.usedJSHeapSize)}`);
    console.log(`Total: ${formatBytes(report.memory.totalJSHeapSize)}`);
    console.log(`Limit: ${formatBytes(report.memory.jsHeapSizeLimit)}`);
    console.log(`Usage: ${report.memory.usedPercentage.toFixed(2)}%`);
    console.groupEnd();
  }

  const resourceSummary = getResourceSummary();
  console.group('Resources');
  console.log(`Total: ${resourceSummary.totalResources}`);
  console.log(`Size: ${formatBytes(resourceSummary.totalSize)}`);
  console.log(resourceSummary.byType);
  console.groupEnd();

  console.groupEnd();
}

/**
 * Clear all performance data
 */
export function clearPerformanceData(): void {
  getPerformanceMarker().clearMarks();
  getPerformanceMarker().clearMeasures();
  if (isBrowser()) {
    try {
      performance.clearResourceTimings();
    } catch {
      // Clear not supported
    }
  }
}

/**
 * Disconnect all observers (cleanup)
 */
export function disconnectPerformanceObservers(): void {
  getWebVitalsTracker().disconnect();
}
