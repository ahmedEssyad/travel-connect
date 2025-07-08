'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types';

export default function TripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        departureDate: doc.data().departureDate?.toDate() || new Date(),
        arrivalDate: doc.data().arrivalDate?.toDate() || new Date(),
      })) as Trip[];
      
      setTrips(tripsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading trips...</p>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">No trips available</p>
        <p className="text-gray-400">Travelers can post their upcoming trips here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div key={trip.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {trip.from} → {trip.to}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {trip.departureDate.toLocaleDateString()} - {trip.arrivalDate.toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Capacity</p>
              <p className="font-medium">{trip.capacity}kg</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Allowed items:</p>
            <div className="flex flex-wrap gap-2">
              {trip.allowedItems.map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          
          {trip.description && (
            <p className="text-gray-700 mb-4">{trip.description}</p>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Posted {trip.createdAt.toLocaleDateString()}
            </span>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              Contact Traveler
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}