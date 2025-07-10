'use client';

import { useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { Request } from '@/types';

function RequestsList() {
  const router = useRouter();
  const { user } = useAuth();
  const { requests: allRequests, loading } = useData();
  const toast = useToast();

  // Filter requests to only show OTHER users' requests
  const requests = useMemo(() => {
    return allRequests.filter(request => request.userId !== user?.uid);
  }, [allRequests, user?.uid]);

  const handleOfferToDeliver = useCallback((request: Request) => {
    if (!user) {
      toast.error('Please log in to offer delivery services.');
      router.push('/login');
      return;
    }

    if (request.userId === user.uid) {
      toast.info('This is your own request! You cannot deliver for yourself.');
      return;
    }

    // Navigate to matches page to handle the connection
    router.push('/matches');
    toast.info('Check the "Find Matches" tab to connect with this request.');
  }, [user, toast, router]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📦</div>
        <p className="text-slate-500 text-lg mb-4 font-medium">No delivery requests</p>
        <p className="text-slate-400">People can post items they need delivered here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow animate-slide-in">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-slate-900 mb-1">
                {request.from} → {request.to}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                  ⏰ Deadline: {request.deadline.toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Item Type</p>
              <p className="font-semibold text-purple-600 text-lg">{request.itemType}</p>
            </div>
          </div>
          
          {request.description && (
            <p className="text-slate-700 mb-4 bg-slate-50 p-3 rounded-lg italic">
              "{request.description}"
            </p>
          )}
          
          {request.reward && (
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-1 font-medium">Reward offered:</p>
              <p className="text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-lg inline-block">
                💰 {request.reward}
              </p>
            </div>
          )}
          
          {request.photo && (
            <div className="mb-4">
              <img
                src={request.photo}
                alt="Item photo"
                className="w-full max-w-xs rounded-lg shadow-sm border border-slate-200"
              />
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Posted {request.createdAt.toLocaleDateString()}
            </span>
            <button 
              onClick={() => handleOfferToDeliver(request)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center space-x-2"
            >
              <span>🚚</span>
              <span>Offer to Deliver</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(RequestsList);