'use client';

import { useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { Trip } from '@/types';

function TripsList() {
  const router = useRouter();
  const { user } = useAuth();
  const { trips: allTrips, loading } = useData();
  const toast = useToast();

  // Filter trips to only show OTHER users' trips
  const trips = useMemo(() => {
    return allTrips.filter(trip => trip.userId !== user?.uid);
  }, [allTrips, user?.uid]);

  const handleContactTraveler = useCallback((trip: Trip) => {
    if (!user) {
      toast.error('Please log in to contact travelers.');
      router.push('/login');
      return;
    }

    if (trip.userId === user.uid) {
      toast.info('This is your own trip! You cannot contact yourself.');
      return;
    }

    // Navigate to matches page to handle the connection
    router.push('/matches');
    toast.info('Check the "Find Matches" tab to connect with this traveler.');
  }, [user, toast, router]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading trips...</p>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✈️</div>
        <p className="text-slate-500 text-lg mb-4 font-medium">No trips available</p>
        <p className="text-slate-400">Travelers can post their upcoming trips here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow animate-slide-in">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-slate-900 mb-1">
                {trip.from} → {trip.to}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                  📅 {trip.departureDate.toLocaleDateString()} - {trip.arrivalDate.toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Capacity</p>
              <p className="font-semibold text-blue-600 text-lg">{trip.capacity}kg</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-2 font-medium">Allowed items:</p>
            <div className="flex flex-wrap gap-2">
              {trip.allowedItems.map((item, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          
          {trip.description && (
            <p className="text-slate-700 mb-4 bg-slate-50 p-3 rounded-lg italic">
              "{trip.description}"
            </p>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Posted {trip.createdAt.toLocaleDateString()}
            </span>
            <button 
              onClick={() => handleContactTraveler(trip)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center space-x-2"
            >
              <span>💬</span>
              <span>Contact Traveler</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(TripsList);