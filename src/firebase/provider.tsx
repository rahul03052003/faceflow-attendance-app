'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

// This is a singleton to ensure we only initialize Firebase once.
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

if (typeof window !== 'undefined' && !firebaseApp) {
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
}

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(!!firebaseApp);

  useEffect(() => {
    // This effect handles the case where the script might run after the initial render.
    if (!isInitialized) {
      if (!firebaseApp) {
          firebaseApp = initializeApp(firebaseConfig);
          auth = getAuth(firebaseApp);
          firestore = getFirestore(firebaseApp);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // We don't render children until we are certain Firebase is initialized.
  // This prevents any child component from accessing a null instance.
  if (!isInitialized) {
    return null; 
  }

  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useFirestore = () => useFirebase().firestore;
export const useAuth = () => useFirebase().auth;
