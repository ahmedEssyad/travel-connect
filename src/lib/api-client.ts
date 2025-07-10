import { auth } from './firebase';

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
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the ID token
    const idToken = await user.getIdToken();
    
    // Add authentication headers
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${idToken}`);
    headers.set('X-User-ID', user.uid);
    headers.set('X-User-Email', user.email || '');
    
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
      // Token might be expired, try to refresh
      const newToken = await user.getIdToken(true);
      headers.set('Authorization', `Bearer ${newToken}`);
      
      // Retry the request
      const retryResponse = await fetch(url, {
        ...options,
        headers,
      });
      
      // Cache successful GET responses
      if (method === 'GET' && retryResponse.ok) {
        const data = await retryResponse.clone().json();
        cache.set(url, { data, timestamp: Date.now() });
      }
      
      return retryResponse;
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
        if (key.includes('/api/trips') || key.includes('/api/requests') || key.includes('/api/matches')) {
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
  get: (url: string) => authenticatedFetch(url, { method: 'GET' }),
  
  post: (url: string, data: any) => authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  put: (url: string, data: any) => authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (url: string) => authenticatedFetch(url, { method: 'DELETE' }),
};