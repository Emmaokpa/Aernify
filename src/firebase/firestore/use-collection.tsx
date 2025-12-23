
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
    // **THE FIX**: If the query is not ready, do not proceed.
    // This prevents sending an invalid request to Firestore.
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
        // Fallback path in case internal properties are not available
        const path = (memoizedTargetRefOrQuery as any)?.path || 'unknown path';

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        // Although we now know it's a code issue, this logging is still valuable.
        if (err.code === 'permission-denied') {
            console.group('🔥 Firestore Security Error');
            console.error(`A Firestore query was denied. This can be a security rule mismatch or an invalid query (e.g., querying for a user that isn't loaded yet).`);
            console.error(`Firebase Error Code: ${err.code}`);
            console.groupEnd();
        }

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );
    return () => unsubscribe();

  }, [memoizedTargetRefOrQuery]);
  
  return { data, isLoading, error };
}
