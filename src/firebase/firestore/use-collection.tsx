
'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

interface UseCollectionOptions {
  buildQuery?: (ref: CollectionReference<DocumentData>) => Query<DocumentData>;
}

export function useCollection<T = any>(
  collectionName: string | null,
  options?: UseCollectionOptions
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const collectionRef = useMemo(() => {
    if (!collectionName) return null;
    return collection(firestore, collectionName);
  }, [firestore, collectionName]);

  const buildQuery = options?.buildQuery;

  useEffect(() => {
    if (!collectionRef) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const q = buildQuery
      ? buildQuery(collectionRef)
      : query(collectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const result: T[] = [];
        snapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error(`Error fetching collection ${collectionRef.path}:`, err);
        // Ensure all errors are treated as potential permission errors for debugging.
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setIsLoading(false);
        setData(null);
      }
    );

    return () => unsubscribe();
  }, [collectionRef, buildQuery]);

  return { data, isLoading, error };
}
