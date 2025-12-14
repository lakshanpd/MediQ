import React, { useEffect, useRef } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { UserProvider, useUser } from "@/contexts/userContext";
import "./globals.css";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebaseConfig";
// ...existing code...

function UserRedirect() {
  const { userState, setDoctorStatus, setUserId } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // keep latest pathname without re-triggering effects
  const pathnameRef = useRef<string | null>(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // store unsubscribe so listener is attached only once
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // attach firebase auth listener only when role is doctor
  useEffect(() => {
    if (userState?.role !== "doctor") {
      // cleanup listener if role changed away from doctor
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // if already attached, do nothing
    if (unsubscribeRef.current) return;

    if (!auth || typeof onAuthStateChanged !== "function") return;

    const unsubscribe = onAuthStateChanged(auth, (doctor) => {
      if (doctor) {
        // navigate to the existing doctor tab (doctor/tabs/queue)
        if (pathnameRef.current !== "/doctor/tabs/queue") {
          router.replace("/doctor/tabs/queue" as any);
        }
        setDoctorStatus?.("active");
        setUserId?.(doctor.uid);
        console.log("onAuthStateChanged -> doctor:", doctor.uid);
      } else {
        if (pathnameRef.current !== "/doctor/login") {
          router.replace("/doctor/login" as any);
        }
        setDoctorStatus?.("inactive");
        console.log("onAuthStateChanged -> no doctor");
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // only re-run when role changes (attach once per doctor session)
  }, [userState?.role]);

  return null;
}

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="patient" options={{ headerShown: false }} />
        <Stack.Screen name="doctor" options={{ headerShown: false }} />
      </Stack>
      <UserRedirect />
    </UserProvider>
  );
}
