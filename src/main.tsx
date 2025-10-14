import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { performanceMonitor } from "./utils/performanceMonitoring";
import { addSkipToContent } from "./utils/accessibility";

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor;
  
  // Add skip-to-content link for accessibility
  addSkipToContent();
  
  // In development, unregister any existing service workers and clear caches to avoid stale bundles
  if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
      if (import.meta.env.DEV) console.info('[SW] Unregistered all service workers');
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        Promise.all(keys.map((k) => caches.delete(k))).then(() => {
          if (import.meta.env.DEV) console.info('[SW] Cleared all caches');
        });
      });
    }
  }
  
  // Register service worker for PWA only in production to avoid dev caching issues
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          if (import.meta.env.DEV) {
            console.log('SW registered:', registration);
          }
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.log('SW registration failed:', error);
          }
        });
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
