'use client';
import { useState, useEffect } from 'react';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

interface FirebaseInstances {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Singleton to ensure we only initialize once
let firebaseInstances: FirebaseInstances | null = null;

function initializeFirebaseInstances(): FirebaseInstances {
  if (!firebaseInstances) {
    const firebaseApp = initializeApp(firebaseConfig);
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);
    firebaseInstances = { firebaseApp, firestore, auth };
  }
  return firebaseInstances;
}

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize on the client. This is safe to call multiple times
  // because our function handles the singleton logic.
  const instances = initializeFirebaseInstances();

  // We can now render the provider immediately with the guaranteed instances.
  return (
    <FirebaseProvider
      firebaseApp={instances.firebaseApp}
      firestore={instances.firestore}
      auth={instances.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
