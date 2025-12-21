
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

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export function useCollection<T = any>(
    memoizedTargetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // GATE: If no query is provided, do nothing. This prevents the crash.
    if (!memoizedTargetRefOrQuery) {
      setIsLoading(false);
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Add a 10ms delay to allow React state to settle (The "Safety Delay")
    const timeoutId = setTimeout(() => {
        const unsubscribe = onSnapshot(
          memoizedTargetRefOrQuery,
          (snapshot: QuerySnapshot<DocumentData>) => {
            const results = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
            setData(results);
            setIsLoading(false);
          },
          (err: FirestoreError) => {
            if (err.code === 'permission-denied') {
               console.warn("Blocked premature firestore request to protected path");
               setIsLoading(false);
               return; 
            }
            const path = (memoizedTargetRefOrQuery as any).path || "unknown path";
            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path,
            });

            setError(contextualError);
            setIsLoading(false);
            errorEmitter.emit('permission-error', contextualError);
          }
        );
        return () => unsubscribe();
    }, 10);

    return () => {
        clearTimeout(timeoutId);
    };

  }, [memoizedTargetRefOrQuery]);
  
  return { data, isLoading, error };
}
