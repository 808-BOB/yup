// Performance optimization utilities

import { useCallback, useMemo, useState } from "react";

// Debounce hook for search inputs and form validation
export const useDebounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  return useCallback(
    ((...args) => {
      clearTimeout((callback as any)._timeout);
      (callback as any)._timeout = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
};

// Memoized computation for expensive operations
export const useMemoizedComputation = <T>(
  computation: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(computation, deps);
};

// Image optimization helpers
export const optimizeImageUrl = (url: string, width?: number, height?: number): string => {
  if (!url) return "";
  
  // For base64 images, return as-is
  if (url.startsWith("data:")) return url;
  
  // Add query parameters for image optimization if supported
  const params = new URLSearchParams();
  if (width) params.append("w", width.toString());
  if (height) params.append("h", height.toString());
  params.append("q", "80"); // Quality
  
  const separator = url.includes("?") ? "&" : "?";
  return params.toString() ? `${url}${separator}${params.toString()}` : url;
};

// Virtual scrolling helper for large lists
export const useVirtualScrolling = (
  items: any[],
  containerHeight: number,
  itemHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, scrollTop, containerHeight, itemHeight]);
  
  return { visibleItems, setScrollTop };
};

// Preload critical resources
export const preloadResource = (url: string, type: "image" | "script" | "style") => {
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = url;
  
  switch (type) {
    case "image":
      link.as = "image";
      break;
    case "script":
      link.as = "script";
      break;
    case "style":
      link.as = "style";
      break;
  }
  
  document.head.appendChild(link);
};

// Bundle size analyzer (development only)
export const logBundleInfo = () => {
  if (process.env.NODE_ENV === "development") {
    console.log("Performance monitoring active");
    
    // Monitor React render performance
    if (window.performance) {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "measure") {
            console.log(`React render: ${entry.name} took ${entry.duration}ms`);
          }
        }
      });
      
      perfObserver.observe({ entryTypes: ["measure"] });
    }
  }
};