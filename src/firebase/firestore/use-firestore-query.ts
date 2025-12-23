
'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Query,
  DocumentData,
  CollectionReference,
  onSnapshot,
  FirestoreError,
  DocumentReference,
} from 'firebase/firestore';
import { useUser } from '@/firebase/provider';
import type { WithId } from './use-collection';

// Add the document reference to the result type
export type WithRef<T> = T & { id: string; ref: DocumentReference<DocumentData> };

interface UseFirestoreQueryResult<T> {
  data: WithRef<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * A robust, auth-aware hook for subscribing to Firestore queries.
 * It strictly waits for a valid user UID before attempting to execute the query factory.
 *
 * @param queryFactory A function that returns a Firestore query. It receives the user's UID.
 * If the factory returns null or undefined, the hook will wait.
 * @returns An object containing the query data, loading state, and any errors.
 */
export function useFirestoreQuery<T = any>(
  queryFactory: (uid: string) => CollectionReference | Query | null | undefined
): UseFirestoreQueryResult<T> {
  const { user, isUserLoading } = useUser();
  const [data, setData] = useState<WithRef<T>[] | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  const memoizedQuery = useMemo(() => {
    if (!user?.uid) {
      return null;
    }
    return queryFactory(user.uid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (!memoizedQuery) {
      setData([]);
      return;
    }
    
    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const results: WithRef<T>[] = [];
        snapshot.forEach((doc) => {
          results.push({ ...(doc.data() as T), id: doc.id, ref: doc.ref });
        });
        setData(results);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Firestore query error:', err);
        setError(err);
        setData(null);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery, isUserLoading]);
  
  const isLoading = (isUserLoading || data === null) && error === null;

  return { data, isLoading, error };
}

/**
 * A variation of the hook for queries that do not depend on user authentication (public data).
 */
export function usePublicFirestoreQuery<T = any>(
  queryFactory: () => CollectionReference | Query | null | undefined
): UseFirestoreQueryResult<T> {
  const [data, setData] = useState<WithRef<T>[] | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const memoizedQuery = useMemo(queryFactory, [queryFactory]);

  useEffect(() => {
    if (!memoizedQuery) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const results: WithRef<T>[] = [];
        snapshot.forEach((doc) => {
          results.push({ ...(doc.data() as T), id: doc.id, ref: doc.ref });
        });
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error('Public Firestore query error:', err);
        setError(err);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  return { data, isLoading, error };
}
