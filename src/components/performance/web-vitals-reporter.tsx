'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  initWebVitals,
  onWebVital,
  disconnectPerformanceObservers,
  getMemoryInfo,
  formatBytes,
  getResourceSummary,
  type WebVitalMetric,
  type WebVitalName,
} from '@/lib/performance';

// =============================================================================
// Types
// =============================================================================

export interface WebVitalsReporterProps {
  /**
   * Enable console logging in development mode
   * @default true
   */
  enableConsoleLogging?: boolean;

  /**
   * Custom callback for analytics integration
   * Called whenever a Web Vital metric is collected
   */
  onReport?: (metric: WebVitalMetric) => void;

  /**
   * Send metrics to an analytics endpoint
   * If provided, metrics will be batched and sent via sendBeacon
   */
  analyticsEndpoint?: string;

  /**
   * Batch interval for sending metrics (in ms)
   * @default 5000
   */
  batchInterval?: number;

  /**
   * Include resource timing data in reports
   * @default false
   */
  includeResourceTiming?: boolean;

  /**
   * Include memory info in reports (Chrome only)
   * @default false
   */
  includeMemoryInfo?: boolean;

  /**
   * Custom logger function
   */
  logger?: (message: string, data?: unknown) => void;
}

interface MetricBatch {
  metrics: WebVitalMetric[];
  resourceSummary?: ReturnType<typeof getResourceSummary>;
  memoryInfo?: ReturnType<typeof getMemoryInfo>;
  url: string;
  timestamp: number;
  userAgent: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

const RATING_COLORS: Record<WebVitalMetric['rating'], string> = {
  good: '#0cce6b',
  'needs-improvement': '#ffa400',
  poor: '#ff4e42',
};

const RATING_LABELS: Record<WebVitalMetric['rating'], string> = {
  good: 'Good',
  'needs-improvement': 'Needs Improvement',
  poor: 'Poor',
};

const METRIC_DESCRIPTIONS: Record<WebVitalName, string> = {
  LCP: 'Largest Contentful Paint - loading performance',
  FID: 'First Input Delay - interactivity',
  CLS: 'Cumulative Layout Shift - visual stability',
  TTFB: 'Time to First Byte - server response time',
  FCP: 'First Contentful Paint - initial render time',
  INP: 'Interaction to Next Paint - responsiveness',
};

const METRIC_UNITS: Record<WebVitalName, string> = {
  LCP: 'ms',
  FID: 'ms',
  CLS: '',
  TTFB: 'ms',
  FCP: 'ms',
  INP: 'ms',
};

function formatMetricValue(name: WebVitalName, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}${METRIC_UNITS[name]}`;
}

function getConsoleStyle(rating: WebVitalMetric['rating']): string {
  return `color: ${RATING_COLORS[rating]}; font-weight: bold;`;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Web Vitals Reporter Component
 *
 * A lightweight, non-blocking component that tracks Core Web Vitals
 * and reports them via console logging (development) or analytics integration.
 *
 * @example
 * // Basic usage - console logging in development
 * <WebVitalsReporter />
 *
 * @example
 * // With analytics integration
 * <WebVitalsReporter
 *   onReport={(metric) => {
 *     analytics.track('web_vital', {
 *       name: metric.name,
 *       value: metric.value,
 *       rating: metric.rating,
 *     });
 *   }}
 * />
 *
 * @example
 * // With analytics endpoint for beacon API
 * <WebVitalsReporter
 *   analyticsEndpoint="/api/analytics/web-vitals"
 *   batchInterval={10000}
 *   includeResourceTiming
 *   includeMemoryInfo
 * />
 */
export function WebVitalsReporter({
  enableConsoleLogging = true,
  onReport,
  analyticsEndpoint,
  batchInterval = 5000,
  includeResourceTiming = false,
  includeMemoryInfo = false,
  logger,
}: WebVitalsReporterProps) {
  const metricsQueueRef = useRef<WebVitalMetric[]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const log = useCallback(
    (message: string, data?: unknown) => {
      if (logger) {
        logger(message, data);
      } else if (process.env.NODE_ENV === 'development' && enableConsoleLogging) {
        if (data !== undefined) {
          console.log(message, data);
        } else {
          console.log(message);
        }
      }
    },
    [logger, enableConsoleLogging]
  );

  const sendMetricsBatch = useCallback(() => {
    if (!analyticsEndpoint || metricsQueueRef.current.length === 0) {
      return;
    }

    const batch: MetricBatch = {
      metrics: [...metricsQueueRef.current],
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    if (includeResourceTiming) {
      batch.resourceSummary = getResourceSummary();
    }

    if (includeMemoryInfo) {
      batch.memoryInfo = getMemoryInfo();
    }

    // Use sendBeacon for reliable delivery, especially on page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
      navigator.sendBeacon(analyticsEndpoint, blob);
    } else if (typeof fetch !== 'undefined') {
      // Fallback to fetch for browsers without sendBeacon
      fetch(analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
        keepalive: true,
      }).catch(() => {
        // Silent fail - analytics should not break the app
      });
    }

    // Clear the queue
    metricsQueueRef.current = [];
  }, [analyticsEndpoint, includeResourceTiming, includeMemoryInfo]);

  const handleMetric = useCallback(
    (metric: WebVitalMetric) => {
      // Console logging in development
      if (process.env.NODE_ENV === 'development' && enableConsoleLogging) {
        const formattedValue = formatMetricValue(metric.name, metric.value);
        const description = METRIC_DESCRIPTIONS[metric.name];
        const ratingLabel = RATING_LABELS[metric.rating];

        console.group(`%c[Web Vital] ${metric.name}`, getConsoleStyle(metric.rating));
        console.log(`Value: ${formattedValue}`);
        console.log(`Rating: ${ratingLabel}`);
        console.log(`Description: ${description}`);
        console.log(`Navigation: ${metric.navigationType}`);
        console.groupEnd();
      }

      // Custom callback
      if (onReport) {
        try {
          onReport(metric);
        } catch (error) {
          log('[WebVitalsReporter] Error in onReport callback:', error);
        }
      }

      // Queue for batch sending
      if (analyticsEndpoint) {
        metricsQueueRef.current.push(metric);
      }
    },
    [enableConsoleLogging, onReport, analyticsEndpoint, log]
  );

  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals();

    // Subscribe to Web Vital metrics
    const unsubscribe = onWebVital(handleMetric);

    // Set up batch sending interval
    if (analyticsEndpoint && batchInterval > 0) {
      batchTimerRef.current = setInterval(sendMetricsBatch, batchInterval);
    }

    // Send remaining metrics on page unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendMetricsBatch();
      }
    };

    const handleBeforeUnload = () => {
      sendMetricsBatch();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    // Log initial memory info
    if (process.env.NODE_ENV === 'development' && enableConsoleLogging && includeMemoryInfo) {
      const memoryInfo = getMemoryInfo();
      if (memoryInfo) {
        log('[WebVitalsReporter] Initial Memory:', {
          used: formatBytes(memoryInfo.usedJSHeapSize),
          total: formatBytes(memoryInfo.totalJSHeapSize),
          limit: formatBytes(memoryInfo.jsHeapSizeLimit),
          usage: `${memoryInfo.usedPercentage.toFixed(2)}%`,
        });
      }
    }

    // Cleanup
    return () => {
      unsubscribe();
      disconnectPerformanceObservers();

      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
      }

      // Send any remaining metrics
      sendMetricsBatch();

      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }

      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, [handleMetric, sendMetricsBatch, analyticsEndpoint, batchInterval, enableConsoleLogging, includeMemoryInfo, log]);

  // This component doesn't render anything
  return null;
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to track a specific user interaction's performance
 *
 * @example
 * const trackClick = usePerformanceTracker('button-click');
 *
 * <button onClick={() => trackClick(() => handleClick())}>
 *   Click me
 * </button>
 */
export function usePerformanceTracker(name: string) {
  const track = useCallback(
    async <T,>(operation: () => T | Promise<T>): Promise<T> => {
      const startTime = performance.now();

      try {
        const result = await operation();
        const duration = performance.now() - startTime;

        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
        }

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${name} (error): ${duration.toFixed(2)}ms`);
        }

        throw error;
      }
    },
    [name]
  );

  return track;
}

/**
 * Hook to measure component render time
 *
 * @example
 * function MyComponent() {
 *   useRenderPerformance('MyComponent');
 *   return <div>...</div>;
 * }
 */
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number>(performance.now());

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;

    if (process.env.NODE_ENV === 'development') {
      if (renderTime > 16) {
        // Longer than one frame (60fps)
        console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (>16ms)`);
      }
    }
  });

  // Reset on each render
  renderStartRef.current = performance.now();
}

export default WebVitalsReporter;
