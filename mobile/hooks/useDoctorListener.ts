import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

export const useDoctorListener = (doctorUid: string | null) => {
  const [doctorData, setDoctorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorUid) {
      setDoctorData(null);
      setLoading(false);
      return;
    }

    // Query doctors collection where uid matches
    const q = query(
      collection(db, 'doctors'), 
      where('uid', '==', doctorUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setDoctorData({ id: doc.id, ...doc.data() });
        } else {
          setDoctorData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to doctor:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [doctorUid]);

  return { doctorData, loading };
};