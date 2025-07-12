'use client';

import { useAuth } from '@/contexts/AuthContext';
import FriendlyLogin from '@/components/Auth/FriendlyLogin';
import HomePage from '@/components/Home/HomePage';
import LocationPermission from '@/components/Common/LocationPermission';
import { BloodConnectLoading } from '@/components/Common/Loading';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <BloodConnectLoading />;
  }

  if (!user) {
    return <FriendlyLogin />;
  }

  return (
    <>
      <HomePage />
      <LocationPermission />
    </>
  );
}
