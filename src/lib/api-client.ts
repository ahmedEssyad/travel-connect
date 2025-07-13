// Enhanced cache for slow connections
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 120000; // 2 minutes for slow connections

// Retry mechanism for slow connections
async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      // Add timeout for slow connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === retries) throw error;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const method = options.method || 'GET';
  
  // Check cache for GET requests (longer cache for slow connections)
  if (method === 'GET') {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    // Add authentication headers
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    
    // If sending JSON, ensure content-type is set
    if (options.body && !headers.get('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    const response = await fetchWithRetry(url, {
      ...options,
      headers,
    });

    // Handle authentication errors
    if (response.status === 401) {
      // Token is expired or invalid, redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Authentication expired');
    }
    
    // Cache successful GET responses (longer cache for slow connections)
    if (method === 'GET' && response.ok) {
      try {
        const data = await response.clone().json();
        cache.set(url, { data, timestamp: Date.now() });
      } catch (e) {
        // Ignore cache errors
      }
    }
    
    // Invalidate cache for write operations
    if (['POST', 'PUT', 'DELETE'].includes(method) && response.ok) {
      // Clear related cache entries
      for (const key of cache.keys()) {
        if (key.includes('/api/blood-requests') || key.includes('/api/auth') || key.includes('/api/notifications')) {
          cache.delete(key);
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    
    // For GET requests, try to return cached data if available
    if (method === 'GET') {
      const cached = cache.get(url);
      if (cached) {
        console.log('Using stale cache due to network error');
        return new Response(JSON.stringify(cached.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    throw error;
  }
}

// Convenience methods
export const apiClient = {
  get: (url: string, options: RequestInit = {}) => {
    // Check if auth is required (skip for public endpoints)
    if (url.includes('/api/auth/send-code') || url.includes('/api/auth/verify-code') || url.includes('/api/auth/check-user')) {
      return fetch(url, { 
        method: 'GET', 
        headers: { 'Content-Type': 'application/json' },
        ...options 
      });
    }
    return authenticatedFetch(url, { method: 'GET', ...options });
  },
  
  post: (url: string, data: any, options: RequestInit = {}) => {
    // Check if auth is required (skip for public endpoints)
    if (url.includes('/api/auth/send-code') || url.includes('/api/auth/verify-code') || url.includes('/api/auth/login') || url.includes('/api/auth/reset-password')) {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        ...options
      });
    }
    return authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  },
  
  put: (url: string, data: any, options: RequestInit = {}) => 
    authenticatedFetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    }),
  
  delete: (url: string, options: RequestInit = {}) => 
    authenticatedFetch(url, { method: 'DELETE', ...options }),
};