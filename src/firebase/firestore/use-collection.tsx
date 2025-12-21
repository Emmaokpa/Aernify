'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * * IMPORTANT: You must memoize the `memoizedTargetRefOrQuery` using `useMemo` 
 * in the calling component to prevent infinite re-renders.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // GATE 1: Wait if no query is provided yet
    if (!memoizedTargetRefOrQuery) {
      setIsLoading(false);
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        // GATE 2: Robust Path Extraction
        // This handles both direct CollectionReferences and filtered Queries
        let path = "unknown path";
        try {
          if (memoizedTargetRefOrQuery.type === 'collection') {
            path = (memoizedTargetRefOrQuery as CollectionReference).path;
          } else {
            // Accessing internal path for Queries in Firebase v10/v11
            const internalQuery = memoizedTargetRefOrQuery as any;
            path = internalQuery._query?.path?.canonicalString() || 
                   internalQuery.endpoint?.path || 
                   "filtered-query";
          }
        } catch (e) {
          path = "error-extracting-path";
        }

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });
        
        // Detailed Logging for Debugging
        if (err.code === 'permission-denied') {
          const auth = getAuth();
          console.group('🔥 Firestore Security Error');
          console.error(`Path: ${path}`);
          console.error(`User UID: ${auth.currentUser?.uid || 'Not Logged In'}`);
          console.error(`Firebase Error Code: ${err.code}`);
          console.groupEnd();
        }

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);
  
  return { data, isLoading, error };
}
