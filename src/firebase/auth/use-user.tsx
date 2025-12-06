
'use client';
import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { useAuth, useFirestore } from '../provider';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';

type EnrichedUser = AuthUser & AppUser;

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsLoading(true);
      if (user) {
        setAuthUser(user);
      } else {
        setAuthUser(null);
        setAppUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!authUser?.uid) {
      setIsLoading(false);
      return;
    }
    
    // For all users (including admin), fetch their profile from Firestore.
    // The role will be determined in the final useMemo.
    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const firestoreData = doc.data() as Omit<AppUser, 'id'>;
        setAppUser({ id: doc.id, ...firestoreData });
      } else {
        // This handles users in Auth but not Firestore, like the admin on first login
        // or a user mid-signup. `appUser` remains null.
        setAppUser(null);
      }
      setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch user profile:", error);
        setAppUser(null);
        setIsLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [authUser, firestore]);

  const user = useMemo(() => {
    if (!authUser) return null;

    // Special case: Determine if the user is the hardcoded admin by email.
    const isAdminByEmail = authUser.email === 'admin@gmail.com';
    
    // Start with the base authenticated user.
    const baseUser = { ...authUser, id: authUser.uid };

    if (isAdminByEmail) {
      // If it's the admin, create the complete user object immediately.
      // This bypasses the need for a Firestore document for the admin's role.
      return {
        ...baseUser,
        ...appUser, // Merge any existing firestore data (like name if set)
        role: 'Admin' as const,
        name: appUser?.name || 'Admin',
        email: authUser.email,
        registerNo: appUser?.registerNo || 'N/A',
        avatar: appUser?.avatar || '',
      } as EnrichedUser;
    }

    if (appUser) {
        // For regular, non-admin users with a Firestore document.
        return {
            ...baseUser,
            ...appUser,
        } as EnrichedUser;
    }
    
    // Fallback for a regular user who is authenticated but doesn't have a Firestore doc yet.
    return {
        ...baseUser,
        name: authUser.displayName || 'New User',
        email: authUser.email || '',
        role: 'Teacher' as const, // Default role
        registerNo: '',
        avatar: authUser.photoURL || '',
    } as EnrichedUser;

  }, [authUser, appUser]);


  return { user, isLoading };
}
