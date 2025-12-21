'use client';

import { useState, useEffect } from 'react';
import { DocumentReference, onSnapshot, DocumentData, FirestoreError } from 'firebase/firestore';

export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
) {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    return () => unsubscribe();
  }, [memoizedDocRef]);

  return { data, isLoading };
}
