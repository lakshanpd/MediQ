import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

export const useSessionListener = (sessionId: string | null) => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setSessionData(null);
      setLoading(false);
      return;
    }
    const sessionRef = doc(db, "sessions", sessionId);
    const unsubscribe = onSnapshot(sessionRef,(doc) => {
        if (doc.exists()) {
          setSessionData({ id: doc.id, ...doc.data() });
        } else {
          setSessionData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to session:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  return { sessionData, loading };
};