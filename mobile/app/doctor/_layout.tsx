import React, { use, useEffect } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { Doctor, PatientFormData, Session } from "@/types";
import {
  collection,
  getDocs,
  CollectionReference,
  query,
  where,
  limit,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useUser } from "@/contexts/userContext";

// This layout exposes two child routes:
// - /doctor/login (login screen)
// - /doctor/tabs/*  (the tabbed dashboard, implemented in doctor/tabs/_layout.tsx)

function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.replace("/")}>
      <Text style={{ color: "#007AFF", marginLeft: 15 }}>← Back</Text>
    </TouchableOpacity>
  );
}

export default function DoctorLayout() {
  const pathname = usePathname();
  const [doctorMetaData, setDoctorMetaData] = React.useState<
    (Doctor & { id: string }) | null
  >(null);
  const [doctorSessions, setDoctorSessions] = React.useState<Session[] | null>(
    null
  );
  const [doctorTokens, setDoctorTokens] = React.useState<
    PatientFormData[] | null
  >(null);
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

  const fetchDoctorSessions = async (doctorId?: string | null) => {
    if (!doctorId) {
      setDoctorSessions(null);
      return;
    }

    try {
      const sessionsCol = collection(
        db,
        "sessions"
      ) as CollectionReference<Session>;
      const now = Timestamp.fromDate(new Date());
      const q = query(
        sessionsCol,
        where("doctor_id", "==", doctorId),
        orderBy("start_time", "asc")
      );
      const snap = await getDocs(q);

      const sessions: Array<Session & { id: string }> = snap.docs.map(
        (docSnap) => {
          const data = docSnap.data() as Session;
          return { id: docSnap.id, ...data };
        }
      );

      setDoctorSessions(sessions.length ? sessions : []);
    } catch (error) {
      console.error("Error fetching sessions for doctor: ", error);
      setDoctorSessions(null);
    }
  };

  useEffect(() => {
    fetchDoctorMetaData(userState.userId);
    fetchDoctorSessions(userState.userId);
  }, [userState]);

  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: "Form",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen name="tabs" options={{ headerShown: false }} />
    </Stack>
  );
}
