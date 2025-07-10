'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Using API routes instead of direct Firebase calls
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';
import { useSocket } from '@/lib/websocket';
import { apiClient } from '@/lib/api-client';
import { Trip, Request, Match } from '@/types';

export default function MatchesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const toast = useToast();
  const { trips, requests, matches, loading: dataLoading, refreshData } = useData();
  const { socket, connected } = useSocket();
  const [activeTab, setActiveTab] = useState<'potential' | 'my-matches' | 'messages'>('potential');
  const [connectingMatches, setConnectingMatches] = useState<Set<string>>(new Set());
  const [pendingNotifications, setPendingNotifications] = useState<any[]>([]);

  // Data is now handled by DataContext - no need for local fetching

  // WebSocket notification listener
  useEffect(() => {
    if (socket && user && connected) {
      // Join user's notification room
      socket.emit('join', user.uid);
      
      // Listen for match notifications
      socket.on('notification', (notification) => {
        if (notification.type === 'match_request') {
          // Show toast notification
          toast.success(`New connection request from ${notification.fromUserName}!`);
          
          // Add to pending notifications
          setPendingNotifications(prev => [...prev, notification]);
          
          // Refresh matches to show the new match
          fetchMatches();
          
          // Show browser notification if permitted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.body,
              icon: '/icon-192x192.png'
            });
          }
        }
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket, user, connected, toast]);

  // Helper function to fetch matches
  const fetchMatches = useCallback(async () => {
    // Refresh all data from the shared context
    await refreshData();
  }, [refreshData]);

  // Enhanced location matching function
  const getLocationCompatibility = useCallback((location1: string, location2: string): number => {
    const loc1 = location1.toLowerCase().trim();
    const loc2 = location2.toLowerCase().trim();
    
    // Exact match
    if (loc1 === loc2) return 100;
    
    // Extract city and country parts
    const parts1 = loc1.split(',').map(p => p.trim());
    const parts2 = loc2.split(',').map(p => p.trim());
    
    // Check if any part matches (city, country, etc.)
    for (const part1 of parts1) {
      for (const part2 of parts2) {
        if (part1 === part2) return 80;
        if (part1.includes(part2) || part2.includes(part1)) return 60;
      }
    }
    
    // Check for country matches with common variations
    const countryMappings = {
      'united states': ['usa', 'us', 'america'],
      'united kingdom': ['uk', 'england', 'britain', 'scotland', 'wales'],
      'russia': ['russian federation'],
      'south korea': ['korea'],
      'netherlands': ['holland']
    };
    
    for (const [country, variations] of Object.entries(countryMappings)) {
      const allVariations = [country, ...variations];
      const hasCountry1 = allVariations.some(v => loc1.includes(v));
      const hasCountry2 = allVariations.some(v => loc2.includes(v));
      if (hasCountry1 && hasCountry2) return 40;
    }
    
    // Partial text similarity (basic)
    const commonWords = ['airport', 'station', 'terminal', 'port', 'center', 'downtown'];
    let commonWordsCount = 0;
    for (const word of commonWords) {
      if (loc1.includes(word) && loc2.includes(word)) commonWordsCount++;
    }
    if (commonWordsCount > 0) return 20;
    
    return 0;
  }, []);

  // Enhanced compatibility calculation with better location matching
  const calculateCompatibility = useCallback((trip: Trip, request: Request) => {
    // Item type compatibility (essential requirement)
    if (!trip.allowedItems.includes(request.itemType)) {
      return 0;
    }
    
    // Date compatibility (critical requirement)
    if (trip.departureDate > request.deadline) {
      return 0;
    }
    
    let score = 0;
    
    // Enhanced location matching
    const fromCompatibility = getLocationCompatibility(trip.from, request.from);
    const toCompatibility = getLocationCompatibility(trip.to, request.to);
    
    // Location scoring (more flexible)
    score += Math.round(fromCompatibility * 0.4); // 40% weight for origin
    score += Math.round(toCompatibility * 0.4);   // 40% weight for destination
    
    // If no location compatibility at all, still allow some matches for same country/region
    if (score === 0) {
      // Check if at least one location pair has some similarity
      const hasAnySimilarity = fromCompatibility > 0 || toCompatibility > 0;
      if (!hasAnySimilarity) {
        return 0;
      }
      // Give minimum score for having some location overlap
      score = 10;
    }
    
    // Date compatibility scoring
    const timeDiff = Math.abs(trip.departureDate.getTime() - request.deadline.getTime());
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    let dateScore = 0;
    if (daysDiff <= 1) dateScore = 15; // Same day or next day
    else if (daysDiff <= 3) dateScore = 12; // Within 3 days
    else if (daysDiff <= 7) dateScore = 10; // Within a week
    else if (daysDiff <= 14) dateScore = 8; // Within 2 weeks
    else if (daysDiff <= 30) dateScore = 5; // Within a month
    else dateScore = 2; // More than a month but still valid
    
    score += dateScore;
    
    // Item type bonus (already verified above)
    score += 10;
    
    // Reward incentive (small bonus)
    if (request.reward && request.reward.trim()) {
      score += 3;
    }
    
    const finalScore = Math.min(score, 100);
    
    return finalScore;
  }, [getLocationCompatibility]);

  // Get user's own trips and requests
  const userTrips = useMemo(() => 
    trips.filter(trip => trip.userId === user?.uid), 
    [trips, user?.uid]
  );
  
  const userRequests = useMemo(() => 
    requests.filter(request => request.userId === user?.uid), 
    [requests, user?.uid]
  );

  // Get other users' trips and requests
  const otherUsersTrips = useMemo(() => 
    trips.filter(trip => trip.userId !== user?.uid), 
    [trips, user?.uid]
  );
  
  const otherUsersRequests = useMemo(() => 
    requests.filter(request => request.userId !== user?.uid), 
    [requests, user?.uid]
  );

  // Proper matching logic
  const potentialMatches = useMemo(() => {
    if (!user) return [];

    const matches: { 
      type: 'trip-for-request' | 'request-for-trip'; 
      trip: Trip; 
      request: Request; 
      compatibility: number;
      isUserTrip: boolean;
      isUserRequest: boolean;
    }[] = [];
    
    // 1. If user has trips, find delivery requests from other users
    userTrips.forEach(userTrip => {
      otherUsersRequests.forEach(otherRequest => {
        const compatibility = calculateCompatibility(userTrip, otherRequest);
        if (compatibility > 0) {
          matches.push({
            type: 'request-for-trip',
            trip: userTrip,
            request: otherRequest,
            compatibility,
            isUserTrip: true,
            isUserRequest: false
          });
        }
      });
    });

    // 2. If user has requests, find available trips from other users
    userRequests.forEach(userRequest => {
      otherUsersTrips.forEach(otherTrip => {
        const compatibility = calculateCompatibility(otherTrip, userRequest);
        if (compatibility > 0) {
          matches.push({
            type: 'trip-for-request',
            trip: otherTrip,
            request: userRequest,
            compatibility,
            isUserTrip: false,
            isUserRequest: true
          });
        }
      });
    });

    return matches.sort((a, b) => b.compatibility - a.compatibility);
  }, [userTrips, userRequests, otherUsersTrips, otherUsersRequests, calculateCompatibility]);

  // Check if a match already exists between this user and the trip/request
  const isMatchAlreadyCreated = useCallback((tripId: string, requestId: string) => {
    return matches.some(match => 
      match.tripId === tripId && match.requestId === requestId
    );
  }, [matches]);

  const handleCreateMatch = useCallback(async (trip: Trip, request: Request) => {
    if (!user) {
      toast.error('Please log in to send connection requests.');
      return;
    }

    // Check if match already exists
    if (isMatchAlreadyCreated(trip.id, request.id)) {
      toast.info('You have already sent a connection request for this match.');
      return;
    }

    const matchKey = `${trip.id}-${request.id}`;
    
    // Prevent duplicate requests
    if (connectingMatches.has(matchKey)) {
      return;
    }

    setConnectingMatches(prev => new Set(prev).add(matchKey));

    try {
      const payload = {
        tripId: trip.id,
        requestId: request.id,
      };
      
      const response = await apiClient.post('/api/matches', payload);
      
      if (response.ok) {
        const newMatch = await response.json();
        
        // Create chat ID from user IDs (sorted alphabetically for consistency)
        const otherUserId = trip.userId === user.uid ? request.userId : trip.userId;
        const chatId = [user.uid, otherUserId].sort().join('_');
        
        // Show different success messages based on match type
        if (trip.userId === user.uid) {
          // User owns the trip, someone wants them to deliver
          toast.success('🚚 Connection established! Redirecting to messages...');
        } else {
          // User owns the request, they're asking someone to deliver
          toast.success('📨 Request sent! Redirecting to messages...');
        }
        
        // Refresh matches to show updated state
        await fetchMatches();
        
        // Redirect to messages page with the chat
        setTimeout(() => {
          router.push(`/messages?chat=${chatId}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          toast.info('You have already sent a connection request for this match.');
        } else {
          throw new Error(errorData.error || 'Failed to create match');
        }
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to send connection request. Please try again.');
      }
    } finally {
      setConnectingMatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchKey);
        return newSet;
      });
    }
  }, [user, toast, connectingMatches, isMatchAlreadyCreated, fetchMatches]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-slate-600 font-medium">Please log in to view matches.</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto">
            <span className="text-white text-2xl">✈️</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading TravelConnect...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/');
    return null;
  }

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto">
            <span className="text-white text-2xl">🤝</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading matches...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.back()}
              className="mr-4 text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🤝</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Matches</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                connected 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-red-600 bg-red-50'
              }`}>
                {connected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Notifications */}
        {pendingNotifications.length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
              <span>🔔</span>
              <span>New Connection Requests</span>
            </h3>
            {pendingNotifications.map((notification, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 animate-slide-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600">👤</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">{notification.fromUserName}</h4>
                      <p className="text-sm text-blue-700">{notification.body}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {notification.tripRoute} ↔ {notification.requestRoute}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPendingNotifications(prev => prev.filter((_, i) => i !== index));
                      setActiveTab('my-matches');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Match
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mb-8">
          {/* Debug info */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg text-sm">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="font-semibold text-blue-900">Your Trips</div>
                <div className="text-blue-700">{userTrips.length}</div>
              </div>
              <div>
                <div className="font-semibold text-blue-900">Your Requests</div>
                <div className="text-blue-700">{userRequests.length}</div>
              </div>
              <div>
                <div className="font-semibold text-green-900">Available Trips</div>
                <div className="text-green-700">{otherUsersTrips.length}</div>
              </div>
              <div>
                <div className="font-semibold text-green-900">Available Requests</div>
                <div className="text-green-700">{otherUsersRequests.length}</div>
              </div>
              <div>
                <div className="font-semibold text-purple-900">Notifications</div>
                <div className="text-purple-700">{pendingNotifications.length}</div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg max-w-2xl">
            <button
              onClick={() => setActiveTab('potential')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'potential'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              🔍 Find Matches
            </button>
            <button
              onClick={() => setActiveTab('my-matches')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'my-matches'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              📋 My Requests
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'messages'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              💬 Messages
            </button>
          </div>
        </div>

        {activeTab === 'potential' && (
          <div className="space-y-6">
            {potentialMatches.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-slate-500 text-lg mb-4 font-medium">No potential matches found</p>
                <p className="text-slate-400">Try posting a trip or request to find matches</p>
              </div>
            ) : (
              potentialMatches.map((match, index) => {
                const matchKey = `${match.trip.id}-${match.request.id}`;
                const isConnecting = connectingMatches.has(matchKey);
                const alreadyConnected = isMatchAlreadyCreated(match.trip.id, match.request.id);
                
                return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow animate-slide-in">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        {match.compatibility}% Match
                      </span>
                      <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {match.type === 'request-for-trip' 
                          ? '📦 Someone wants you to deliver' 
                          : '✈️ Someone can deliver for you'
                        }
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreateMatch(match.trip, match.request)}
                      disabled={alreadyConnected || isConnecting}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center space-x-2 ${
                        alreadyConnected 
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : isConnecting
                          ? 'bg-purple-400 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
                      }`}
                    >
                      {isConnecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Connecting...</span>
                        </>
                      ) : alreadyConnected ? (
                        <>
                          <span>✅</span>
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <span>💬</span>
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-r border-slate-200 pr-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600">✈️</span>
                          </div>
                          <h3 className="font-semibold text-slate-900">
                            {match.isUserTrip ? 'Your Trip' : 'Available Trip'}
                          </h3>
                        </div>
                        {!match.isUserTrip && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-medium">
                            Other Traveler
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-blue-600 mb-2">
                        {match.trip.from} → {match.trip.to}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            📅 {match.trip.departureDate.toLocaleDateString()} - {match.trip.arrivalDate.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            🎽 {match.trip.capacity}kg capacity
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-slate-600 mb-2 font-medium">Allowed items:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.trip.allowedItems.slice(0, 3).map((item: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {item}
                            </span>
                          ))}
                          {match.trip.allowedItems.length > 3 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                              +{match.trip.allowedItems.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pl-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <span className="text-emerald-600">📦</span>
                          </div>
                          <h3 className="font-semibold text-slate-900">
                            {match.isUserRequest ? 'Your Request' : 'Delivery Request'}
                          </h3>
                        </div>
                        {!match.isUserRequest && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-medium">
                            Needs Delivery
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-emerald-600 mb-2">
                        {match.request.from} → {match.request.to}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            ⏰ {match.request.deadline.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            📊 {match.request.itemType}
                          </span>
                        </div>
                      </div>
                      {match.request.reward && (
                        <div className="mt-3">
                          <p className="text-sm text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg inline-block">
                            💰 {match.request.reward}
                          </p>
                        </div>
                      )}
                      {match.request.description && (
                        <p className="text-sm text-slate-600 mt-3 bg-slate-50 p-2 rounded-lg line-clamp-2 italic">
                          "{match.request.description}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'my-matches' && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🤝</div>
                <p className="text-slate-500 text-lg mb-4 font-medium">No matches yet</p>
                <p className="text-slate-400">Connect with potential matches to see them here</p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow animate-slide-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Match #{match.id.slice(-6)}</h3>
                      <p className="text-sm text-slate-600">
                        Status: <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                          match.status === 'pending' ? 'text-yellow-700 bg-yellow-100' :
                          match.status === 'accepted' ? 'text-emerald-700 bg-emerald-100' :
                          'text-red-700 bg-red-100'
                        }`}>
                          {match.status}
                        </span>
                      </p>
                    </div>
                    <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      {match.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto">
                  <span className="text-white text-2xl">💬</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Messages & Connections</h3>
                <p className="text-slate-600 mb-6">Coordinate with travelers and senders for your deliveries</p>
                
                {matches.filter(match => match.status === 'accepted').length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-slate-500 font-medium">No active conversations yet</p>
                    <p className="text-slate-400 text-sm">When you connect with travelers or accept delivery requests, your conversations will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches
                      .filter(match => match.status === 'accepted')
                      .map((match, index) => (
                        <div key={index} className="bg-slate-50 rounded-lg p-4 text-left">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">
                              Active Delivery #{match.id.slice(-6)}
                            </h4>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                              {match.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            Connected on {match.createdAt.toLocaleDateString()}
                          </p>
                          <button className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium">
                            💬 Open Conversation →
                          </button>
                        </div>
                      ))
                    }
                  </div>
                )}
                
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 How it works</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• When you connect with someone, they'll be notified</p>
                    <p>• Use messages to coordinate pickup/delivery details</p>
                    <p>• Share contact info safely within the app</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}