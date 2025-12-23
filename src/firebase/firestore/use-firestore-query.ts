
'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Query,
  DocumentData,
  CollectionReference,
  onSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import { useUser } from '@/firebase/provider';
import type { WithId } from './use-collection';

interface UseFirestoreQueryResult<T> {
  data: WithId<T>[] | null;
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
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  // The effective loading state considers both auth loading and data fetching.
  const isLoading = isUserLoading || (user && data === null && error === null);

  const memoizedQuery = useMemo(() => {
    // **Strict Guard**: Only produce a query if the user is fully loaded and has a UID.
    if (isUserLoading || !user?.uid) {
      return null;
    }
    return queryFactory(user.uid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isUserLoading]); // Depends only on the user object and its loading state.

  useEffect(() => {
    // If there's no valid query (e.g., user is logging out or not yet loaded),
    // clear data and do nothing.
    if (!memoizedQuery) {
      setData(null);
      return;
    }

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const results: WithId<T>[] = [];
        snapshot.forEach((doc) => {
          results.push({ ...(doc.data() as T), id: doc.id });
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

    // Cleanup subscription on unmount or when query changes.
    return () => unsubscribe();
  }, [memoizedQuery]);

  return { data, isLoading, error };
}

/**
 * A variation of the hook for queries that do not depend on user authentication (public data).
 */
export function usePublicFirestoreQuery<T = any>(
  queryFactory: () => CollectionReference | Query | null | undefined
): UseFirestoreQueryResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const memoizedQuery = useMemo(queryFactory, [queryFactory]);

  useEffect(() => {
    if (!memoizedQuery) {
      setIsLoading(false);
      setData(null);
      return;
    }
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const results: WithId<T>[] = [];
        snapshot.forEach((doc) => {
          results.push({ ...(doc.data() as T), id: doc.id });
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
