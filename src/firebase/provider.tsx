
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

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [services, setServices] = useState<{
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    setServices({ firebaseApp: app, firestore, auth });
  }, []);

  // We wait until the services are initialized on the client to render the children.
  // This prevents hydration errors and ensures Firebase is ready.
  if (!services) {
    return null; 
  }

  return (
    <FirebaseContext.Provider value={services}>
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
    return context.firebaseApp;
}
export const useFirestore = () => {
    const context = useFirebase();
    return context.firestore;
};
export const useAuth = () => {
    const context = useFirebase();
    return context.auth;
};

    