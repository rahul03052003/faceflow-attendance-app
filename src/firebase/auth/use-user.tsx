
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
        // Handle users in Auth but not Firestore, like the special admin.
        if (authUser.email === 'admin@example.com') {
          setAppUser({
            id: authUser.uid,
            email: authUser.email,
            name: 'Admin',
            role: 'Admin',
            registerNo: 'N/A',
            avatar: '',
          });
        } else {
          setAppUser(null);
        }
      }
      setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch user profile:", error);
        setAppUser(null);
        setIsLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [authUser, firestore, isLoading]);

  const user = useMemo(() => {
    if (!authUser) return null;
    
    const isAdminByEmail = authUser.email === 'admin@example.com';
    
    const mergedUser: EnrichedUser = {
      ...authUser,
      ...appUser,
      id: authUser.uid,
      // Ensure the role is correctly assigned, prioritizing the Firestore doc but falling back to email check.
      role: isAdminByEmail ? 'Admin' : appUser?.role || 'Teacher',
    };

    return mergedUser;

  }, [authUser, appUser]);


  return { user, isLoading };
}
