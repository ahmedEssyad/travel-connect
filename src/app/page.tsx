'use client';

import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/components/Landing/LandingPage';
import HomePage from '@/components/Home/HomePage';
import LocationPermission from '@/components/Common/LocationPermission';
import { MunqidhLoading } from '@/components/Common/Loading';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <MunqidhLoading />;
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <>
      <HomePage />
      <LocationPermission />
    </>
  );
}
