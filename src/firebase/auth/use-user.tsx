
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
        // If there's no authenticated user, we stop loading and clear any user data.
        if(!isLoading) setIsLoading(true);
        setAppUser(null);
        setIsLoading(false);
        return;
    };

    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const firestoreData = doc.data() as Omit<AppUser, 'id'>;
        setAppUser({ id: doc.id, ...firestoreData });
      } else {
        // This case handles a user that exists in Firebase Auth but NOT in the 'users'
        // collection in Firestore. This could be an admin user or a user in the process of creation.
        // We will treat them as a user without a specific role for now.
        setAppUser(null);
      }
      setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch user profile:", error);
        setAppUser(null); // Clear app user data on error
        setIsLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [authUser, firestore, isLoading]);

  const user = useMemo(() => {
    if (!authUser) return null;
    
    // The final user object merges data from Firebase Auth (like uid, email)
    // with our application-specific data from Firestore (like role, name).
    // The role from the Firestore document is the source of truth for the app's UI and logic.
    const mergedUser: EnrichedUser = {
      ...authUser,
      ...appUser, // Firestore data (including role) overrides any auth data if keys conflict
      id: authUser.uid, // Ensure the canonical ID from Auth is used
      role: appUser?.role || 'Teacher', // Default to 'Teacher' if no profile exists, can be adjusted.
    };

    return mergedUser;

  }, [authUser, appUser]);


  return { user, isLoading };
}
