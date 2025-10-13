import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig"; // adjust path to your firebase.js

export function useAuthListener(setDoctor: any) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "doctors", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDoctor({ uid: user.uid, ...docSnap.data() });
        }
      } else {
        setDoctor(null);
      }
    });

    return unsubscribe; // cleanup when component unmounts
  }, [setDoctor]);
}
