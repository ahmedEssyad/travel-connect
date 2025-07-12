// Simple cache for GET requests
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const method = options.method || 'GET';
  
  // Check cache for GET requests
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
    
    const response = await fetch(url, {
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
    
    // Cache successful GET responses
    if (method === 'GET' && response.ok) {
      const data = await response.clone().json();
      cache.set(url, { data, timestamp: Date.now() });
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