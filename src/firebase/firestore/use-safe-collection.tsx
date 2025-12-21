
'use client';

import { useMemo } from 'react';
import {
  Query,
  DocumentData,
  CollectionReference,
} from 'firebase/firestore';
import { useUser } from '@/firebase/provider';
import { useCollection, UseCollectionResult, WithId } from './use-collection';

/**
 * A "safe" wrapper around the useCollection hook that prevents queries from
 * running before the user is authenticated.
 *
 * @param queryFactory A function that returns a Firestore query or null.
 * The function receives the user's UID if they are logged in, otherwise null.
 * This prevents creating queries that would fail security rules.
 * @returns The standard useCollection result: [data, isLoading, error].
 * isLoading will be true until authentication is complete and the query has run.
 */
export function useSafeCollection<T = any>(
  queryFactory: (uid: string | null) => CollectionReference<DocumentData> | Query<DocumentData> | null | undefined
): UseCollectionResult<T> {
  const { user, isUserLoading } = useUser();

  // Memoize the query to prevent re-renders. The query is only re-calculated
  // when the user's loading status or UID changes.
  const memoizedQuery = useMemo(() => {
    // If the user state is still loading, we must not generate a query.
    // Return null to act as a "hard brake".
    if (isUserLoading) {
      return null;
    }
    // Pass the user's UID (or null if not logged in) to the factory function.
    return queryFactory(user?.uid || null);
  }, [isUserLoading, user, queryFactory]);

  // Use the original useCollection hook with the safely generated query.
  // If memoizedQuery is null, useCollection will also wait.
  const { data, isLoading: isCollectionLoading, error } = useCollection<T>(memoizedQuery);

  // The final loading state is true if either the user is loading OR the collection is loading.
  const isLoading = isUserLoading || isCollectionLoading;

  return { data, isLoading, error };
}
