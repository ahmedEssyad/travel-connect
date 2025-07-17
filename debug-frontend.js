// Debug frontend blood requests fetching
const testFrontendFetch = async () => {
  try {
    console.log('Testing frontend fetch...');
    
    // Test 1: Direct fetch (like backend)
    const directResponse = await fetch('http://localhost:3000/api/blood-requests?status=active&limit=10');
    const directData = await directResponse.json();
    console.log('Direct fetch result:', directData.requests?.length, 'requests');
    
    // Test 2: Test with cache check (like frontend)
    const cacheKey = 'blood-requests-undefined-undefined';
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}-time`);
    
    console.log('Cache check:', {
      cached: cached ? 'exists' : 'none',
      cacheTime: cacheTime ? new Date(parseInt(cacheTime)) : 'none',
      isValid: cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 120000
    });
    
    // Test 3: Test with auth headers (like frontend API client)
    const authToken = localStorage.getItem('authToken');
    console.log('Auth token:', authToken ? 'exists' : 'none');
    
    if (authToken) {
      const authResponse = await fetch('http://localhost:3000/api/blood-requests?status=active&limit=10', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const authData = await authResponse.json();
      console.log('Authenticated fetch result:', authData.requests?.length, 'requests');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testFrontendFetch();