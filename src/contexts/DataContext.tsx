'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/api-client';
import { Trip, Request, Match } from '@/types';

interface DataContextType {
  trips: Trip[];
  requests: Request[];
  matches: Match[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [tripsResponse, requestsResponse, matchesResponse] = await Promise.all([
        apiClient.get('/api/trips'),
        apiClient.get('/api/requests'),
        apiClient.get('/api/matches')
      ]);

      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json();
        const formattedTrips = tripsData.map((trip: any) => ({
          ...trip,
          id: trip._id,
          createdAt: new Date(trip.createdAt),
          departureDate: new Date(trip.departureDate),
          arrivalDate: new Date(trip.arrivalDate),
        }));
        setTrips(formattedTrips);
      }

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        const formattedRequests = requestsData.map((request: any) => ({
          ...request,
          id: request._id,
          createdAt: new Date(request.createdAt),
          deadline: new Date(request.deadline),
        }));
        setRequests(formattedRequests);
      }

      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        const userMatches = matchesData.map((match: any) => ({
          ...match,
          id: match._id,
          createdAt: new Date(match.createdAt),
        }));
        setMatches(userMatches);
        console.log('User matches loaded:', userMatches);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      
      // Set up polling for real-time updates (every 2 minutes instead of aggressive polling)
      const interval = setInterval(fetchData, 120000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const value = {
    trips,
    requests,
    matches,
    loading,
    refreshData: fetchData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};