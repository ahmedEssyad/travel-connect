'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Request } from '@/types';

export default function RequestsList() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        deadline: doc.data().deadline?.toDate() || new Date(),
      })) as Request[];
      
      setRequests(requestsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">No delivery requests</p>
        <p className="text-gray-400">People can post items they need delivered here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {request.from} → {request.to}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Deadline: {request.deadline.toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Item Type</p>
              <p className="font-medium">{request.itemType}</p>
            </div>
          </div>
          
          {request.description && (
            <p className="text-gray-700 mb-4">{request.description}</p>
          )}
          
          {request.reward && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Reward offered:</p>
              <p className="text-green-600 font-medium">{request.reward}</p>
            </div>
          )}
          
          {request.photo && (
            <div className="mb-4">
              <img
                src={request.photo}
                alt="Item photo"
                className="w-full max-w-xs rounded-md"
              />
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Posted {request.createdAt.toLocaleDateString()}
            </span>
            <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
              Offer to Deliver
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}