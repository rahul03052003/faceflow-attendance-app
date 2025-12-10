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
    
    // This is the combined user object we will return
    const mergedUser: EnrichedUser = {
      ...authUser,
      // Spread appUser (from Firestore) first, so its properties can be overridden
      ...(appUser || {}), 
      id: authUser.uid,
      // Explicitly set the role: if it's the admin email, role is 'Admin'.
      // Otherwise, use the role from Firestore, or default to 'Teacher' if no doc exists.
      role: isAdminByEmail ? 'Admin' : (appUser?.role || 'Teacher'),
      // Ensure email from auth is authoritative
      email: authUser.email!,
    };

    // If it's the admin and there's no firestore doc, fill in some defaults
    if (isAdminByEmail && !appUser) {
        mergedUser.name = mergedUser.name || 'Admin';
        mergedUser.registerNo = mergedUser.registerNo || 'N/A';
        mergedUser.avatar = mergedUser.avatar || '';
    }

    return mergedUser;

  }, [authUser, appUser]);


  return { user, isLoading };
}
