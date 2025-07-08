'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Trip, Request, Match } from '@/types';

export default function MatchesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'potential' | 'my-matches'>('potential');

  useEffect(() => {
    if (!user) return;

    const tripsQuery = query(collection(db, 'trips'), where('userId', '!=', user.uid));
    const requestsQuery = query(collection(db, 'requests'), where('userId', '!=', user.uid));
    const matchesQuery = query(collection(db, 'matches'), where('userId', '==', user.uid));

    const unsubscribeTrips = onSnapshot(tripsQuery, (snapshot) => {
      const tripsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        departureDate: doc.data().departureDate?.toDate() || new Date(),
        arrivalDate: doc.data().arrivalDate?.toDate() || new Date(),
      })) as Trip[];
      setTrips(tripsData);
    });

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        deadline: doc.data().deadline?.toDate() || new Date(),
      })) as Request[];
      setRequests(requestsData);
    });

    const unsubscribeMatches = onSnapshot(matchesQuery, (snapshot) => {
      const matchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Match[];
      setMatches(matchesData);
      setLoading(false);
    });

    return () => {
      unsubscribeTrips();
      unsubscribeRequests();
      unsubscribeMatches();
    };
  }, [user]);

  const findPotentialMatches = () => {
    const potentialMatches: { type: string; trip: Trip; request: Request; compatibility: number }[] = [];
    
    trips.forEach(trip => {
      requests.forEach(request => {
        if (
          trip.from.toLowerCase().includes(request.from.toLowerCase()) &&
          trip.to.toLowerCase().includes(request.to.toLowerCase()) &&
          trip.departureDate <= request.deadline &&
          trip.allowedItems.includes(request.itemType)
        ) {
          potentialMatches.push({
            type: 'trip-request',
            trip,
            request,
            compatibility: calculateCompatibility(trip, request)
          });
        }
      });
    });

    return potentialMatches.sort((a, b) => b.compatibility - a.compatibility);
  };

  const calculateCompatibility = (trip: Trip, request: Request) => {
    let score = 0;
    
    if (trip.from.toLowerCase() === request.from.toLowerCase()) score += 50;
    if (trip.to.toLowerCase() === request.to.toLowerCase()) score += 50;
    
    const timeDiff = Math.abs(trip.departureDate.getTime() - request.deadline.getTime());
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    if (daysDiff <= 7) score += 30;
    else if (daysDiff <= 14) score += 20;
    else if (daysDiff <= 30) score += 10;
    
    if (trip.allowedItems.includes(request.itemType)) score += 20;
    
    return score;
  };

  const handleCreateMatch = async (trip: Trip, request: Request) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'matches'), {
        tripId: trip.id,
        requestId: request.id,
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      alert('Match request sent!');
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  if (!user) {
    return <div>Please log in to view matches.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  const potentialMatches = findPotentialMatches();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Matches</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md">
            <button
              onClick={() => setActiveTab('potential')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'potential'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Potential Matches
            </button>
            <button
              onClick={() => setActiveTab('my-matches')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'my-matches'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              My Matches
            </button>
          </div>
        </div>

        {activeTab === 'potential' && (
          <div className="space-y-6">
            {potentialMatches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No potential matches found</p>
                <p className="text-gray-400">Try posting a trip or request to find matches</p>
              </div>
            ) : (
              potentialMatches.map((match, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-600">
                        {match.compatibility}% Match
                      </span>
                    </div>
                    <button
                      onClick={() => handleCreateMatch(match.trip, match.request)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-r border-gray-200 pr-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Trip</h3>
                      <p className="text-lg font-medium text-blue-600">
                        {match.trip.from} → {match.trip.to}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {match.trip.departureDate.toLocaleDateString()} - {match.trip.arrivalDate.toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Capacity: {match.trip.capacity}kg
                      </p>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Allowed items:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {match.trip.allowedItems.slice(0, 3).map((item: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {item}
                            </span>
                          ))}
                          {match.trip.allowedItems.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{match.trip.allowedItems.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pl-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Request</h3>
                      <p className="text-lg font-medium text-green-600">
                        {match.request.from} → {match.request.to}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Deadline: {match.request.deadline.toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Item: {match.request.itemType}
                      </p>
                      {match.request.reward && (
                        <p className="text-sm text-green-600 mt-1">
                          Reward: {match.request.reward}
                        </p>
                      )}
                      {match.request.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {match.request.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'my-matches' && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No matches yet</p>
                <p className="text-gray-400">Connect with potential matches to see them here</p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Match #{match.id.slice(-6)}</h3>
                      <p className="text-sm text-gray-600">
                        Status: <span className={`font-medium ${
                          match.status === 'pending' ? 'text-yellow-600' :
                          match.status === 'accepted' ? 'text-green-600' :
                          'text-red-600'
                        }`}>
                          {match.status}
                        </span>
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {match.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}