import { db } from "@/firebaseConfig";
import { doc, DocumentData, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useTokenListener(docId: string | null) {
  const [tokenData, setTokenData] = useState<DocumentData | null>(null);

  useEffect(() => {
    if (!docId) return;

    const tokenRef = doc(db, "tokens", docId);
    const unsubscribe = onSnapshot(tokenRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTokenData(data);
      } else {
        console.error("Token document not found");
      }
    });

    return () => unsubscribe();
  }, [docId]);

  return tokenData;
}
