'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { login, register, user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  // Redirect authenticated users
  useEffect(() => {
    if (user && !isRedirecting) {
      setIsRedirecting(true);
      setSuccess('Welcome back! Redirecting to your dashboard...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  }, [user, router, isRedirecting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Client-side validation
      if (!email.trim()) {
        throw new Error('Email address is required.');
      }
      if (!password.trim()) {
        throw new Error('Password is required.');
      }
      if (!isLogin && name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long.');
      }

      if (isLogin) {
        await login(email.trim(), password);
        setSuccess('Sign in successful! Redirecting...');
        toast.success('Welcome back!');
      } else {
        await register(email.trim(), password, name.trim());
        setSuccess('Account created successfully! Redirecting...');
        toast.success('Welcome to TravelConnect! Your account has been created.');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      const errorMessage = error.message || 'Authentication failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="max-w-md w-full space-y-8 animate-slide-in">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
            <span className="text-2xl text-white">✈️</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Welcome to TravelConnect
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isLogin 
              ? 'Sign in to connect with travelers worldwide' 
              : 'Join our community of travelers and senders'
            }
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-slate-200" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all duration-200 hover:border-slate-400"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email-address" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all duration-200 hover:border-slate-400"
                placeholder="Enter your email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all duration-200 hover:border-slate-400"
                placeholder={isLogin ? "Enter your password" : "Choose a strong password"}
                minLength={6}
              />
              {!isLogin && (
                <p className="mt-1 text-xs text-slate-500">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-slide-in">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 animate-slide-in">
              <div className="flex items-center">
                <span className="text-emerald-500 mr-2">✅</span>
                <p className="text-sm text-emerald-700 font-medium">{success}</p>
              </div>
            </div>
          )}

          {isRedirecting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-slide-in">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
                <p className="text-sm text-blue-700 font-medium">Redirecting to your dashboard...</p>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || isRedirecting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading || isRedirecting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isRedirecting ? 'Redirecting...' : 
                   isLogin ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                <span className="flex items-center">
                  {isLogin ? (
                    <>
                      <span className="mr-2">🔐</span>
                      Sign In
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Create Account
                    </>
                  )}
                </span>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setEmail('');
                setPassword('');
                setName('');
              }}
              className="text-sm text-blue-600 hover:text-blue-500 font-semibold transition-colors"
            >
              {isLogin 
                ? "Don't have an account? Sign up here" 
                : 'Already have an account? Sign in here'
              }
            </button>
          </div>
        </form>

        {/* Features */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center">
            Why TravelConnect?
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600">🌍</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Global Network</p>
                <p className="text-xs text-slate-500">Connect with travelers worldwide</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">🔒</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Secure & Trusted</p>
                <p className="text-xs text-slate-500">User ratings and verification system</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">💰</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">100% Free</p>
                <p className="text-xs text-slate-500">No fees, just helping each other</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}