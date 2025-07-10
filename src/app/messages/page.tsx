'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useSocket } from '@/lib/websocket';
import { apiClient } from '@/lib/api-client';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { socket, connected, error } = useSocket();
  const [chats, setChats] = useState<any[]>([]);
  const { matches } = useData();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load active chats from matches
  useEffect(() => {
    if (user && matches.length > 0) {
      console.log('Processing matches for chats:', matches);
      
      const activeChats = matches
        .filter(match => match.status === 'accepted')
        .map((match, index) => {
          console.log('Processing match:', match);
          
          // Use the otherUserId field from the API response
          const otherUserId = match.otherUserId;
          
          if (otherUserId && otherUserId !== user.uid) {
            const chatId = [user.uid, otherUserId].sort().join('_');
            
            // Get trip and request details for display
            const tripInfo = match.trip ? `${match.trip.from} → ${match.trip.to}` : 'Trip';
            const requestInfo = match.request ? `${match.request.from} → ${match.request.to}` : 'Request';
            
            return {
              id: `${chatId}_${match.id}`, // Use match ID to ensure uniqueness
              chatId: chatId, // Keep original chat ID for API calls
              matchId: match.id,
              otherUserId,
              lastActivity: match.createdAt,
              status: match.status,
              tripInfo,
              requestInfo
            };
          }
          return null;
        })
        .filter(Boolean);
      
      // Remove duplicates by chatId (keep the most recent)
      const uniqueChats = activeChats.reduce((acc, chat) => {
        const existing = acc.find(c => c.chatId === chat.chatId);
        if (!existing || new Date(chat.lastActivity) > new Date(existing.lastActivity)) {
          return acc.filter(c => c.chatId !== chat.chatId).concat(chat);
        }
        return acc;
      }, [] as any[]);
      
      setChats(uniqueChats);
      console.log('Active chats loaded:', uniqueChats);
    }
  }, [user, matches]);

  // Handle chat parameter from URL
  useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam && user) {
      console.log('Setting selected chat from URL:', chatParam);
      setSelectedChat(chatParam);
      loadMessages(chatParam);
    }
  }, [searchParams, user]);

  const loadMessages = async (chatId: string) => {
    if (!user) {
      console.log('Cannot load messages: no user');
      return;
    }
    
    console.log('Loading messages for chat:', chatId);
    setLoadingMessages(true);
    try {
      const response = await apiClient.get(`/api/messages?chatId=${chatId}`);
      console.log('Messages API response status:', response.status);
      
      if (response.ok) {
        const messagesData = await response.json();
        console.log('Loaded messages:', messagesData);
        setMessages(messagesData);
      } else {
        const errorText = await response.text();
        console.error('Failed to load messages:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Join user room for notifications
  useEffect(() => {
    console.log('Join effect triggered:', { 
      hasSocket: !!socket, 
      hasUser: !!user, 
      connected, 
      userId: user?.uid 
    });
    
    if (socket && user && connected) {
      console.log('Attempting to join room for user:', user.uid);
      socket.emit('join', user.uid);
    }
  }, [socket, user, connected]);

  useEffect(() => {
    if (socket && selectedChat && connected) {
      socket.emit('joinChat', selectedChat);
      
      socket.on('message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socket.off('message');
        socket.emit('leaveChat', selectedChat);
      };
    }
  }, [socket, selectedChat, connected]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChat || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const messageData = {
        chatId: selectedChat,
        senderId: user.uid,
        text: newMessage,
        timestamp: new Date(),
      };

      // Save to database
      const response = await apiClient.post('/api/messages', messageData);

      if (response.ok && socket && connected) {
        // Send via WebSocket for real-time delivery
        socket.emit('message', { chatId: selectedChat, message: messageData });
        setMessages(prev => [...prev, messageData]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

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

  if (loadingMessages) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💬</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Messages</h1>
            </div>
            <div className="ml-auto">
              {connected ? (
                <span className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">● Connected</span>
              ) : error ? (
                <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">● Error</span>
              ) : (
                <span className="text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full font-medium">● Connecting...</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">⚠️</span>
              <div>
                <h3 className="text-red-800 font-medium">Connection Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <p className="text-red-600 text-xs mt-1">Make sure the WebSocket server is running on port 3001</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug info */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium mb-2">🐛 Debug Info</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Total matches: {matches.length}</p>
            <p>• Accepted matches: {matches.filter(m => m.status === 'accepted').length}</p>
            <p>• Active chats: {chats.length}</p>
            <p>• Selected chat: {selectedChat || 'none'}</p>
            <p>• Messages loaded: {messages.length}</p>
            <p>• WebSocket: {connected ? '✅ Connected' : '❌ Disconnected'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* Chat List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900 flex items-center space-x-2">
                <span>💬</span>
                <span>Conversations</span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chats.length > 0 ? (
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setSelectedChat(chat.chatId);
                        loadMessages(chat.chatId);
                      }}
                      className={`p-3 cursor-pointer hover:bg-slate-50 border-l-4 transition-colors ${
                        selectedChat === chat.chatId
                          ? 'bg-blue-50 border-blue-500'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="text-sm font-medium text-slate-900">
                        Travel Connection
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Trip: {chat.tripInfo}
                      </div>
                      <div className="text-xs text-slate-600">
                        Request: {chat.requestInfo}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Connected: {new Date(chat.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedChat ? (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-blue-900">
                    Active Chat
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    Chat ID: {selectedChat}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {messages.length} messages loaded
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500">
                  <span className="text-2xl block mb-2">💬</span>
                  <p className="text-sm">No active conversations</p>
                  <p className="text-xs mt-1">Connect with travelers to start messaging</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">Travel Coordination</h3>
                      <p className="text-sm text-slate-600">
                        Chat about your delivery and travel details
                      </p>
                    </div>
                    <div className="text-xs text-slate-500">
                      {connected ? '🟢 Online' : '🔴 Offline'}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="text-4xl block mb-3">👋</span>
                      <h4 className="font-medium text-slate-900 mb-2">Start the conversation!</h4>
                      <p className="text-sm text-slate-600 mb-4">
                        Coordinate pickup details, delivery instructions, and stay in touch.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        💡 <strong>Tips:</strong> Share your contact details, agree on pickup time, and discuss any special instructions for the delivery.
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            message.senderId === user.uid
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === user.uid ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-200">
                  <form onSubmit={sendMessage} className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={sendingMessage || !connected}
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim() || !connected}
                      className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingMessage ? '...' : 'Send'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl block mb-4">💬</span>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a conversation</h3>
                  <p className="text-slate-600">
                    Choose a chat from the left to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}