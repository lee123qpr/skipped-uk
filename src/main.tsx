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
  
  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
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
