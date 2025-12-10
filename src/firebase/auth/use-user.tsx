
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
    
    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const firestoreData = doc.data() as Omit<AppUser, 'id'>;
        setAppUser({ id: doc.id, ...firestoreData });
      } else {
        // If the user document doesn't exist in Firestore, we still proceed
        // but with appUser as null. The useMemo below will handle this case.
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

    const isAdminByEmail = authUser.email === 'admin@gmail.com';
    
    // This is the combined user object we will return.
    // It starts with the core authentication data.
    const mergedUser: EnrichedUser = {
      ...authUser,
      // We spread the Firestore data. If appUser is null, this does nothing.
      ...(appUser || {}), 
      // Ensure the ID from Auth is always the source of truth.
      id: authUser.uid,
      // This is the crucial part. Determine the role.
      role: isAdminByEmail ? 'Admin' : (appUser?.role || 'Teacher'),
      // Ensure email from auth is authoritative.
      email: authUser.email!,
      // Provide fallback defaults for users who might only exist in Auth.
      name: appUser?.name || authUser.displayName || authUser.email?.split('@')[0] || 'User',
      avatar: appUser?.avatar || authUser.photoURL || '',
      registerNo: appUser?.registerNo || 'N/A',
    };

    return mergedUser;

  }, [authUser, appUser]);


  return { user, isLoading };
}
