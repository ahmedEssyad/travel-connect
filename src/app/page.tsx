'use client';

import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/Auth/LoginForm';
import HomePage from '@/components/Home/HomePage';
import { TravelConnectLoading } from '@/components/Common/Loading';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <TravelConnectLoading />;
  }

  if (!user) {
    return <LoginForm />;
  }

  return <HomePage />;
}
