import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export const useInProgressSessionListener = (sessionId: string | null) => {
  const [currentQueueNumber, setCurrentQueueNumber] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (!sessionId) return;

    const q = query(
      collection(db, "in_progress_sessions"),
      where("session_id", "==", sessionId)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setCurrentQueueNumber(doc.data().in_progress_queue_number);
        } else {
          setCurrentQueueNumber(null);
        }
      },
      (error) => {
        console.error("Error listening to in_progress_session:", error);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  return { currentQueueNumber };
};
