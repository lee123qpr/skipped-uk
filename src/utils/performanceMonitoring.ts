/**
 * Performance monitoring utilities for Core Web Vitals tracking
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObserver();
    }
  }

  private initializeObserver() {
    try {
      // Observe Largest Contentful Paint (LCP)
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.recordMetric('LCP', entry.startTime, this.rateLCP(entry.startTime));
          }
        }
      });

      this.observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track First Input Delay (FID) via event timing
      if (PerformanceObserver.supportedEntryTypes?.includes('first-input')) {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as any; // PerformanceEventTiming
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.recordMetric('FID', fid, this.rateFID(fid));
          }
        });

        fidObserver.observe({ entryTypes: ['first-input'] });
      }

      // Track Cumulative Layout Shift (CLS)
      if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as any; // LayoutShift
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
            }
          }
          this.recordMetric('CLS', clsValue, this.rateCLS(clsValue));
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }
    } catch (error) {
      console.error('Failed to initialize performance observer:', error);
    }
  }

  private recordMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms (${rating})`);
    }

    // Send to analytics (placeholder for future integration)
    this.sendToAnalytics(metric);
  }

  private rateLCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private rateFID(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private rateCLS(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Placeholder for analytics integration
    // Could send to Google Analytics, custom backend, etc.
    // Example: gtag('event', 'web_vitals', { metric_name: metric.name, ... });
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Track custom performance marks
 */
export function markPerformance(name: string) {
  if (typeof window !== 'undefined' && window.performance) {
    window.performance.mark(name);
  }
}

/**
 * Measure between two marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name)[0];
      
      if (import.meta.env.DEV) {
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
      }
      
      return measure.duration;
    } catch (error) {
      console.error('Failed to measure performance:', error);
    }
  }
  return 0;
}
