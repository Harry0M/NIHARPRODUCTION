import React, { useEffect } from 'react';

// Optimization wrapper for order form components
export const OrderFormOptimizer: React.FC<{children: React.ReactNode}> = ({ children }) => {
  useEffect(() => {
    // Pre-fetch and cache critical resources when the form loads
    prefetchResources();
    
    // Add optimization options
    applyOptimizationOptions();
    
    return () => {
      // Clean up any optimization-related side effects
      removeOptimizationOptions();
    };
  }, []);

  // Prefetch critical resources that the form will need
  const prefetchResources = () => {
    try {
      // Add resource hints for critical resources
      const resourceUrls = [
        '/assets/fonts/inter.woff2',
        '/assets/icons/material.woff2'
      ];
      
      resourceUrls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = url.endsWith('.woff2') ? 'font' : 'image';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });

    } catch (error) {
      console.error('Error in prefetch resources:', error);
    }
  };

  // Apply React and browser-level optimizations
  const applyOptimizationOptions = () => {
    try {
      // Apply CSS optimizations to reduce layout thrashing
      const style = document.createElement('style');
      style.id = 'order-form-optimizations';
      style.innerHTML = `
        /* Optimize paint and composite operations */
        .order-form-container * {
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        /* Reduce layout shifts */
        .order-form-container {
          contain: content;
        }
        
        /* Optimize material selector rendering */
        .material-selector-dialog {
          contain: content;
        }
        
        /* Optimize table rendering */
        table {
          contain: content;
        }
        
        /* Optimize rendering for component cards */
        .component-card {
          contain: content;
          will-change: transform;
        }
        
        /* Optimize dropdown menus */
        [role="listbox"] {
          contain: content;
        }
        
        /* Prevent layout thrashing during interactions */
        input, select, button {
          transform: translateZ(0);
        }
      `;
      document.head.appendChild(style);

      // Add class to main container to apply optimizations
      setTimeout(() => {
        const orderForm = document.querySelector('form');
        if (orderForm) {
          orderForm.classList.add('order-form-container');
        }
        
        // Add optimization classes to component cards
        document.querySelectorAll('.component-card').forEach(card => {
          card.classList.add('component-card');
        });
      }, 100);

    } catch (error) {
      console.error('Error applying optimization options:', error);
    }
  };

  // Remove optimization styles when component unmounts
  const removeOptimizationOptions = () => {
    try {
      const style = document.getElementById('order-form-optimizations');
      if (style) {
        document.head.removeChild(style);
      }
    } catch (error) {
      console.error('Error removing optimization options:', error);
    }
  };

  return <>{children}</>;
};

// Cache utility to reduce network requests
export const setupCacheInterceptor = () => {
  // Check if we've already set up the interceptor
  if ((window as any).__cacheInterceptorSetup) return;
  (window as any).__cacheInterceptorSetup = true;
  
  // Create an in-memory cache for API responses
  const apiCache = new Map<string, {data: any, timestamp: number}>();
  const CACHE_TTL = 60 * 1000; // 1 minute TTL for API cache
  
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Override fetch with our caching version
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const request = new Request(input, init);
    const url = request.url;
    
    // Only cache GET requests to specific endpoints
    if (request.method === 'GET' && 
        (url.includes('/companies') || 
         url.includes('/inventory') || 
         url.includes('/catalog'))) {
      
      // Check if we have a fresh cached response
      const cached = apiCache.get(url);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Cache] Using cached response for ${url}`);
        // Return a cloned response from cache
        return new Response(JSON.stringify(cached.data), {
          headers: {'Content-Type': 'application/json'}
        });
      }
      
      // If not cached or stale, make the actual request
      const response = await originalFetch(input, init);
      
      // Clone the response so we can read it twice
      const clone = response.clone();
      
      // Cache the response
      try {
        const data = await clone.json();
        apiCache.set(url, {
          data,
          timestamp: Date.now()
        });
        console.log(`[Cache] Cached response for ${url}`);
      } catch (error) {
        console.error('[Cache] Failed to cache response:', error);
      }
      
      return response;
    }
    
    // For non-cacheable requests, pass through to original fetch
    return originalFetch(input, init);
  };
};

// Optimization for component rendering
export const optimizeComponentRendering = () => {
  try {
    // Debounce function for input events
    function debounce(func: Function, wait: number) {
      let timeout: ReturnType<typeof setTimeout>;
      return function executedFunction(...args: any[]) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
    
    // Add event listeners with debouncing to form inputs
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      const debouncedHandler = debounce((e: Event) => {
        // The original event handler will still run, but this gives us
        // a chance to optimize rendering during rapid input changes
        requestAnimationFrame(() => {
          // Force GPU acceleration during input changes
          document.body.style.transform = 'translateZ(0)';
          setTimeout(() => {
            document.body.style.transform = '';
          }, 0);
        });
      }, 100);
      
      input.addEventListener('input', debouncedHandler);
      input.addEventListener('change', debouncedHandler);
    });
    
    // Optimize scroll performance
    document.addEventListener('scroll', () => {
      requestAnimationFrame(() => {
        // Add a transform to force GPU acceleration during scrolling
        document.body.style.transform = 'translateZ(0)';
        setTimeout(() => {
          document.body.style.transform = '';
        }, 0);
      });
    }, { passive: true });
    
  } catch (error) {
    console.error('Error optimizing component rendering:', error);
  }
};
