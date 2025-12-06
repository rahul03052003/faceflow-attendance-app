
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
    };

    // Special handling for the hardcoded admin user. We can identify them by email
    // without needing a Firestore document lookup.
    if (authUser.email === 'admin@gmail.com') {
        const adminUser: AppUser = {
            id: authUser.uid,
            email: authUser.email,
            name: 'Admin',
            role: 'Admin',
            registerNo: 'N/A',
            avatar: '',
        };
        setAppUser(adminUser);
        setIsLoading(false);
        return;
    }

    // For all other users, fetch their profile from Firestore.
    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const firestoreData = doc.data() as Omit<AppUser, 'id'>;
        setAppUser({ id: doc.id, ...firestoreData });
      } else {
        // If a user is authenticated but has no document, they are likely a new user.
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
    
    // If we have an appUser (from Firestore or the special admin case), merge it.
    if (appUser) {
        return {
            ...authUser,
            ...appUser,
            id: authUser.uid, // Ensure ID from auth is canonical
            role: appUser.role, // Prioritize role from our app data
        } as EnrichedUser;
    }

    // Fallback for an authenticated user that exists but doesn't have a Firestore doc yet.
    // This could happen during sign-up before the user document is created.
    return {
        ...authUser,
        id: authUser.uid,
        name: authUser.displayName || 'New User',
        email: authUser.email || '',
        role: 'Teacher', // Default role for users without a profile document
        registerNo: '',
        avatar: authUser.photoURL || '',
    } as EnrichedUser;

  }, [authUser, appUser]);


  return { user, isLoading };
}
