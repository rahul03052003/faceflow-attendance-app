'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseContextType {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

// This is a singleton to ensure we only initialize Firebase once.
let firebaseApp: FirebaseApp;
if (typeof window !== 'undefined') {
    firebaseApp = initializeApp(firebaseConfig);
}

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !firebaseApp) {
    return null; 
  }

  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

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

export const useFirebaseApp = () => {
    const context = useFirebase();
    if (!context.firebaseApp) {
        throw new Error('Firebase App not initialized. Make sure you are using the FirebaseProvider.');
    }
    return context.firebaseApp;
}
export const useFirestore = () => {
    const context = useFirebase();
    if (!context.firestore) {
        throw new Error('Firestore not initialized. Make sure you are using the FirebaseProvider.');
    }
    return context.firestore;
};
export const useAuth = () => {
    const context = useFirebase();
    if (!context.auth) {
        throw new Error('Firebase Auth not initialized. Make sure you are using the FirebaseProvider.');
    }
    return context.auth;
};
