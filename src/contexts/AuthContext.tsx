'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from '@/types';
import { authenticatedFetch } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserInDatabase = async (firebaseUser: FirebaseUser) => {
    try {
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        rating: 5,
      };
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        const newUser = await response.json();
        setUser({
          ...newUser,
          createdAt: new Date(newUser.createdAt),
          updatedAt: new Date(newUser.updatedAt),
        });
      } else {
        throw new Error('Failed to create user in database');
      }
    } catch (error) {
      console.error('Error creating user in database:', error);
      // Fall back to Firebase user data
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const response = await authenticatedFetch(`/api/users?uid=${firebaseUser.uid}`);
          if (response.ok) {
            const userData = await response.json();
            setUser({
              ...userData,
              createdAt: new Date(userData.createdAt),
              updatedAt: new Date(userData.updatedAt),
            });
          } else if (response.status === 404) {
            // User doesn't exist in database, create them
            await createUserInDatabase(firebaseUser);
          } else {
            throw new Error(`API returned ${response.status}`);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // If we can't fetch user data, we still have the Firebase user
          // Set basic user info from Firebase
          // Using Firebase user data as fallback
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            rating: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // Convert Firebase errors to user-friendly messages
      const errorMessage = getFirebaseErrorMessage(error.code);
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userData = {
        uid: userCredential.user.uid,
        email,
        name,
        rating: 5,
      };
      
      // Save user to MongoDB
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user profile. Please try again.');
      }
    } catch (error: any) {
      // Handle Firebase auth errors and custom errors
      if (error.code) {
        const errorMessage = getFirebaseErrorMessage(error.code);
        throw new Error(errorMessage);
      }
      throw error; // Re-throw custom errors as-is
    }
  };

  // Helper function to convert Firebase error codes to user-friendly messages
  const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check your email or create a new account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please check your password and try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead or use a different email.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password with at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support for assistance.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later or reset your password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/requires-recent-login':
        return 'This operation requires recent authentication. Please sign in again.';
      default:
        return 'Authentication failed. Please try again or contact support if the problem persists.';
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};