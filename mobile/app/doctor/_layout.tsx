import { DoctorProvider } from "@/contexts/doctorContext";
import { useUser } from "@/contexts/userContext";
import { db } from "@/firebaseConfig";
import { Doctor, Session } from "@/types";
import { Stack, usePathname, useRouter } from "expo-router";
import {
  collection,
  CollectionReference,
  DocumentData,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import React, { useEffect } from "react";
import { Text, TouchableOpacity } from "react-native";

// This layout exposes two child routes:
// - /doctor/login (login screen)
// - /doctor/tabs/*  (the tabbed dashboard, implemented in doctor/tabs/_layout.tsx)

export default function DoctorLayout() {
  const pathname = usePathname();
  const [doctorMetaData, setDoctorMetaData] = React.useState<
    (Doctor & { id: string }) | null
  >(null);
  const [doctorSessions, setDoctorSessions] = React.useState<any[] | null>(
    null
  );
  const [doctorTokens, setDoctorTokens] = React.useState<any[] | null>(null);
  const { userState } = useUser();

  /**
   * Fetch a single doctor document by the `uid` field (not the document id).
   * Example doctor document has a `uid` field which is the Firebase Auth uid.
   */
  const fetchDoctorMetaData = async (uid: string | null) => {
    if (!uid) return;
    try {
      const doctorsCol = collection(
        db,
        "doctors"
      ) as CollectionReference<Doctor>;
      const q = query(doctorsCol, where("uid", "==", uid), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty && snap.docs.length > 0) {
        const docSnap = snap.docs[0];
        const data = docSnap.data() as Doctor;
        setDoctorMetaData({ id: docSnap.id, ...data });
      } else {
        setDoctorMetaData(null);
      }
    } catch (error) {
      console.error("Error fetching doctor by uid: ", error);
      setDoctorMetaData(null);
    }
  };


  useEffect(() => {
    fetchDoctorMetaData(userState.userId);
  }, [userState]);

  useEffect(() => {
    const sessionIds = doctorSessions ? doctorSessions.map((s) => s.id) : []; // up to 10 values allowed

    if (!sessionIds.length) return;

    const q = query(
      collection(db, "tokens"),
      where("session_id", "in", sessionIds)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as DocumentData),
        }));
        setDoctorTokens(items);
      },
      (err) => console.error("tokens snapshot error:", err)
    );

    return () => unsub();
  }, [doctorSessions]);

  useEffect(() => {
    if (!userState.userId) return;

    const sessionsCol = collection(db, "sessions") as CollectionReference<Session>;
    const q = query(
      sessionsCol,
      where("doctor_id", "==", userState.userId),
      orderBy("start_time", "asc")
    );

    // Real-time listener for sessions
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const sessions: (Session & { id: string })[] = snap.docs.map(
          (docSnap) => {
            const data = docSnap.data() as Session;
            return { id: docSnap.id, ...data };
          }
        );
        setDoctorSessions(sessions.length ? sessions : []);
      },
      (error) => {
        console.error("Error listening to sessions:", error);
        setDoctorSessions(null);
      }
    );

    return () => unsubscribe();
  }, [userState.userId]);

  return (
    <DoctorProvider
      value={{
        doctorMetaData,
        doctorSessions: doctorSessions as (Session & { id: string })[] | null,
        doctorTokens: doctorTokens as ({ id: string } & DocumentData)[] | null,
        fetchDoctorMetaData
      }}
    >
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
        <Stack.Screen name="add-session" options={{ headerShown: false }} />
      </Stack>
    </DoctorProvider>
  );
}
